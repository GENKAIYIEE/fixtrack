import React from 'react';

export interface NotifPreferences {
  taskAssigned: boolean;
  reminders: boolean;
  adminUpdates: boolean;
}

interface ProfileNotifCardProps {
  preferences: NotifPreferences;
  onChange: (key: keyof NotifPreferences, value: boolean) => void;
}

export const ProfileNotifCard: React.FC<ProfileNotifCardProps> = ({ preferences, onChange }) => {
  const toggleItems = [
    {
      key: 'taskAssigned' as const,
      label: 'New Task Assignments',
      description: 'Receive alerts when a new maintenance request is assigned to you.',
    },
    {
      key: 'reminders' as const,
      label: 'Task Reminders',
      description: 'Get notified for urgent tasks approaching their SLA deadline.',
    },
    {
      key: 'adminUpdates' as const,
      label: 'Admin Updates',
      description: 'Facility-wide announcements and procedural changes.',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(30,58,138,0.08)] border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-3">
        <span className="material-symbols-outlined text-[#2563EB]">notifications</span>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Notification Preferences
        </h3>
      </div>

      <div className="p-6">
        <div className="flex flex-col">
          {toggleItems.map((item) => (
            <div
              key={item.key}
              className="flex items-start justify-between py-4 border-b border-slate-100 last:border-0"
            >
              <div className="flex flex-col pr-4">
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                <span className="text-xs text-slate-400 mt-0.5">{item.description}</span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences[item.key]}
                  onChange={(e) => onChange(item.key, e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
