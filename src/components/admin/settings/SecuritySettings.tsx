'use client';

import { useState, useEffect } from 'react';

interface SecuritySettingsProps {
  settings: Record<string, string>;
  onSave: (sectionId: string, sectionData: Record<string, string>) => Promise<void>;
  isSaving: boolean;
  isActive: boolean;
}

export default function SecuritySettings({ settings, onSave, isSaving, isActive }: SecuritySettingsProps) {
  const [formData, setFormData] = useState({
    security_session_timeout_mins: '60',
    security_min_password_length: '8',
    security_require_strong_password: true,
    security_max_login_attempts: '5',
    security_audit_logging: true,
  });

  useEffect(() => {
    setFormData({
      security_session_timeout_mins: settings.security_session_timeout_mins || '60',
      security_min_password_length: settings.security_min_password_length || '8',
      security_require_strong_password: settings.security_require_strong_password === 'true',
      security_max_login_attempts: settings.security_max_login_attempts || '5',
      security_audit_logging: settings.security_audit_logging === 'true',
    });
  }, [settings]);

  const handleSave = () => {
    const sectionData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, String(value)])
    );
    onSave('security', sectionData);
  };

  const ToggleRow = ({ label, description, dbKey }: { label: string, description: string, dbKey: keyof typeof formData }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col">
        <span className="font-label-md text-label-md text-on-surface">{label}</span>
        <span className="text-body-sm text-on-surface-variant">{description}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          checked={formData[dbKey] as boolean} 
          onChange={(e) => setFormData({ ...formData, [dbKey]: e.target.checked })}
          className="sr-only peer" 
        />
        <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
      </label>
    </div>
  );

  return (
    <div id="security" className="bg-surface-container-lowest rounded-xl shadow-[0_12px_24px_-12px_rgba(30,58,138,0.06)] border border-outline-variant/40 overflow-hidden relative">
      <div className={`absolute top-0 left-0 w-full h-[3px] bg-secondary transition-opacity duration-300 ${isActive ? 'opacity-80' : 'opacity-20'}`} />
      
      <div className="p-lg md:p-8">
        <h2 className="font-h2 text-h2 text-on-surface mb-6">Security Settings</h2>
        
        <div className="flex flex-col gap-6">
          {/* Session Timeout */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface">Session Timeout</label>
            <div className="flex items-center">
              <input
                type="number"
                value={formData.security_session_timeout_mins}
                onChange={(e) => setFormData({ ...formData, security_session_timeout_mins: e.target.value })}
                className="w-32 bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-secondary transition-colors"
              />
              <span className="font-label-md text-label-md text-on-surface-variant ml-2">minutes</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">Automatically log out inactive users after this many minutes.</p>
          </div>

          <div className="h-px w-full bg-outline-variant/30" />

          {/* Min Password Length */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface">Minimum Password Length</label>
            <div className="flex items-center">
              <input
                type="number"
                value={formData.security_min_password_length}
                onChange={(e) => setFormData({ ...formData, security_min_password_length: e.target.value })}
                className="w-32 bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-secondary transition-colors"
              />
              <span className="font-label-md text-label-md text-on-surface-variant ml-2">characters</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">Minimum number of characters required for all user passwords.</p>
          </div>

          <div className="h-px w-full bg-outline-variant/30" />

          <ToggleRow 
            label="Require Strong Password" 
            description="Enforce uppercase, lowercase, number, and special character requirements." 
            dbKey="security_require_strong_password" 
          />

          <div className="h-px w-full bg-outline-variant/30" />

          {/* Max Login Attempts */}
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface">Max Login Attempts</label>
            <div className="flex items-center">
              <input
                type="number"
                value={formData.security_max_login_attempts}
                onChange={(e) => setFormData({ ...formData, security_max_login_attempts: e.target.value })}
                className="w-32 bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-secondary transition-colors"
              />
              <span className="font-label-md text-label-md text-on-surface-variant ml-2">attempts</span>
            </div>
            <p className="text-body-sm text-on-surface-variant">Number of failed login attempts before an account is temporarily locked.</p>
          </div>

          <div className="h-px w-full bg-outline-variant/30" />

          <div>
            <ToggleRow 
              label="Enable Audit Logging" 
              description="Record all system actions in the audit log. Disabling this is not recommended." 
              dbKey="security_audit_logging" 
            />
            {!formData.security_audit_logging && (
              <div className="text-error text-xs mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>Warning: Disabling audit logging reduces system accountability.</span>
              </div>
            )}
          </div>
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
