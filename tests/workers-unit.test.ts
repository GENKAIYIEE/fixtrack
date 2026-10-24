import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workerFields, workerIds, expectedVersion, boundedJson } from '../src/lib/workers/validation';
const valid = { name: ' Synthetic Worker ', contactNumber: ' 09123456789 ', specialization: 'GENERAL', isAvailable: true };
test('worker records accept bounded directory fields, not account credentials or roles', () => {
  assert.deepEqual(workerFields(valid), { name: 'Synthetic Worker', contactNumber: '09123456789', specialization: 'GENERAL', isAvailable: true, isArchived: false });
  for (const body of [null, [], { ...valid, name: '' }, { ...valid, name: 'x'.repeat(101) }, { ...valid, contactNumber: '' }, { ...valid, contactNumber: 'x'.repeat(41) }, { ...valid, specialization: 'OTHER' }, { ...valid, isAvailable: 'true' }, { ...valid, isArchived: 1 }, { ...valid, role: 'ADMIN' }, { ...valid, password: 'no-accounts' }]) assert.throws(() => workerFields(body));
});
test('multi-worker selections accept distinct IDs and safe versions, including clear selection', () => {
  assert.deepEqual(workerIds(['worker-a', 'worker-b']), ['worker-a', 'worker-b']); assert.deepEqual(workerIds([]), []);
  for (const value of [null, 'id', ['same', 'same'], [''], ['../../bad'], [123], Array.from({ length: 101 }, (_, i) => `worker-${i}`)]) assert.throws(() => workerIds(value));
  assert.equal(expectedVersion('2026-10-23T10:00:00.000Z').toISOString(), '2026-10-23T10:00:00.000Z');
  for (const value of [null, '', 'not a date', 123]) assert.throws(() => expectedVersion(value));
});
test('worker JSON requests reject malformed and oversized bodies', async () => {
  assert.deepEqual(await boundedJson(new Request('http://localhost/test', { method: 'POST', body: '{"workerIds":[]}' })), { workerIds: [] });
  await assert.rejects(() => boundedJson(new Request('http://localhost/test', { method: 'POST', body: '{' })));
  await assert.rejects(() => boundedJson(new Request('http://localhost/test', { method: 'POST', body: 'x'.repeat(32769) })));
});
