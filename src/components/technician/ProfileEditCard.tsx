import React from 'react';

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  specialization: string;
}

interface ProfileEditCardProps {
  formData: ProfileFormData;
  onChange: (field: keyof ProfileFormData, value: string) => void;
}

export const ProfileEditCard: React.FC<ProfileEditCardProps> = ({ formData, onChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
        <span className="material-symbols-outlined text-[#2563EB]">person</span>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Contact & Professional Info
        </h3>
      </div>

      {/* Form Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div className="col-span-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="col-span-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="col-span-1 relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                mail
              </span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onChange('email', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="col-span-1 relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Phone Number
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                call
              </span>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => onChange('contactNumber', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="md:col-span-2 relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Primary Specialization
            </label>
            <div className="relative">
              <select
                value={formData.specialization}
                onChange={(e) => onChange('specialization', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all placeholder:text-slate-400 appearance-none"
              >
                <option value="HVAC">HVAC Specialist</option>
                <option value="ELECTRICAL">Electrical Systems</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="CARPENTRY">Carpentry</option>
                <option value="GENERAL">General Maintenance</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                expand_more
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              This determines the type of maintenance requests routed to your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
