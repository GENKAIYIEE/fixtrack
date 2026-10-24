import TechnicianWorkflowGate from '@/components/technician/TechnicianWorkflowGate';

export default function WorkflowLayout({ children }: { children: React.ReactNode }) {
  return <TechnicianWorkflowGate>{children}</TechnicianWorkflowGate>;
}
