import prisma from '@/lib/prisma';
import { ratingInput, RatingError } from './validation';
/** Recheck live requester + lock request so a concurrent state change cannot bypass completion. */
export async function saveRatings(userId: string, requestId: string, input: unknown) {
  const data = ratingInput(input);
  return prisma.$transaction(async tx => {
    const users = await tx.$queryRaw<{ id: string; role: string; accountStatus: string }[]>`SELECT id, role::text, "accountStatus"::text FROM "User" WHERE id=${userId} FOR SHARE`;
    if (!users[0] || users[0].role !== 'STUDENT' || users[0].accountStatus !== 'ACTIVE') throw new RatingError('Only an active requester can submit ratings.', 403);
    const rows = await tx.$queryRaw<{ id: string; submittedById: string; status: string }[]>`SELECT id, "submittedById", status::text FROM "MaintenanceRequest" WHERE id=${requestId} FOR UPDATE`;
    const task = rows[0];
    if (!task || task.submittedById !== userId) throw new RatingError('Request not found.', 404);
    if (task.status !== 'COMPLETED') throw new RatingError('Ratings are available only after the request is completed.', 409);
    const recorded = await tx.taskWorkerAssignment.findMany({ where: { requestId, releasedAt: null }, select: { workerId: true } });
    const eligible = new Set(recorded.map(w => w.workerId));
    if (data.workers.some(w => !eligible.has(w.workerId))) throw new RatingError('Only workers recorded on this task at completion may be rated.');
    await tx.requestRating.upsert({ where: { requestId }, create: { requestId, ratedById: userId, score: data.requestScore }, update: { score: data.requestScore } });
    for (const worker of data.workers) await tx.workerRating.upsert({ where: { requestId_workerId: { requestId, workerId: worker.workerId } },
      create: { requestId, ratedById: userId, ...worker }, update: { score: worker.score } });
    return { success: true };
  });
}
export async function ratingDetails(user: { id: string; role: string }, requestId: string) {
  const task = await prisma.maintenanceRequest.findUnique({ where: { id: requestId }, select: {
    submittedById: true, assignedToId: true, status: true,
    rating: { select: { score: true, updatedAt: true } },
    workerRatings: { select: { workerId: true, score: true } },
    workerAssignments: { where: { releasedAt: null }, orderBy: { assignedAt: 'desc' }, select: { workerId: true, workerName: true } },
  } });
  if (!task || !(user.role === 'ADMIN' || (user.role === 'STUDENT' && task.submittedById === user.id) || (user.role === 'TECHNICIAN' && task.assignedToId === user.id))) throw new RatingError('Request not found.', 404);
  const unique = [...new Map(task.workerAssignments.map(w => [w.workerId, w])).values()];
  return { status: task.status, canRate: user.role === 'STUDENT' && task.status === 'COMPLETED', requestScore: task.rating?.score ?? null,
    workers: unique.map(w => ({ ...w, score: task.workerRatings.find(v => v.workerId === w.workerId)?.score ?? null })) };
}
