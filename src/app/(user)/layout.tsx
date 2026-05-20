import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import UserSidebar from '@/components/user/UserSidebar';
import UserTopBar from '@/components/user/UserTopBar';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

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

  if (role !== 'USER') {
    redirect('/login');
  }

  const user = {
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role,
    avatarUrl: (session.user as { avatarUrl?: string }).avatarUrl,
  };

  return (
    <div className="bg-surface-container-low text-on-surface font-body text-body min-h-screen antialiased">
      <UserSidebar />
      <UserTopBar user={user} />
      <main className="ml-[260px] pt-16 min-h-screen bg-surface-container-low px-8 py-8">
        {children}
      </main>
    </div>
  );
}
