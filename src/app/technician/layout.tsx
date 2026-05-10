import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TechnicianSidebar from '@/components/technician/TechnicianSidebar';
import TechnicianTopBar from '@/components/technician/TechnicianTopBar';

export default async function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role;

  if (userRole === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  if (userRole !== 'TECHNICIAN') {
    redirect('/dashboard');
  }

  const user = {
    firstName: session.user.firstName,
    lastName: session.user.lastName,
  };

  return (
    <div className="bg-surface-container-low text-on-surface font-body text-body min-h-screen antialiased">
      <TechnicianSidebar />
      <TechnicianTopBar firstName={user.firstName} lastName={user.lastName} />
      <main className="ml-[260px] pt-16 min-h-screen bg-surface-container-low">
        {children}
      </main>
    </div>
  );
}
