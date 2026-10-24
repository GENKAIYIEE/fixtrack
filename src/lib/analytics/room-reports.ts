import prisma from '@/lib/prisma';
export const ROOM_CATEGORIES = [
  { key: 'repaired', label: 'Most Frequently Repaired Rooms', description: 'Completed repairs with a completion date in the selected period.' },
  { key: 'reported', label: 'Rooms with the Most Reported Issues', description: 'Requests submitted in the period, including rejected or cancelled reports. This is not a verified-damage count.' },
  { key: 'pending', label: 'Rooms with the Most Pending Requests', description: 'Requests submitted in the period that are currently pending administrator review.' },
  { key: 'slowest', label: 'Rooms with the Longest Average Repair Time', description: 'Average hours from submission to completion, for repairs completed in the period.' },
] as const;
export async function roomReports(start: Date, end: Date, search: string) {
  const rows = await prisma.$queryRaw<{room:string;reported:number;repaired:number;pending:number;averageHours:number|null}[]>`
    WITH locations AS (
      SELECT *, NULLIF(TRIM(COALESCE(NULLIF(TRIM("workLocation"), ''),
        NULLIF(TRIM(CONCAT_WS(' / ', "building"::text, NULLIF(TRIM("roomNumber"), ''))), ''))), '') AS label
      FROM "MaintenanceRequest"
      WHERE ("createdAt" >= ${start} AND "createdAt" <= ${end})
         OR (status::text='COMPLETED' AND "completedAt" >= ${start} AND "completedAt" <= ${end})
    ), grouped AS (
      SELECT MIN(label) AS room,
        COUNT(*) FILTER (WHERE "createdAt" >= ${start} AND "createdAt" <= ${end})::int AS reported,
        COUNT(*) FILTER (WHERE status::text='COMPLETED' AND "completedAt" >= ${start} AND "completedAt" <= ${end})::int AS repaired,
        COUNT(*) FILTER (WHERE status::text='PENDING' AND "createdAt" >= ${start} AND "createdAt" <= ${end})::int AS pending,
        AVG(EXTRACT(EPOCH FROM ("completedAt"-"createdAt"))/3600) FILTER (WHERE status::text='COMPLETED' AND "completedAt" >= ${start} AND "completedAt" <= ${end} AND "completedAt" >= "createdAt")::float8 AS "averageHours"
      FROM locations WHERE label IS NOT NULL AND STRPOS(LOWER(label), LOWER(${search})) > 0
      GROUP BY LOWER(REGEXP_REPLACE(label, '\\s+', ' ', 'g'))
    ) SELECT * FROM grouped`;
  return ROOM_CATEGORIES.map(category => ({ ...category, rows: [...rows].filter(r => category.key==='slowest' ? r.averageHours!==null : r[category.key]>0)
    .sort((a,b) => (category.key==='slowest' ? (b.averageHours ?? 0)-(a.averageHours ?? 0) : b[category.key]-a[category.key]) || a.room.localeCompare(b.room))
    .slice(0,10).map(r=>({room:r.room,value:category.key==='slowest' ? Number(r.averageHours!.toFixed(1)) : r[category.key],unit:category.key==='slowest'?'hours':'requests'})) }));
}
export async function ratingSummary(start: Date, end: Date) {
  const [request,workers] = await Promise.all([
    prisma.requestRating.aggregate({where:{request:{status:'COMPLETED',completedAt:{gte:start,lte:end}}},_avg:{score:true},_count:{score:true}}),
    prisma.$queryRaw<{workerId:string;name:string;average:number;count:number}[]>`SELECT w.id AS "workerId",w.name,AVG(r.score)::float8 AS average,COUNT(*)::int AS count
      FROM "WorkerRating" r JOIN "MaintenanceWorker" w ON w.id=r."workerId" JOIN "MaintenanceRequest" t ON t.id=r."requestId"
      WHERE t.status::text='COMPLETED' AND t."completedAt" >= ${start} AND t."completedAt" <= ${end}
      GROUP BY w.id,w.name ORDER BY average DESC,count DESC,w.name,w.id LIMIT 20`
  ]);
  return {requestAverage:request._avg.score,requestCount:request._count.score,workers};
}
