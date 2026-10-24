/** Existing ACTIVE/PENDING/INACTIVE states are reused; no account or role is changed here. */
export function accountMessage(status: string, reason?: string | null) {
  if (status === 'PENDING') return { heading: 'Account awaiting administrator review', message: 'Your account is pending administrator approval. You cannot access FixTrack features until it is approved.' };
  if (status === 'REJECTED') return { heading: 'Account registration rejected', message: 'Your registration was rejected by an administrator. Protected FixTrack features are unavailable.' + (reason ? ` Reason: ${reason}` : ' Contact the administrator for clarification.') };
  if (status === 'INACTIVE') return { heading: 'Account not approved or inactive', message: 'Your account has not been approved or has been deactivated. Contact the administrator for clarification. Protected FixTrack features are unavailable.' };
  return { heading: 'Account access unavailable', message: 'Your account cannot access protected FixTrack features. Please contact the administrator.' };
}
export function portalForRole(role: string) {
  return role === 'ADMIN' ? '/admin/dashboard' : role === 'TECHNICIAN' ? '/technician/dashboard' : role === 'STUDENT' ? '/dashboard' : '/login';
}
function under(path: string, prefix: string) { return path === prefix || path.startsWith(prefix + '/'); }
export function requiredRouteRole(path: string): 'ADMIN' | 'TECHNICIAN' | 'STUDENT' | null {
  if (under(path, '/api/admin') || under(path, '/admin') || under(path, '/api/users')) return 'ADMIN';
  if (under(path, '/api/technician') || under(path, '/technician') || under(path, '/api/tasks')) return 'TECHNICIAN';
  if (under(path, '/api/user') || under(path, '/api/requests') || ['/dashboard','/requests','/history','/profile','/notifications'].some(p => under(path,p))) return 'STUDENT';
  return null;
}
export function isProtectedApi(path: string) {
  return under(path, '/api') && !under(path, '/api/auth') && path !== '/api/settings/public';
}
