import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

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
