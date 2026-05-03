import apiClient from '@/api';
import { Role } from '@/constants/roles';
import type { AvailableUser, Employee, EmployeeCreate, EmployeeUpdate } from '@/types/employee.types';

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
  listEmployees: async (params?: { q?: string; limit?: number; offset?: number }): Promise<Employee[]> => {
    const res = await apiClient.get<Employee[]>('/employees', { params });
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
   * Update the linked user's role for an employee.
   * Accessible by: Admin only
   */
  updateUserRole: async (userId: string, role: Role): Promise<void> => {
    await apiClient.post(`/users/${userId}/role`, { role });
  },

  listAvailableUsers: async (params?: { q?: string; limit?: number; offset?: number }): Promise<AvailableUser[]> => {
    const res = await apiClient.get<AvailableUser[]>('/employees/lookup/available-users', { params });
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
