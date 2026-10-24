import { getActiveSession } from '@/lib/auth/access';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { BUILDINGS, getBuildingLabel } from '@/lib/constants/buildings';
import { requestDateToday } from '@/lib/requests/form';
import OfficialRequestForm from '@/components/user/OfficialRequestForm';

export default async function NewRequestPage({ searchParams }: {
  searchParams: Promise<{ building?: string | string[]; room?: string | string[] }>;
}) {
  const session = await getActiveSession();
  if (!session?.user || session.user.role !== 'STUDENT') redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== 'STUDENT' || user.accountStatus !== 'ACTIVE') redirect('/login');
  const query = await searchParams;
  const building = typeof query.building === 'string' && BUILDINGS.some(b => b.value === query.building)
    ? getBuildingLabel(query.building) : '';
  const room = typeof query.room === 'string' ? query.room.slice(0, 200) : '';
  return <OfficialRequestForm requestDate={requestDateToday()} requestingParty={`${user.firstName} ${user.lastName}`.trim()} initialLocation={[building, room].filter(Boolean).join(' — ')} />;
}
