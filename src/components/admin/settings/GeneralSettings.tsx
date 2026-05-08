'use client';

import { useState, useEffect } from 'react';

interface GeneralSettingsProps {
  settings: Record<string, string>;
  onSave: (sectionId: string, sectionData: Record<string, string>) => Promise<void>;
  isSaving: boolean;
  isActive: boolean;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function GeneralSettings({ settings, onSave, isSaving, isActive, showToast }: GeneralSettingsProps) {
  const [formData, setFormData] = useState({
    platform_name: '',
    institution_name: '',
    logo_url: '',
    support_email: '',
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      platform_name: settings.platform_name || 'FixTrack — Polytechnic College of La Union',
      institution_name: settings.institution_name || 'Polytechnic College of La Union',
      logo_url: settings.logo_url || '',
      support_email: settings.support_email || 'support@pclu.edu.ph',
    });
  }, [settings]);

  const handleSave = () => {
    onSave('general', formData);
  };

  const handleLogoUpload = () => {
    showToast('File upload coming soon.', 'success');
  };

  return (
    <div id="general" className="bg-surface-container-lowest rounded-xl shadow-[0_12px_24px_-12px_rgba(30,58,138,0.06)] border border-outline-variant/40 overflow-hidden relative">
      <div className={`absolute top-0 left-0 w-full h-[3px] bg-secondary transition-opacity duration-300 ${isActive ? 'opacity-80' : 'opacity-20'}`} />
      
      <div className="p-lg md:p-8">
        <h2 className="font-h2 text-h2 text-on-surface mb-6">General Settings</h2>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <label className="font-label-md text-label-md text-on-surface">Platform Name</label>
            <input
              type="text"
              value={formData.platform_name}
              onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
              className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-secondary transition-colors"
            />
            <p className="text-body-sm text-on-surface-variant">This name will be displayed in the TopAppBar and automated emails.</p>
          </div>

          <div className="flex flex-col gap-2 max-w-xl">
            <label className="font-label-md text-label-md text-on-surface">Institution Name</label>
            <input
              type="text"
              value={formData.institution_name}
              onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
              className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-secondary transition-colors"
            />
            <p className="text-body-sm text-on-surface-variant">Full official name of the institution for use in reports and documents.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-md text-label-md text-on-surface">Organization Logo</label>
            <div className="flex items-center gap-4">
              <div 
                onClick={handleLogoUpload}
                className="w-20 h-20 rounded-xl bg-surface-container border border-outline-variant border-dashed flex items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors overflow-hidden"
              >
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant">add_photo_alternate</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleLogoUpload}
                  className="px-4 py-2 bg-surface border border-outline-variant rounded-lg font-label-md text-label-md hover:bg-surface-container-low shadow-sm transition-colors"
                >
                  Upload New Logo
                </button>
                <p className="text-body-sm text-on-surface-variant">Recommended size: 256x256px (PNG, SVG). Max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-w-xl">
            <label className="font-label-md text-label-md text-on-surface">Support Email</label>
            <input
              type="email"
              value={formData.support_email}
              onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
              className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-secondary transition-colors"
            />
            <p className="text-body-sm text-on-surface-variant">Reply-to address used in automated notification emails.</p>
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
