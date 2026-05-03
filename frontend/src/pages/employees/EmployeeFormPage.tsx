import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { employeeApi } from '@/api/employees.api';
import { useAuthStore } from '@/store/authStore';
import { Role, ROLE_LABELS } from '@/constants/roles';

type EmployeeFormState = {
  user_id: string;
  user_name: string;
  user_email: string;
  user_password: string;
  employee_code: string;
  department: string;
  designation: string;
  date_of_joining: string;
  role: Role;
};

const generateEmployeeCode = (userId: string) => {
  const normalized = userId.replace(/-/g, '').toUpperCase();
  return normalized ? `EMP-${normalized.slice(0, 8)}` : '';
};

const EmployeeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { role: currentRole } = useAuthStore();
  const canEditRole = currentRole === Role.ADMIN;

  const [form, setForm] = useState<EmployeeFormState>({
    user_id: '',
    user_name: '',
    user_email: '',
    user_password: '',
    employee_code: '',
    department: '',
    designation: '',
    date_of_joining: '',
    role: Role.EMPLOYEE,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: employee } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getEmployee(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (employee && isEditMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        user_id: employee.user_id || '',
        user_name: employee.name || '',
        user_email: employee.email || '',
        user_password: '',
        employee_code: employee.employee_code || '',
        department: employee.department || '',
        designation: employee.designation || '',
        date_of_joining: employee.date_of_joining || '',
        role: employee.role && employee.role in ROLE_LABELS ? (employee.role as Role) : Role.EMPLOYEE,
      });
    }
  }, [employee, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isEditMode && (!form.user_name.trim() || !form.user_email.trim() || !form.user_password.trim())) {
      setError('Name, email and password are required.');
      return;
    }
    setLoading(true);

    try {
      if (isEditMode && id) {
        const updatePayload = {
          department: form.department,
          designation: form.designation,
          date_of_joining: form.date_of_joining,
          employee_code: form.employee_code,
        };
        await employeeApi.updateEmployee(id, updatePayload);
        if (canEditRole && employee && form.role !== employee.role) {
          await employeeApi.updateUserRole(employee.user_id, form.role);
        }
        await queryClient.invalidateQueries({ queryKey: ['employees'] });
        await queryClient.invalidateQueries({ queryKey: ['employee', id] });
      } else {
        const createdUser = await authApi.register({
          name: form.user_name.trim(),
          email: form.user_email.trim().toLowerCase(),
          password: form.user_password,
          role: form.role,
        });
        const generatedCode = generateEmployeeCode(createdUser.id);
        const createPayload = {
          user_id: createdUser.id,
          department: form.department,
          designation: form.designation,
          date_of_joining: form.date_of_joining,
          employee_code: generatedCode,
        };
        await employeeApi.createEmployee(createPayload);
      }
      navigate('/employees');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/employees')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">{isEditMode ? 'Edit Employee' : 'Create Employee'}</h1>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="form-label">Employee Name</label>
            {isEditMode ? (
              <input type="text" className="form-input" value={form.user_name} disabled />
            ) : (
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={form.user_name}
                onChange={(e) => setForm((prev) => ({ ...prev, user_name: e.target.value }))}
                required
              />
            )}
          </div>

          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. rahul@empay.com"
              value={form.user_email}
              onChange={(e) => setForm((prev) => ({ ...prev, user_email: e.target.value }))}
              required={!isEditMode}
              disabled={isEditMode}
            />
          </div>

          {!isEditMode && (
            <div>
              <label className="form-label">Temporary Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Set initial password"
                value={form.user_password}
                onChange={(e) => setForm((prev) => ({ ...prev, user_password: e.target.value }))}
                required
              />
            </div>
          )}

          <div>
            <label className="form-label">Employee Code</label>
            <input
              type="text"
              className="form-input"
              placeholder={isEditMode ? 'Employee code' : 'Auto-generated on create'}
              value={form.employee_code}
              onChange={e => setForm({ ...form, employee_code: e.target.value })}
              required={isEditMode}
              readOnly={!isEditMode}
            />
          </div>

          <div>
            <label className="form-label">Department</label>
            <input type="text" className="form-input" placeholder="e.g. Engineering" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required />
          </div>

          <div>
            <label className="form-label">Designation</label>
            <input type="text" className="form-input" placeholder="e.g. Senior Engineer" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} required />
          </div>

          <div>
            <label className="form-label">Date of Joining</label>
            <input type="date" className="form-input" value={form.date_of_joining} onChange={e => setForm({ ...form, date_of_joining: e.target.value })} required />
          </div>

          {canEditRole && (
            <div>
              <label className="form-label">Role</label>
              <select
                className="form-input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                <option value={Role.EMPLOYEE}>{ROLE_LABELS[Role.EMPLOYEE]}</option>
                <option value={Role.HR_OFFICER}>{ROLE_LABELS[Role.HR_OFFICER]}</option>
                <option value={Role.PAYROLL_OFFICER}>{ROLE_LABELS[Role.PAYROLL_OFFICER]}</option>
                <option value={Role.ADMIN}>{ROLE_LABELS[Role.ADMIN]}</option>
              </select>
            </div>
          )}

          {error && <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', color: '#991B1B', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>{loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => navigate('/employees')} className="btn" style={{ flex: 1, background: '#E2E8F0', color: '#0F172A' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeFormPage;
