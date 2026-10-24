import ApprovedTaskAssignments from '@/components/admin/ApprovedTaskAssignments';

/** Approval handles forwarding; this page is a read-only coordination overview. */
export default function AssignmentsPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px]">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-on-surface">Task Assignment</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Approving a maintenance request automatically forwards it to the technician head.
          View the receiving account, progress, and worker details below. No separate assignment step is needed.
        </p>
      </header>
      <ApprovedTaskAssignments />
    </div>
  );
}
