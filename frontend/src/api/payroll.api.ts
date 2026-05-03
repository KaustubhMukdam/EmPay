import apiClient from '@/api';
import type { SalaryConfig, Payrun, Payslip } from '@/types/payroll.types';

/**
 * Payroll API service
 * Handles salary config, payruns, and payslips
 */
export const payrollApi = {
  /**
   * Get salary config for an employee
   * Accessible by: Admin, Payroll Officer
   */
  getSalaryConfig: async (employeeId: string): Promise<SalaryConfig> => {
    const res = await apiClient.get<SalaryConfig>(`/payroll/salary-config/${employeeId}`);
    return res.data;
  },

  /**
   * Create or update salary config for an employee
   * Accessible by: Admin, Payroll Officer
   */
  upsertSalaryConfig: async (payload: Partial<SalaryConfig>): Promise<SalaryConfig> => {
    const res = await apiClient.post<SalaryConfig>('/payroll/salary-config', payload);
    return res.data;
  },

  /**
   * List all payruns
   * Accessible by: Admin, Payroll Officer
   */
  listPayruns: async (): Promise<Payrun[]> => {
    const res = await apiClient.get<Payrun[]>('/payroll/payruns');
    return res.data;
  },

  /**
   * Create a new payrun for a specific month/year
   * Calculates and generates payslips for all active employees
   * Accessible by: Admin, Payroll Officer
   */
  createPayrun: async (month: number, year: number): Promise<Payrun> => {
    const res = await apiClient.post<Payrun>('/payroll/payruns', { month, year });
    return res.data;
  },

  /**
   * List payslips with filters
   * Accessible by: Employee (own only), Admin, Payroll Officer
   */
  listPayslips: async (params: { employeeId?: string; month?: number; year?: number }): Promise<Payslip[]> => {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employee_id', params.employeeId);
    if (params.month) query.append('month', params.month.toString());
    if (params.year) query.append('year', params.year.toString());
    
    const res = await apiClient.get<Payslip[]>(`/payroll/payslips?${query.toString()}`);
    return res.data;
  },

  /**
   * Get all payslips for an employee (legacy/shorthand)
   */
  getPayslipsForEmployee: async (employeeId: string): Promise<Payslip[]> => {
    return payrollApi.listPayslips({ employeeId });
  },

  /**
   * Get detailed payslip
   * Accessible by: Admin, Payroll Officer
   */
  getPayslipDetail: async (payslipId: string): Promise<Payslip> => {
    const res = await apiClient.get<Payslip>(`/payroll/payslips/detail/${payslipId}`);
    return res.data;
  },
};
