'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// FIXED: MINOR #4 — Imported Toast to replace alert()
import Toast from '@/components/shared/Toast';

export default function TechnicianSettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('en');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // FIXED: MINOR #4 — Replaced alert() with Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  // Load preferences from local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    if (savedTheme) setTheme(savedTheme);
    
    const savedLang = localStorage.getItem('language');
    if (savedLang) setLanguage(savedLang);

    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');

    const savedCompact = localStorage.getItem('compactMode');
    if (savedCompact !== null) setCompactMode(savedCompact === 'true');
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API delay
    setTimeout(() => {
      localStorage.setItem('theme', theme);
      localStorage.setItem('language', language);
      localStorage.setItem('soundEnabled', String(soundEnabled));
      localStorage.setItem('compactMode', String(compactMode));
      
      setIsSaving(false);
      
      // Optional: Apply theme to document if needed by the app's global state
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference logic
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      // FIXED: MINOR #4 — Toast replaces alert()
      setToast({ message: 'Settings saved successfully!', type: 'success' });
    }, 600);
  };

  return (
    <div className="p-8 max-w-[1000px] mx-auto w-full relative min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] bg-clip-text text-transparent">
            App Settings
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
            Customize your portal experience and display preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-on-primary hover:bg-[#1E3A8A] transition-colors px-6 py-2.5 rounded-lg font-label-md text-label-md flex items-center gap-2 shadow-sm disabled:opacity-50 hover:shadow-md active:scale-95 duration-200"
        >
          {isSaving ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">save</span>
          )}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
        
        {/* Appearance Settings */}
        <section className="bg-surface rounded-3xl border border-outline-variant p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">palette</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-on-surface">Appearance</h2>
              <p className="text-sm text-on-surface-variant">Manage how FixTrack looks on your device.</p>
            </div>
          </div>

          <div className="space-y-6 pl-[52px]">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-3">Theme Preference</label>
              <div className="grid grid-cols-3 gap-4 max-w-[500px]">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                    theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">light_mode</span>
                  <span className="font-medium">Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                    theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">dark_mode</span>
                  <span className="font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                    theme === 'system' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">devices</span>
                  <span className="font-medium">System</span>
                </button>
              </div>
            </div>

            {/* Compact Mode Toggle */}
            <div className="flex items-center justify-between py-4 border-t border-outline-variant max-w-[500px]">
              <div>
                <p className="font-medium text-on-surface">Compact Mode</p>
                <p className="text-sm text-on-surface-variant">Reduce spacing in tables and lists</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={compactMode}
                  onChange={(e) => setCompactMode(e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Accessibility & Regional */}
        <section className="bg-surface rounded-3xl border border-outline-variant p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">public</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-on-surface">Localization & Sound</h2>
              <p className="text-sm text-on-surface-variant">Set your language and audio feedback preferences.</p>
            </div>
          </div>

          <div className="space-y-6 pl-[52px]">
            {/* Language */}
            <div className="max-w-[500px]">
              <label className="block text-sm font-medium text-on-surface mb-2">Display Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-surface border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-primary focus:border-primary block p-3 outline-none transition-shadow"
              >
                <option value="en">English (US)</option>
                <option value="tl">Tagalog (PH)</option>
              </select>
            </div>

            {/* Sound Effects Toggle */}
            <div className="flex items-center justify-between py-4 border-t border-outline-variant max-w-[500px]">
              <div>
                <p className="font-medium text-on-surface">UI Sound Effects</p>
                <p className="text-sm text-on-surface-variant">Play sounds for notifications and actions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>
          </div>
        </section>

        {/* System Information */}
        <section className="bg-surface rounded-3xl border border-outline-variant p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined">info</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-on-surface">About FixTrack</h2>
              <p className="text-sm text-on-surface-variant">System details and support resources.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pl-[52px] max-w-[500px]">
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Version</p>
              <p className="font-medium text-on-surface">v1.0.0 (Beta)</p>
            </div>
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Platform</p>
              <p className="font-medium text-on-surface">Next.js App Router</p>
            </div>
            <div className="col-span-2 mt-2">
              <a href="#" className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium">
                <span className="material-symbols-outlined text-[18px]">help</span>
                View Documentation & Support
              </a>
            </div>
          </div>
        </section>

      </div>

      {/* FIXED: MINOR #4 — Toast replaces alert() */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
