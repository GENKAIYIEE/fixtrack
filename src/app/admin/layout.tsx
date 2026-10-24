import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth/access';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getActiveSession();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  const user = {
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role,
  };

  return (
    <AdminLayoutClient user={user}>
      {children}
    </AdminLayoutClient>
  );
}

