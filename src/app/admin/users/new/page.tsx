// FIXED: Navigation — Redirects /admin/users/new stub to the working technician create page
import { redirect } from 'next/navigation';

export default function AdminNewUserPage() {
  redirect('/admin/users/technicians/create');
}
