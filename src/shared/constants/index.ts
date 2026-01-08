// Shared constants used by both client and server

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  STAFF: '/api/staff',
  PROPERTIES: '/api/properties',
  DOCUMENTS: '/api/documents',
  INTERACTIONS: '/api/interactions',
  ATTENDANCE: '/api/attendance',
  MANUALS: '/api/manuals'
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff'
} as const;

export const LANGUAGES = {
  EN: 'en',
  JA: 'ja'
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'half-day',
  SICK: 'sick',
  VACATION: 'vacation'
} as const;