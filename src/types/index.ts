// ============================================================
// FIXTRACK — BASE TYPE DEFINITIONS
// Full types will be expanded after schema modeling phase
// ============================================================

export type UserRole = 'STUDENT' | 'TECHNICIAN' | 'ADMIN';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'ONGOING' | 'ON_HOLD' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'

export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type IssueType =
  | 'HVAC'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'CARPENTRY'
  | 'STRUCTURAL'
  | 'OTHERS'
