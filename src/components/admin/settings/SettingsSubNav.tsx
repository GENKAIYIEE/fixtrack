'use client';

interface SettingsSubNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function SettingsSubNav({ activeSection, onSectionChange }: SettingsSubNavProps) {
  const sections = [
    { key: 'general', label: 'General', icon: 'tune' },
    { key: 'notification', label: 'Notification', icon: 'notifications_active' },
    { key: 'request', label: 'Request', icon: 'assignment_turned_in' },
    { key: 'security', label: 'Security', icon: 'security' },
  ];

  return (
    <div className="flex flex-col gap-2 sticky top-[100px]">
      {sections.map((section) => {
        const isActive = activeSection === section.key;
        return (
          <button
            key={section.key}
            onClick={() => onSectionChange(section.key)}
            className={`
              w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors
              ${isActive 
                ? 'bg-surface-container text-secondary font-label-md text-label-md' 
                : 'text-on-surface-variant hover:bg-surface-container-low font-label-md text-label-md'}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">
                {section.icon}
              </span>
              <span>{section.label}</span>
            </div>
            {isActive && (
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
