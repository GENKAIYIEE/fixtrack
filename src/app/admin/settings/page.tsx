'use client';

import React, { useState, useEffect, useCallback } from 'react';
import SettingsSubNav from '@/components/admin/settings/SettingsSubNav';
import GeneralSettings from '@/components/admin/settings/GeneralSettings';
import NotificationSettings from '@/components/admin/settings/NotificationSettings';
import RequestSettings from '@/components/admin/settings/RequestSettings';
import SecuritySettings from '@/components/admin/settings/SecuritySettings';
import Toast from '@/components/shared/Toast';

const SECTIONS = ['general', 'notification', 'request', 'security'] as const;
type Section = (typeof SECTIONS)[number];

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 overflow-hidden animate-pulse">
      <div className="h-[3px] w-full bg-surface-container-highest" />
      <div className="p-8 flex flex-col gap-6">
        <div className="h-7 w-48 bg-surface-container-high rounded-lg" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-32 bg-surface-container rounded" />
          <div className="h-10 max-w-xl bg-surface-container rounded-lg" />
          <div className="h-3 w-64 bg-surface-container-low rounded" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-4 w-40 bg-surface-container rounded" />
          <div className="h-10 max-w-xl bg-surface-container rounded-lg" />
          <div className="h-3 w-56 bg-surface-container-low rounded" />
        </div>
        <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-end">
          <div className="h-10 w-32 bg-surface-container-high rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<Section>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [toastConfig, setToastConfig] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToastConfig({ show: true, message, type });
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error(err);
        showToast('Failed to load settings', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  // Per-section save handler
  const handleSave = useCallback(
    async (sectionId: string, sectionData: Record<string, string>) => {
      setSavingSection(sectionId);
      try {
        const entries = Object.entries(sectionData).map(([key, value]) => ({ key, value }));
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: entries }),
        });
        if (res.ok) {
          setSettings((prev) => ({ ...prev, ...sectionData }));
          showToast('Settings saved successfully', 'success');
        } else {
          showToast('Failed to save settings', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to save settings', 'error');
      } finally {
        setSavingSection(null);
      }
    },
    [showToast]
  );

  // Smooth scroll to section on sub-nav click
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section as Section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      for (const section of [...SECTIONS].reverse()) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="font-h1 text-h1 text-on-surface">System Settings</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
          Manage global configurations, notifications, and security protocols.
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Column — Sub Nav */}
        <div className="col-span-12 md:col-span-3">
          <SettingsSubNav
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </div>

        {/* Right Column — Section Cards */}
        <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <GeneralSettings
                settings={settings}
                onSave={handleSave}
                isSaving={savingSection === 'general'}
                isActive={activeSection === 'general'}
                showToast={showToast}
              />
              <NotificationSettings
                settings={settings}
                onSave={handleSave}
                isSaving={savingSection === 'notification'}
                isActive={activeSection === 'notification'}
              />
              <RequestSettings
                settings={settings}
                onSave={handleSave}
                isSaving={savingSection === 'request'}
                isActive={activeSection === 'request'}
              />
              <SecuritySettings
                settings={settings}
                onSave={handleSave}
                isSaving={savingSection === 'security'}
                isActive={activeSection === 'security'}
              />
            </>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastConfig.show && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onDismiss={() => setToastConfig((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
