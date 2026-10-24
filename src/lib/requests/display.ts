import { getBuildingLabel } from '@/lib/constants/buildings';
export interface RequestDisplayFields {
  workLocation?: string | null;
  building?: string | null;
  roomNumber?: string | null;
  locationNotes?: string | null;
  issueType?: string | null;
  description?: string | null;
}
export function getWorkLocation(request: RequestDisplayFields): string {
  return request.workLocation || [
    request.building ? getBuildingLabel(request.building) : '', request.roomNumber, request.locationNotes,
  ].filter(Boolean).join(' — ') || 'Not recorded';
}
export function getRequestSubject(request: RequestDisplayFields): string {
  if (request.issueType) return request.issueType === 'HVAC' ? 'HVAC' :
    request.issueType.charAt(0) + request.issueType.slice(1).toLowerCase();
  return request.description?.slice(0, 80) || 'Maintenance / Custodial Work';
}
