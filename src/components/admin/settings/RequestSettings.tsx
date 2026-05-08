'use client';

import { useState, useEffect } from 'react';

interface RequestSettingsProps {
  settings: Record<string, string>;
  onSave: (sectionId: string, sectionData: Record<string, string>) => Promise<void>;
  isSaving: boolean;
  isActive: boolean;
}

const ToggleRow = ({ 
  label, 
  description, 
  checked,
  onChange
}: { 
  label: string, 
  description: string, 
  checked: boolean,
  onChange: (checked: boolean) => void
}) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex flex-col">
      <span className="font-label-md text-label-md text-on-surface">{label}</span>
      <span className="text-body-sm text-on-surface-variant">{description}</span>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer" 
      />
      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
    </label>
  </div>
);

export default function RequestSettings({ settings, onSave, isSaving, isActive }: RequestSettingsProps) {
  const [formData, setFormData] = useState({
    request_max_photo_mb: '5',
    request_auto_assign: false,
    request_allow_user_cancel: true,
    request_expiry_days: '30',
    request_require_photo: false,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      request_max_photo_mb: settings.request_max_photo_mb || '5',
      request_auto_assign: settings.request_auto_assign === 'true',
      request_allow_user_cancel: settings.request_allow_user_cancel === 'true',
      request_expiry_days: settings.request_expiry_days || '30',
      request_require_photo: settings.request_require_photo === 'true',
    });
  }, [settings]);

  const handleSave = () => {
    const sectionData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, String(value)])
    );
    onSave('request', sectionData);
  };



  return (
    <div id="request" className="bg-surface-container-lowest rounded-xl shadow-[0_12px_24px_-12px_rgba(30,58,138,0.06)] border border-outline-variant/40 overflow-hidden relative">
      <div className={`absolute top-0 left-0 w-full h-[3px] bg-secondary transition-opacity duration-300 ${isActive ? 'opacity-80' : 'opacity-20'}`} />
      
      <div className="p-lg md:p-8">
        <h2 className="font-h2 text-h2 text-on-surface mb-6">Request Settings</h2>
        
        <div className="flex flex-col gap-6">
          {/* Max Photo Upload Size */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface">Max Photo Upload Size</label>
            <div className="flex items-center">
              <input
                type="number"
                value={formData.request_max_photo_mb}
                onChange={(e) => setFormData({ ...formData, request_max_photo_mb: e.target.value })}
                className="w-32 bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-secondary transition-colors"
              />
              <span className="font-label-md text-label-md text-on-surface-variant ml-2">MB</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">Maximum file size for photo attachments on maintenance requests.</p>
          </div>

          <div className="h-px w-full bg-outline-variant/30" />

          <ToggleRow 
            label="Auto-Assign Requests" 
            description="Automatically assign incoming requests to available technicians based on specialization." 
            checked={formData.request_auto_assign}
            onChange={(checked) => setFormData({ ...formData, request_auto_assign: checked })}
          />

          <div className="h-px w-full bg-outline-variant/30" />

          <ToggleRow 
            label="Allow Request Cancellation by User" 
            description="Allow users (students/faculty/staff) to cancel their own pending requests." 
            checked={formData.request_allow_user_cancel}
            onChange={(checked) => setFormData({ ...formData, request_allow_user_cancel: checked })}
          />

          <div className="h-px w-full bg-outline-variant/30" />

          {/* Request Expiry Days */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface">Request Expiry Days</label>
            <div className="flex items-center">
              <input
                type="number"
                value={formData.request_expiry_days}
                onChange={(e) => setFormData({ ...formData, request_expiry_days: e.target.value })}
                className="w-32 bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-secondary transition-colors"
              />
              <span className="font-label-md text-label-md text-on-surface-variant ml-2">days</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">Number of days before an unresolved pending request is automatically flagged for review.</p>
          </div>

          <div className="h-px w-full bg-outline-variant/30" />

          <ToggleRow 
            label="Require Photo on Submission" 
            description="Make photo attachment mandatory when submitting a maintenance request." 
            checked={formData.request_require_photo}
            onChange={(checked) => setFormData({ ...formData, request_require_photo: checked })}
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
