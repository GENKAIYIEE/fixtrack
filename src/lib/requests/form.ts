/** The official paper form has exactly these three priority choices. */
export const REQUEST_PRIORITIES = [
  { value: 'HIGH', label: 'High - Must be done within 24 hours.' },
  { value: 'MEDIUM', label: 'Medium - Within the week.' },
  { value: 'LOW', label: 'Low – When you get a chance.' },
] as const;
export type RequestedPriorityValue = typeof REQUEST_PRIORITIES[number]['value'];
export const REQUEST_TIME_ZONE = 'Asia/Manila';
export const MAX_WORK_LOCATION = 500;
export const MAX_DESCRIPTION = 500;

export function requestDateToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: REQUEST_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}
export function formatRequestDate(value: string | Date): string {
  // Date-only values are stored as PostgreSQL DATE, not as a local timestamp.
  const iso = value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  const [year, month, day] = iso.split('-');
  return `${month}/${day}/${year}`;
}
export type OfficialRequestInput = {
  workLocation: string;
  description: string;
  requestedPriority: RequestedPriorityValue;
};
export function validateRequestInput(body: unknown):
  | { data: OfficialRequestInput; errors?: never }
  | { errors: Record<string, string>; data?: never } {
  const source = typeof body === 'object' && body !== null && !Array.isArray(body)
    ? body as Record<string, unknown> : {};
  const errors: Record<string, string> = {};
  const workLocation = typeof source.workLocation === 'string' ? source.workLocation.trim() : '';
  const rawDescription = typeof source.description === 'string' ? source.description : '';
  const description = rawDescription.trim();
  if (!workLocation || workLocation.length > MAX_WORK_LOCATION) {
    errors.workLocation = `Enter a work location (up to ${MAX_WORK_LOCATION} characters).`;
  }
  if (!description || rawDescription.length > MAX_DESCRIPTION) {
    errors.description = `Enter a description of work/repair (up to ${MAX_DESCRIPTION} characters).`;
  }
  if (!REQUEST_PRIORITIES.some(p => p.value === source.requestedPriority)) {
    errors.requestedPriority = 'Select exactly one requested priority.';
  }
  if (Object.keys(errors).length) return { errors };
  return { data: { workLocation, description, requestedPriority: source.requestedPriority as RequestedPriorityValue } };
}
