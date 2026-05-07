'use client';

import { useState, useEffect } from 'react';

interface NotificationSettingsProps {
  settings: Record<string, string>;
  onSave: (sectionId: string, sectionData: Record<string, string>) => Promise<void>;
  isSaving: boolean;
  isActive: boolean;
}

export default function NotificationSettings({ settings, onSave, isSaving, isActive }: NotificationSettingsProps) {
  const [formData, setFormData] = useState<Record<string, boolean>>({
    notif_global_email: true,
    notif_push: false,
    notif_request_submitted: true,
    notif_task_assigned: true,
    notif_request_completed: true,
    notif_request_rejected: true,
  });

  useEffect(() => {
    setFormData({
      notif_global_email: settings.notif_global_email === 'true',
      notif_push: settings.notif_push === 'true',
      notif_request_submitted: settings.notif_request_submitted === 'true',
      notif_task_assigned: settings.notif_task_assigned === 'true',
      notif_request_completed: settings.notif_request_completed === 'true',
      notif_request_rejected: settings.notif_request_rejected === 'true',
    });
  }, [settings]);

  const handleSave = () => {
    const sectionData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, String(value)])
    );
    onSave('notification', sectionData);
  };

  const ToggleRow = ({ label, description, dbKey }: { label: string, description: string, dbKey: string }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col">
        <span className="font-label-md text-label-md text-on-surface">{label}</span>
        <span className="text-body-sm text-on-surface-variant">{description}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          checked={formData[dbKey]} 
          onChange={(e) => setFormData({ ...formData, [dbKey]: e.target.checked })}
          className="sr-only peer" 
        />
        <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
      </label>
    </div>
  );

  return (
    <div id="notification" className="bg-surface-container-lowest rounded-xl shadow-[0_12px_24px_-12px_rgba(30,58,138,0.06)] border border-outline-variant/40 overflow-hidden relative">
      <div className={`absolute top-0 left-0 w-full h-[3px] bg-secondary transition-opacity duration-300 ${isActive ? 'opacity-80' : 'opacity-20'}`} />
      
      <div className="p-lg md:p-8">
        <h2 className="font-h2 text-h2 text-on-surface mb-6">Notification Settings</h2>
        
        <div className="flex flex-col">
          <ToggleRow 
            label="Global Email Alerts" 
            description="Send email notifications for all critical maintenance updates." 
            dbKey="notif_global_email" 
          />
          <div className="h-px w-full bg-outline-variant/30" />
          <ToggleRow 
            label="Push Notifications" 
            description="Enable mobile and desktop browser push alerts." 
            dbKey="notif_push" 
          />
          <div className="h-px w-full bg-outline-variant/30" />
          <ToggleRow 
            label="Request Submitted Alert" 
            description="Notify admin when a new maintenance request is submitted." 
            dbKey="notif_request_submitted" 
          />
          <div className="h-px w-full bg-outline-variant/30" />
          <ToggleRow 
            label="Task Assignment Alert" 
            description="Notify technician when a task is assigned to them." 
            dbKey="notif_task_assigned" 
          />
          <div className="h-px w-full bg-outline-variant/30" />
          <ToggleRow 
            label="Request Completed Alert" 
            description="Notify the requester when their request is marked as completed." 
            dbKey="notif_request_completed" 
          />
          <div className="h-px w-full bg-outline-variant/30" />
          <ToggleRow 
            label="Rejection/Cancellation Alert" 
            description="Notify the requester when their request is rejected or cancelled." 
            dbKey="notif_request_rejected" 
          />
        </div>

        <div className="mt-8 pt-6 border-t border-outline-variant/30 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-secondary text-on-secondary px-6 py-2.5 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
