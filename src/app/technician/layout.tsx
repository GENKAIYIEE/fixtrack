import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TechnicianLayoutClient from '@/components/technician/TechnicianLayoutClient';

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
    <TechnicianLayoutClient firstName={user.firstName} lastName={user.lastName}>
      {children}
    </TechnicianLayoutClient>
  );
}
