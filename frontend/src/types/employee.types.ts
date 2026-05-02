export interface Employee {
  id: string;
  user_id: string;
  department: string | null;
  designation: string | null;
  date_of_joining: string | null;
  employee_code: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeWithUser extends Employee {
  name: string;
  email: string;
}

export interface EmployeeCreate {
  user_id: string;
  department?: string;
  designation?: string;
  date_of_joining?: string;
  employee_code?: string;
}

export interface EmployeeUpdate {
  department?: string;
  designation?: string;
  date_of_joining?: string;
  employee_code?: string;
  is_active?: boolean;
}
