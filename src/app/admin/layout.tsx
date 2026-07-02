import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';

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
    <div className="bg-[#F1F5F9] text-slate-900 font-body text-body min-h-screen flex antialiased">
      <AdminSidebar />
      <div className="flex-1 ml-[260px] print:ml-0 flex flex-col min-h-screen">
        <AdminTopBar user={user} />
        <main className="flex-1 mt-16 print:mt-0 p-8 print:p-0 max-w-[1440px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
