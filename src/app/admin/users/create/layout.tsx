/**
 * Focused layout for the Create User page.
 * Uses a fixed full-screen overlay (z-[60]) to sit above the parent
 * admin layout's sidebar (z-50), giving a clean, distraction-free canvas.
 */
export default function CreateUserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] bg-[#F1F5F9] overflow-y-auto">
      {children}
    </div>
  );
}
