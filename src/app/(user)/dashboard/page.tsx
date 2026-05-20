'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentDashboardKpiRow from '@/components/user/StudentDashboardKpiRow';
import StudentRecentRequests from '@/components/user/StudentRecentRequests';
import StudentRecentNotifs from '@/components/user/StudentRecentNotifs';

type KpiData = {
  totalRequests: number;
  pendingCount: number;
  ongoingCount: number;
  completedCount: number;
};

type Request = {
  id: string;
  requestCode: string;
  issueType: string;
  building: string;
  roomNumber: string;
  status: string;
  createdAt: string;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  requestId: string | null;
  createdAt: string;
};

type DashboardData = {
  kpis: KpiData;
  recentRequests: Request[];
  recentNotifications: Notification[];
  unreadCount: number;
  student: {
    firstName: string;
    department: string;
  } | null;
};

export default function UserDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = data?.student?.firstName ?? 'Student';
  const department = data?.student?.department ?? '';

  useEffect(() => {
    fetch('/api/user/dashboard')
      .then((r) => r.json())
      .then((d: DashboardData) => {
        setData(d);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const showCtaBanner = !isLoading && (data?.kpis.totalRequests ?? 0) === 0;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="font-h1 text-h1 text-on-surface flex items-center gap-3 text-3xl font-bold">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              waving_hand
            </span>
            Welcome back, {firstName}!
          </h1>
          {department && (
            <div className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-3 py-1.5 rounded-full mt-2 self-start">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                school
              </span>
              <span className="font-sidebar-label text-sidebar-label uppercase text-xs tracking-wider">
                Student — {department}
              </span>
            </div>
          )}
        </div>

        {/* Right CTA button */}
        <button
          onClick={() => router.push('/requests/new')}
          className="bg-secondary text-on-secondary hover:bg-primary transition-colors px-6 py-3 rounded-lg font-label-md text-label-md flex items-center gap-2 shadow-md self-start sm:self-auto"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
          >
            add_circle
          </span>
          Submit New Request
        </button>
      </div>



      {/* ── KPI Row ── */}
      <StudentDashboardKpiRow
        data={data?.kpis ?? null}
        isLoading={isLoading}
      />

      {/* ── Two-column section ── */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recent Requests — left 8 cols */}
        <div className="col-span-12 lg:col-span-8">
          <StudentRecentRequests
            requests={data?.recentRequests ?? null}
            isLoading={isLoading}
          />
        </div>

        {/* Recent Notifications — right 4 cols */}
        <div className="col-span-12 lg:col-span-4">
          <StudentRecentNotifs
            notifications={data?.recentNotifications ?? null}
            unreadCount={data?.unreadCount ?? 0}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
