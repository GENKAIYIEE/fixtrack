'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UrgentTaskBanner from '@/components/technician/UrgentTaskBanner';
import DashboardKpiRow from '@/components/technician/DashboardKpiRow';
import ActiveTaskCards from '@/components/technician/ActiveTaskCards';

type KpiData = {
  totalAssigned: number;
  ongoing: number;
  completedToday: number;
  completedThisMonth: number;
};

type Submitter = {
  firstName: string;
  lastName: string;
};

type ActiveTask = {
  id: string;
  requestCode: string;
  issueType: string;
  building: string;
  roomNumber: string;
  description: string;
  urgencyLevel: string;
  status: string;
  createdAt: string;
  submitter: Submitter;
};

type UrgentTask = {
  id: string;
  description: string;
  requestCode: string;
} | null;

type TechnicianInfo = {
  firstName: string;
  lastName: string;
  specialization: string | null;
};

type DashboardData = {
  kpis: KpiData;
  activeTasks: ActiveTask[];
  urgentTask: UrgentTask;
  technician: TechnicianInfo;
};

const SPECIALIZATION_LABELS: Record<string, string> = {
  HVAC: 'HVAC',
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  CARPENTRY: 'Carpentry',
  GENERAL: 'General',
};

export default function TechnicianDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/technician/dashboard')
      .then((r) => r.json())
      .then((d: DashboardData) => {
        setData(d);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const technician = data?.technician;
  const specializationLabel = technician?.specialization
    ? SPECIALIZATION_LABELS[technician.specialization] ?? technician.specialization
    : 'General';

  return (
    <div className="p-8 max-w-[1440px] mx-auto w-full">
      {/* Urgent Banner */}
      <UrgentTaskBanner urgentTask={data?.urgentTask ?? null} />

      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-9 w-64 bg-slate-200 rounded mb-3" />
              <div className="h-7 w-48 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              <h1 className="font-h1 text-h1 text-on-surface flex items-center gap-3 mb-3">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontVariationSettings: "'FILL' 1", fontSize: '36px' }}
                >
                  engineering
                </span>
                Welcome, {technician?.firstName ?? ''}
              </h1>
              <div className="bg-primary-container text-on-primary-container px-3 py-1.5 rounded-full inline-flex items-center gap-2">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}
                >
                  build_circle
                </span>
                <span className="font-sidebar-label text-sidebar-label uppercase">
                  Technician — {specializationLabel} Specialist
                </span>
              </div>
            </>
          )}
        </div>

        {/* View Schedule button */}
        <button
          onClick={() => router.push('/technician/tasks')}
          className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surface-variant transition-colors duration-200 font-label-md text-label-md flex-shrink-0 mt-1"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            calendar_today
          </span>
          View Schedule
        </button>
      </div>

      {/* KPI Row */}
      <DashboardKpiRow
        kpis={
          data?.kpis ?? {
            totalAssigned: 0,
            ongoing: 0,
            completedToday: 0,
            completedThisMonth: 0,
          }
        }
        isLoading={isLoading}
      />

      {/* Active Task Cards */}
      <ActiveTaskCards tasks={data?.activeTasks ?? []} isLoading={isLoading} />
    </div>
  );
}
