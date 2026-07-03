export type UserRole =
  | 'SUPER_ADMIN'
  | 'BRANCH_ADMIN'
  | 'HR'
  | 'ACCOUNTANT'
  | 'QUALITY_MANAGER'
  | 'TECHNICAL_MANAGER'
  | 'ENGINEER'
  | 'LAB_ASSISTANT'
  | 'ADMIN_STAFF'
  | 'HELPER'
  | 'DRIVER'
  | 'SAMPLER'

export interface Employee {
  id: string
  email: string
  firstName: string
  lastName: string
  role_id: UserRole
  status: 'ACTIVE' | 'INACTIVE'
  designation?: string
  base_salary: number
  leave_balance: number
  branch_id?: string
  department?: string
  joining_date?: string
  contact_information?: string
  created_at: string
  branches?: { name: string }
}

export interface Branch {
  id: string
  name: string
  location?: string
  manager_id?: string
  created_at: string
  employees?: Employee[]
  manager?: Employee
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  check_in?: string
  check_out?: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
  branch_id?: string
  created_at: string
  employees?: Employee
}

export interface Leave {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  type: 'SICK' | 'CASUAL' | 'COMPENSATORY' | 'OTHER'
  reason?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approver_id?: string
  created_at: string
  employees?: Employee
  approver?: Employee
}

export interface EodReport {
  id: string
  employee_id: string
  report_date: string
  tasks_completed: string[]
  tasks_in_progress: string[]
  blockers: string
  sentiment: 'GREAT' | 'GOOD' | 'OK' | 'STRESSED'
  status: 'SUBMITTED' | 'REVIEWED' | 'APPROVED'
  work_hours: number
  completed_text?: string
  supervisor_remarks?: string
  created_at: string
  employees?: Employee
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  start_date?: string
  deadline?: string
  created_by?: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'TO_DO' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  deadline?: string
  assignee_ids: string[]
  creator_id?: string
  project_id?: string
  created_at: string
}

export interface Rule {
  id: string
  title: string
  content: string
  category: 'GENERAL' | 'HR' | 'SAFETY' | 'LAB'
  created_by?: string
  created_at: string
}

export interface Client {
  id: string
  name: string
  industry?: string
  email?: string
  phone?: string
  address?: string
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
}

export interface Income {
  id: string
  date: string
  amount: number
  description?: string
  category?: string
  payment_method?: string
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'EXPECTED' | 'RECEIVED' | 'ARCHIVED'
  client_id?: string
  is_on_hold: boolean
  hold_reason?: string
  expected_date?: string
  created_at: string
  clients?: { name: string }
}

export interface Expense {
  id: string
  date: string
  amount: number
  description?: string
  category: string
  payment_method: string
  branch_id?: string
  created_at: string
  branches?: { name: string }
}

export interface PayrollRecord {
  id: string
  employee_id: string
  payout_month: string
  base_salary: number
  adjustments: number
  deductions: number
  net_payout: number
  status: 'PENDING' | 'PAID'
  created_at: string
  employees?: Employee
}
