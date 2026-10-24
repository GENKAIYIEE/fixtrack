import { getActiveSession } from '@/lib/auth/access';
import prisma from '@/lib/prisma';
import { verificationId, VerificationError } from '@/lib/verification/validation';
import { isActiveAdmin } from '@/lib/requests/assignment';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
  try {
    const session = await getActiveSession(['ADMIN']);
    if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    if (session.user.role !== 'ADMIN' || !await isActiveAdmin(session.user.id)) return Response.json({ error: 'Forbidden' }, { status: 403, headers });
    const id = verificationId((await params).id);
    const user = await prisma.user.findUnique({ where: { id }, select: { registrationIdPath: true } });
    if (!user?.registrationIdPath) return Response.json({ error: 'No registration ID photo is on file for this account.' }, { status: 404, headers });
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    const { data: bucket, error: bucketError } = await supabaseAdmin.storage.getBucket('registration-ids');
    if (bucketError || !bucket || bucket.public !== false) return Response.json({ error: 'Private ID storage is unavailable.' }, { status: 503, headers });
    const { data, error } = await supabaseAdmin.storage.from('registration-ids').createSignedUrl(user.registrationIdPath, 60);
    if (error || !data?.signedUrl) return Response.json({ error: 'Could not open the private ID photo. Please retry.' }, { status: 503, headers });
    return Response.json({ url: data.signedUrl, expiresIn: 60 }, { headers });
  } catch (error) { if (error instanceof VerificationError) return Response.json({ error: error.message }, { status: error.status, headers }); return Response.json({ error: 'Could not open the private ID photo. Please retry.' }, { status: 503, headers }); }
}
