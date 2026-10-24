import test from 'node:test';
import assert from 'node:assert/strict';
import { accountMessage, portalForRole, requiredRouteRole, isProtectedApi } from '../src/lib/auth/account-policy';
test('approval policy reuses existing statuses and describes pending/inactive accounts clearly',()=>{
 assert.match(accountMessage('PENDING').message,/pending/);assert.match(accountMessage('INACTIVE').message,/not been approved/);assert.match(accountMessage('UNKNOWN').message,/cannot access/);
 assert.equal(portalForRole('ADMIN'),'/admin/dashboard');assert.equal(portalForRole('TECHNICIAN'),'/technician/dashboard');assert.equal(portalForRole('STUDENT'),'/dashboard');
});
test('protected API and page classification is segment-safe and includes previously missed paths',()=>{
 for(const path of ['/api/admin/users','/api/admin/users/u/id-photo','/api/users'])assert.equal(requiredRouteRole(path),'ADMIN');
 for(const path of ['/history','/notifications','/api/user/profile','/api/requests'])assert.equal(requiredRouteRole(path),'STUDENT');
 assert.equal(requiredRouteRole('/api/technician/tasks'),'TECHNICIAN');assert.equal(requiredRouteRole('/administrator'),null);
 assert.equal(isProtectedApi('/api/auth/register'),false);assert.equal(isProtectedApi('/api/auth/signout'),false);assert.equal(isProtectedApi('/api/settings/public'),false);
 assert.equal(isProtectedApi('/api/authentication/private'),true);assert.equal(isProtectedApi('/api/user/requests/id.png'),true);
});

test('rejected account policy includes only its user-facing reason',()=>{assert.match(accountMessage('REJECTED','ID number does not match.').message,/rejected.*Reason: ID number does not match/);});
