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

  // Approve & Reject both navigate to the request detail page where the admin can act
  const handleApprove = (id: string) => router.push(`/admin/requests/${id}`);
  const handleReject  = (id: string) => router.push(`/admin/requests/${id}`);
  // Assign navigates to assignments page pre-filtered to that request
  // FIXED: BUG-08 — Assign passes requestId query param to assignments page
  const handleAssign  = (id: string) => router.push(`/admin/assignments?requestId=${id}`);

  return (
    <LiveRequestsTable
      requests={requests}
      onApprove={handleApprove}
      onAssign={handleAssign}
      onReject={handleReject}
    />
  );
}
