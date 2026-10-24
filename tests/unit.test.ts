import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRequestInput, requestDateToday, formatRequestDate, MAX_WORK_LOCATION, MAX_DESCRIPTION } from '../src/lib/requests/form';
import { getWorkLocation, getRequestSubject } from '../src/lib/requests/display';

const valid = { workLocation: 'College Building — Library', description: 'Repair the leaking pipe.', requestedPriority: 'MEDIUM' };
test('all three official priorities accepted without inventing enum choices', () => {
  for (const priority of ['LOW', 'MEDIUM', 'HIGH']) assert.ok(validateRequestInput({ ...valid, requestedPriority: priority }).data);
});
test('invalid/absent/multiple priorities rejected', () => {
  for (const priority of [undefined, null, '', 'NORMAL', 'URGENT', ['LOW', 'HIGH'], {}, 1]) {
    assert.ok(validateRequestInput({ ...valid, requestedPriority: priority }).errors?.requestedPriority);
  }
});
test('empty, non-string and overlong official fields rejected', () => {
  for (const body of [null, [], 3, {}, { ...valid, workLocation: ' ' }, { ...valid, description: 22 },
    { ...valid, workLocation: 'x'.repeat(MAX_WORK_LOCATION + 1) }, { ...valid, description: 'x'.repeat(MAX_DESCRIPTION + 1) }]) {
    assert.ok(validateRequestInput(body).errors);
  }
});
test('trims input and excludes client-supplied locked/admin fields', () => {
  const result = validateRequestInput({ ...valid, workLocation: ' Library ', requestingParty: 'Spoofed', requestDate: '1999-01-01', assignedToId: 'other', status: 'COMPLETED' });
  assert.deepEqual(result.data, { ...valid, workLocation: 'Library' });
});
test('request date follows Asia/Manila, including UTC date boundary', () => {
  assert.equal(requestDateToday(new Date('2026-10-22T15:59:59Z')), '2026-10-22');
  assert.equal(requestDateToday(new Date('2026-10-22T16:00:00Z')), '2026-10-23');
  assert.equal(formatRequestDate('2026-10-23T00:00:00Z'), '10/23/2026');
});
test('official locations take precedence; legacy values display without fabricated backfill', () => {
  assert.equal(getWorkLocation({ workLocation: 'Courtyard', building: 'COLLEGE_BUILDING', roomNumber: 'Library' }), 'Courtyard');
  assert.equal(getWorkLocation({ building: 'COLLEGE_BUILDING', roomNumber: 'Library', locationNotes: 'Second floor' }), 'College Building — Library — Second floor');
  assert.equal(getWorkLocation({ building: null, roomNumber: null }), 'Not recorded');
  assert.equal(getRequestSubject({ issueType: null, description: 'Fix door' }), 'Fix door');
});

// Photo Evidence restoration: actual small image fixtures, no external storage.
import { readFileSync } from 'node:fs';
import { evidenceFileError, MAX_EVIDENCE_PHOTO_BYTES } from '../src/lib/requests/photo-rules';
import { validateEvidencePhotos, uploadEvidencePhotos, EvidenceStorage } from '../src/lib/requests/photo-storage';
const evidenceData = (extension: string) => `data:image/${extension};base64,${readFileSync(`tests/fixtures/evidence.${extension}`).toString('base64')}`;
test('client evidence rules retain original types and 5MB limit', () => {
  assert.equal(evidenceFileError({ name: 'valid.png', type: 'image/png', size: MAX_EVIDENCE_PHOTO_BYTES }), null);
  assert.ok(evidenceFileError({ name: 'large.png', type: 'image/png', size: MAX_EVIDENCE_PHOTO_BYTES + 1 }));
  assert.ok(evidenceFileError({ name: 'bad.svg', type: 'image/svg+xml', size: 10 }));
  assert.ok(evidenceFileError({ name: 'empty.png', type: 'image/png', size: 0 }));
});
test('server accepts optional evidence and all three genuine image formats', () => {
  assert.deepEqual(validateEvidencePhotos(undefined), []);
  assert.deepEqual(validateEvidencePhotos([]), []);
  assert.deepEqual(validateEvidencePhotos(['png','jpeg','webp'].map(evidenceData)).map(p => p.mimeType), ['image/png','image/jpeg','image/webp']);
});
test('server rejects excessive count, bad encoding, mismatched content and oversized photos', () => {
  for (const value of [null, 'bad', [1], Array(4).fill(evidenceData('png')), ['data:image/svg+xml;base64,PHN2Zy8+'],
    ['data:image/png;base64,AAAA'], [evidenceData('jpeg').replace('image/jpeg','image/png')],
    ['data:image/png;base64,'+Buffer.alloc(MAX_EVIDENCE_PHOTO_BYTES + 1).toString('base64')]]) assert.throws(() => validateEvidencePhotos(value));
});
test('successful evidence upload keeps existing JSON URL format and supports DB-failure rollback', async () => {
  const objects = new Set<string>();
  const storage: EvidenceStorage = {
    upload: async path => { objects.add(path); return { error: null }; },
    remove: async paths => { paths.forEach(path => objects.delete(path)); return { error: null }; },
    getPublicUrl: path => ({ data: { publicUrl: `http://127.0.0.1/photos/${path}` } }),
  };
  const result = await uploadEvidencePhotos(validateEvidencePhotos([evidenceData('png')]), 'local-user', 'REQ-LOCAL', storage);
  assert.equal(JSON.parse(result.photoUrl! as string).length, 1); assert.equal(objects.size, 1);
  await result.rollback(); assert.equal(objects.size, 0);
});
test('partial evidence upload failure removes already uploaded objects instead of silently losing photos', async () => {
  const objects = new Set<string>(); let calls = 0;
  const storage: EvidenceStorage = {
    upload: async path => { if (++calls === 2) return { error: { message: 'Simulated failure' } }; objects.add(path); return { error: null }; },
    remove: async paths => { paths.forEach(path => objects.delete(path)); return { error: null }; },
    getPublicUrl: path => ({ data: { publicUrl: `http://127.0.0.1/photos/${path}` } }),
  };
  await assert.rejects(uploadEvidencePhotos(validateEvidencePhotos([evidenceData('png'),evidenceData('webp')]), 'local-user', 'REQ-LOCAL', storage));
  assert.equal(objects.size, 0);
});

test('description accepts 500 characters and rejects 501, including whitespace padding', () => {
  assert.equal(MAX_DESCRIPTION, 500);
  assert.equal(validateRequestInput({ ...valid, description: 'x'.repeat(500) }).data?.description.length, 500);
  for (const description of ['x'.repeat(501), 'x'.repeat(500) + ' ', ' ' + 'x'.repeat(500)]) {
    assert.ok(validateRequestInput({ ...valid, description }).errors?.description);
  }
});
