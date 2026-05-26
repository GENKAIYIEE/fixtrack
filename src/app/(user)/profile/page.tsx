import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function UserProfilePage() {
  // 1. Fetch user session
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login');
  }

  // 2. Fetch real student data from DB based on session
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      idNumber: true,
      department: true,
      contactNumber: true,
      role: true,
      accountStatus: true,
      createdAt: true,
    },
  });

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto py-12 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-error text-6xl mb-4">error</span>
        <h2 className="text-xl font-bold text-on-surface">User profile not found.</h2>
        <p className="text-outline mt-2">Please contact the administration.</p>
      </div>
    );
  }

  // 3. Premium UI Layout
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-2">
        <h1 className="font-h1 text-h1 text-on-surface flex items-center gap-3 text-4xl font-extrabold tracking-tight">
          <span 
            className="material-symbols-outlined text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary" 
            style={{ fontVariationSettings: "'FILL' 1", fontSize: '36px' }}
          >
            person
          </span>
          My Profile
        </h1>
        <p className="text-on-surface-variant text-base font-medium">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* ── Profile Card ── */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-xl shadow-primary/5 border border-outline-variant overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
        
        {/* Premium Header Banner Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary px-8 py-12">
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl"></div>
          
          <div className="flex items-center gap-8 relative z-10">
            {/* Premium Avatar */}
            <div className="relative group">
              <div className="absolute inset-0 bg-white rounded-full opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="w-28 h-28 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center text-4xl font-extrabold shrink-0 shadow-lg border-4 border-white/20 relative z-10">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 border-4 border-surface-container-lowest rounded-full z-20" title="Active"></div>
            </div>
            
            {/* Name and Status */}
            <div className="flex flex-col text-white">
              <h2 className="text-4xl font-bold tracking-tight drop-shadow-sm">
                {user.firstName} {user.lastName}
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-white/80 font-medium tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">badge</span>
                  {user.idNumber}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/50"></span>
                <span className="text-white/80 font-medium tracking-wide flex items-center gap-1.5 capitalize">
                  <span className="material-symbols-outlined text-sm">work</span>
                  {user.role.toLowerCase()}
                </span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full mt-4 self-start shadow-sm border border-white/10 transition-transform duration-300 hover:scale-105 cursor-default">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
                <span className="text-xs font-bold tracking-widest uppercase">
                  {user.accountStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid Section */}
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12 bg-gradient-to-b from-surface-container-lowest to-surface-container-low/30">
          
          {/* Column 1: Personal Details */}
          <div className="flex flex-col gap-6 relative">
            <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Personal Details</h3>
            </div>
            
            <div className="flex flex-col gap-6 mt-2">
              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">Full Name</label>
                <div className="text-on-surface font-semibold text-lg">{user.firstName} {user.lastName}</div>
              </div>
              
              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">Department</label>
                <div className="text-on-surface font-semibold text-lg">
                  {user.department || <span className="text-outline italic font-medium">Not assigned</span>}
                </div>
              </div>

              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">System Role</label>
                <div className="text-on-surface font-semibold text-lg capitalize flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  {user.role.toLowerCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Contact & Account Credentials */}
          <div className="flex flex-col gap-6 relative">
            <div className="flex items-center gap-3 border-b border-outline-variant/60 pb-4">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>contact_mail</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Contact & Credentials</h3>
            </div>
            
            <div className="flex flex-col gap-6 mt-2">
              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">Email Address</label>
                <div className="text-on-surface font-semibold text-lg flex items-center gap-2">
                  {user.email}
                </div>
              </div>

              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">Contact Number</label>
                <div className="text-on-surface font-semibold text-lg">
                  {user.contactNumber || <span className="text-outline italic font-medium">Not provided</span>}
                </div>
              </div>

              <div className="group transition-colors duration-200 hover:bg-surface-container-low p-3 -mx-3 rounded-xl">
                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-1.5">Member Since</label>
                <div className="text-on-surface font-semibold text-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>calendar_month</span>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
