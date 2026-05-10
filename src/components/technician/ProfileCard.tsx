import React from 'react';

export interface TechnicianProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  idNumber: string;
  department: string;
  contactNumber: string | null;
  role: string;
  specialization: string | null;
  accountStatus: string;
  avatarUrl: string | null;
}

interface ProfileCardProps {
  user: TechnicianProfile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  const getInitials = () => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const mapSpecialization = (spec: string | null) => {
    switch (spec) {
      case 'HVAC':
        return 'HVAC Specialist';
      case 'ELECTRICAL':
        return 'Electrical Specialist';
      case 'PLUMBING':
        return 'Plumbing Specialist';
      case 'CARPENTRY':
        return 'Carpentry Specialist';
      case 'GENERAL':
        return 'General Maintenance';
      default:
        return 'General Maintenance';
    }
  };

  const handleAvatarClick = () => {
    // Show toast for avatar coming soon
    alert('Avatar upload coming soon.');
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] border border-slate-100 overflow-hidden relative">
      {/* Decorative header banner */}
      <div className="h-24 bg-[#1E3A8A] w-full" />

      <div className="px-6 pb-6">
        {/* Avatar section */}
        <div className="relative w-24 h-24 rounded-full bg-[#2563EB] text-white text-3xl font-bold border-4 border-white shadow-lg -mt-12 mx-auto flex items-center justify-center overflow-hidden group">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            getInitials()
          )}
          <div
            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handleAvatarClick}
          >
            <span className="material-symbols-outlined text-white text-[24px]">
              photo_camera
            </span>
          </div>
        </div>

        {/* Below avatar */}
        <h2 className="text-xl font-bold text-slate-800 text-center mt-3">
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-sm text-slate-500 text-center mt-1">
          ID: {user.idNumber}
        </p>
        <div className="bg-[#1E3A8A] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider mx-auto mt-2 w-fit">
          TECHNICIAN
        </div>
      </div>

      {/* Stats section */}
      <div className="border-t border-slate-100 pt-4 px-6 pb-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Specialization</span>
          <span className="text-sm font-medium text-slate-700">{mapSpecialization(user.specialization)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
          <div className="flex items-center gap-1.5">
            {user.accountStatus === 'ACTIVE' && (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-600 font-semibold text-sm">Active</span>
              </>
            )}
            {user.accountStatus === 'INACTIVE' && (
              <>
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="text-slate-500 font-semibold text-sm">Inactive</span>
              </>
            )}
            {user.accountStatus === 'PENDING' && (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-600 font-semibold text-sm">Pending</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
