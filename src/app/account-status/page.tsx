import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { accountMessage, portalForRole } from '@/lib/auth/account-policy';
import SignOutButton from './SignOutButton';
export const dynamic = 'force-dynamic';
export default async function AccountStatusPage() {
  const session=await getServerSession(authOptions);
  const user=session?.user?.id?await prisma.user.findUnique({where:{id:session.user.id},select:{role:true,accountStatus:true,verificationRejectionReason:true}}):null;
  if(user?.accountStatus==='ACTIVE')redirect(portalForRole(user.role));
  const notice=accountMessage(user?.accountStatus || '',user?.verificationRejectionReason);
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><section className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-semibold text-slate-900">{notice.heading}</h1><p className="mt-4 text-slate-700">{notice.message}</p>
    {session?.user?<SignOutButton/>:<Link href="/login" className="mt-6 inline-block font-medium text-blue-900 underline">Return to login</Link>}
  </section></main>;
}
