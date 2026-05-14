// FIXED: Navigation — Redirects /admin/users/[id] stub to the working edit page
import { redirect } from 'next/navigation';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/users/${id}/edit`);
}
