export type PayrunStatus = 'draft' | 'processing' | 'processed';

export interface SalaryConfig {
  id: string;
  employee_id: string;
  basic: number;
  hra: number;
  other_allowances: number;
  pf_rate: number;
  professional_tax: number;
  effective_from: string | null;
}

export interface Payrun {
  id: string;
  month: number;
  year: number;
  status: PayrunStatus;
  created_by: string;
  processed_at: string | null;
}

export interface Payslip {
  id: string;
  payrun_id: string;
  employee_id: string;
  basic: number;
  hra: number;
  other_allowances: number;
  gross: number;
  pf_deduction: number;
  prof_tax: number;
  leave_deduction: number;
  net_pay: number;
  working_days: number;
  days_present: number;
  days_on_leave: number;
  unpaid_days: number;
  created_at: string;
  payrun_month: number;
  payrun_year: number;
}

export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
