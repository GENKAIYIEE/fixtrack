import { redirect } from 'next/navigation';
import { getActiveSession } from '@/lib/auth/access';
import UserLayoutClient from '@/components/user/UserLayoutClient';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getActiveSession();

  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role;

  if (role === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  if (role === 'TECHNICIAN') {
    redirect('/technician/dashboard');
  }

  if (role !== 'STUDENT') {
    redirect('/login');
  }

  const user = {
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role,
    avatarUrl: (session.user as { avatarUrl?: string }).avatarUrl,
  };

  return (
    <UserLayoutClient user={user}>
      {children}
    </UserLayoutClient>
  );
}
