import { redirect } from 'next/navigation';

/**
 * The App Settings page has been removed from the Technician Portal.
 * Any direct visits to /technician/settings are permanently redirected
 * to the dashboard.
 */
export default function TechnicianSettingsPage() {
  redirect('/technician/dashboard');
}
