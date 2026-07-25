import NotificationsInbox from '@/components/user/NotificationsInbox';

export const metadata = {
  title: 'Notifications | Admin Portal',
  description: 'View and manage all system notifications.',
};

export default function AdminNotificationsPage() {
  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-h1 text-h1 text-slate-900 mb-1">System Notifications</h2>
          <p className="font-body text-body text-slate-600">Manage task updates, maintenance requests, and alerts.</p>
        </div>
      </div>
      
      <NotificationsInbox requestBasePath="/admin/requests" hideHeader={true} />
    </>
  );
}
