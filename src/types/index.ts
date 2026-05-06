// ============================================================
// FIXTRACK — BASE TYPE DEFINITIONS
// Full types will be expanded after schema modeling phase
// ============================================================

export type UserRole = 'STUDENT' | 'FACULTY' | 'STAFF' | 'TECHNICIAN' | 'ADMIN'

export type RequestStatus = 'PENDING' | 'ONGOING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'

export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type IssueType =
  | 'HVAC'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'CARPENTRY'
  | 'STRUCTURAL'
  | 'OTHERS'
