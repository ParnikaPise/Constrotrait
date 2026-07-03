// ==========================================================
// Constrotrait HRMS - Role Based Access Control (RBAC)
// Single Source of Truth for Roles & Permissions
// ==========================================================

export type UserRole =
  | 'SUPER_ADMIN'
  | 'CEO'
  | 'BRANCH_ADMIN'
  | 'HR'
  | 'ACCOUNTANT'
  | 'QUALITY_MANAGER'
  | 'TECHNICAL_MANAGER'
  | 'SENIOR_ANALYST'
  | 'JUNIOR_ANALYST'
  | 'TEST_ENGINEER'
  | 'LAB_ASSISTANT'
  | 'ADMIN_STAFF'
  | 'HELPER'
  | 'DRIVER'
  | 'SAMPLER'

// ==========================================================
// Role Groups
// ==========================================================

export const ADMIN_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'CEO',
  'BRANCH_ADMIN',
]

export const MANAGER_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'CEO',
  'BRANCH_ADMIN',
  'HR',
  'QUALITY_MANAGER',
  'TECHNICAL_MANAGER',
]

export const FINANCE_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'CEO',
  'ACCOUNTANT',
]

export const EMPLOYEE_ONLY_ROLES: UserRole[] = [
  'SENIOR_ANALYST',
  'JUNIOR_ANALYST',
  'TEST_ENGINEER',
  'LAB_ASSISTANT',
  'ADMIN_STAFF',
  'HELPER',
  'DRIVER',
  'SAMPLER',
]

// ==========================================================
// Human Readable Labels
// ==========================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  CEO: 'CEO',
  BRANCH_ADMIN: 'Branch Admin',
  HR: 'HR Manager',
  ACCOUNTANT: 'Accountant',

  QUALITY_MANAGER: 'Quality Manager',
  TECHNICAL_MANAGER: 'Technical Manager',

  SENIOR_ANALYST: 'Senior Analyst',
  JUNIOR_ANALYST: 'Junior Analyst',
  TEST_ENGINEER: 'Test Engineer',
  LAB_ASSISTANT: 'Lab Assistant',

  ADMIN_STAFF: 'Admin Staff',

  HELPER: 'Helper',
  DRIVER: 'Driver',
  SAMPLER: 'Sampler',
}

// ==========================================================
// Default Dashboard Redirect
// ==========================================================

export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'CEO':
      return '/dashboard'

    case 'ACCOUNTANT':
      return '/dashboard/finance'

    case 'HR':
      return '/dashboard/employees'

    case 'BRANCH_ADMIN':
    case 'QUALITY_MANAGER':
    case 'TECHNICAL_MANAGER':
      return '/dashboard/tasks'

    default:
      return '/dashboard/my'
  }
}

// ==========================================================
// Permissions
// ==========================================================

export const PERMISSIONS = {
  // Executive Dashboard
  viewExecutiveDashboard: (role: UserRole) =>
    ADMIN_ROLES.includes(role),

  // Finance Module
  viewFinance: (role: UserRole) =>
    FINANCE_ROLES.includes(role),

  // Employee Management
  manageEmployees: (role: UserRole) =>
    [
      'SUPER_ADMIN',
      'CEO',
      'HR',
      'BRANCH_ADMIN',
    ].includes(role),

  // Branches
  manageBranches: (role: UserRole) =>
    [
      'SUPER_ADMIN',
      'CEO',
      'BRANCH_ADMIN',
    ].includes(role),

  // Attendance
  manageAttendance: (role: UserRole) =>
    [
      'SUPER_ADMIN',
      'CEO',
      'HR',
      'BRANCH_ADMIN',
      'QUALITY_MANAGER',
      'TECHNICAL_MANAGER',
    ].includes(role),

  // Leave Approval
  approveLeaves: (role: UserRole) =>
    MANAGER_ROLES.includes(role),

  // EOD Approval
  approveEOD: (role: UserRole) =>
    MANAGER_ROLES.includes(role),

  // Tasks
  manageTasks: (role: UserRole) =>
    MANAGER_ROLES.includes(role),

  // Payroll
  managePayroll: (role: UserRole) =>
    [
      'SUPER_ADMIN',
      'CEO',
      'ACCOUNTANT',
      'HR',
    ].includes(role),

  // Rulebook
  manageRulebook: (role: UserRole) =>
    MANAGER_ROLES.includes(role),

  // Announcements
  manageAnnouncements: (role: UserRole) =>
    MANAGER_ROLES.includes(role),

  // Messaging
  sendMessages: (_role: UserRole) => true,

  // Submit EOD
  submitEOD: (_role: UserRole) => true,

  // Apply Leave
  applyLeave: (_role: UserRole) => true,

  // My Dashboard
  viewOwnDashboard: (_role: UserRole) => true,

  // My Tasks
  viewOwnTasks: (_role: UserRole) => true,

  // My Attendance
  viewOwnAttendance: (_role: UserRole) => true,

  // My Leaves
  viewOwnLeaves: (_role: UserRole) => true,

  // Company Rulebook
  viewRulebook: (_role: UserRole) => true,
}