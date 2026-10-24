import { WorkflowError } from '@/lib/requests/assignment';
import { WORKER_SPECIALIZATIONS } from './validation-client';
export { WORKER_SPECIALIZATIONS } from './validation-client';
export type WorkerInput = { name: string; contactNumber: string; specialization: typeof WORKER_SPECIALIZATIONS[number]; isAvailable: boolean; isArchived: boolean };
export function recordBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WorkflowError('Invalid form data.');
  return value as Record<string, unknown>;
}
export function workerFields(value: unknown): WorkerInput {
  const body = recordBody(value);
  const allowed = ['name', 'contactNumber', 'specialization', 'isAvailable', 'isArchived', 'updatedAt'];
  if (Object.keys(body).some(key => !allowed.includes(key))) throw new WorkflowError('Unsupported worker field. Workers are directory records, not accounts.');
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100) throw new WorkflowError('Enter a worker name of up to 100 characters.');
  if (typeof body.contactNumber !== 'string' || !body.contactNumber.trim() || body.contactNumber.length > 40) throw new WorkflowError('Enter a contact number of up to 40 characters.');
  if (!WORKER_SPECIALIZATIONS.includes(body.specialization as WorkerInput['specialization'])) throw new WorkflowError('Choose a supported specialization.');
  if (typeof body.isAvailable !== 'boolean' || (body.isArchived !== undefined && typeof body.isArchived !== 'boolean')) throw new WorkflowError('Invalid availability or archive setting.');
  return { name: body.name.trim(), contactNumber: body.contactNumber.trim(), specialization: body.specialization as WorkerInput['specialization'], isAvailable: body.isAvailable, isArchived: body.isArchived === true };
}
export function workerIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 100 || value.some(id => typeof id !== 'string' || !id || id.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(id)) || new Set(value).size !== value.length) throw new WorkflowError('Choose up to 100 distinct worker records.');
  return value;
}
export function expectedVersion(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) throw new WorkflowError('Refresh the record before saving.');
  return new Date(value);
}
export async function boundedJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new WorkflowError('The form is empty.');
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      bytes += value.length;
      if (bytes > 32768) { await reader.cancel(); throw new WorkflowError('The form is too large.', 413); }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new WorkflowError('Invalid JSON form.'); }
  } finally { reader.releaseLock(); }
}
