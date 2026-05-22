'use client';

// FIXED: BUG-08 — Thin client wrapper so the server-rendered dashboard can pass
// real navigation handlers to LiveRequestsTable (which is a client component).
import { useRouter } from 'next/navigation';
import LiveRequestsTable from '@/components/admin/LiveRequestsTable';
import type { MaintenanceRequest } from '@prisma/client';

type Props = {
  requests: Partial<MaintenanceRequest>[];
};

export default function DashboardLiveRequests({ requests }: Props) {
  const router = useRouter();

  // View navigates to the request detail page where the admin can act
  const handleView = (id: string) => router.push(`/admin/requests/${id}`);

  return (
    <LiveRequestsTable
      requests={requests}
      onView={handleView}
    />
  );
}
