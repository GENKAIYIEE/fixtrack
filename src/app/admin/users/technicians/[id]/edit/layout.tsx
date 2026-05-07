export default function FocusedLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[60] bg-background min-h-screen overflow-y-auto">{children}</div>;
}
