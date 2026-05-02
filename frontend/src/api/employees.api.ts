import apiClient from '@/api';
import type { Employee, EmployeeCreate, EmployeeUpdate } from '@/types/employee.types';

/**
 * Employee API service
 * Handles all employee-related HTTP calls to the backend.
 * Every call is protected by JWT token (via apiClient interceptor).
 */
export const employeeApi = {
  /**
   * Fetch all employees
   * Accessible by: Admin, HR Officer, Payroll Officer, Employee (read-only)
   */
  listEmployees: async (): Promise<Employee[]> => {
    const res = await apiClient.get<Employee[]>('/employees');
    return res.data;
  },

  /**
   * Fetch single employee by ID
   * Accessible by: All roles
   */
  getEmployee: async (id: string): Promise<Employee> => {
    const res = await apiClient.get<Employee>(`/employees/${id}`);
    return res.data;
  },

  /**
   * Create new employee
   * Accessible by: Admin, HR Officer only
   * Requires: name, email, department, designation, date_of_joining, basic (salary)
   */
  createEmployee: async (payload: EmployeeCreate): Promise<Employee> => {
    const res = await apiClient.post<Employee>('/employees', payload);
    return res.data;
  },

  /**
   * Update existing employee
   * Accessible by: Admin, HR Officer only
   * Supports partial updates (only send fields you want to change)
   */
  updateEmployee: async (id: string, payload: EmployeeUpdate): Promise<Employee> => {
    const res = await apiClient.put<Employee>(`/employees/${id}`, payload);
    return res.data;
  },

  /**
   * Soft delete employee (marks as inactive, doesn't remove from DB)
   * Accessible by: Admin only
   */
  deleteEmployee: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },
};
