export const Role = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  HR_OFFICER: 'hr_officer',
  PAYROLL_OFFICER: 'payroll_officer',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.EMPLOYEE]: 'Employee',
  [Role.HR_OFFICER]: 'HR Officer',
  [Role.PAYROLL_OFFICER]: 'Payroll Officer',
};

export const ROLE_COLORS: Record<Role, string> = {
  [Role.ADMIN]: 'badge-danger',
  [Role.EMPLOYEE]: 'badge-neutral',
  [Role.HR_OFFICER]: 'badge-info',
  [Role.PAYROLL_OFFICER]: 'badge-warning',
};
