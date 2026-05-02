import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { employeeApi } from '@/api/employees.api';

const EmployeeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [form, setForm] = useState({
    user_id: '',
    employee_code: '',
    department: '',
    designation: '',
    date_of_joining: '',
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
      setForm({
        user_id: employee.user_id || '',
        employee_code: employee.employee_code || '',
        department: employee.department || '',
        designation: employee.designation || '',
        date_of_joining: employee.date_of_joining || '',
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditMode && id) {
        const { user_id: _userId, ...updatePayload } = form;
        await employeeApi.updateEmployee(id, updatePayload);
      } else {
        await employeeApi.createEmployee(form);
      }
      navigate('/employees');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Operation failed');
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
            <label className="form-label">User ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="Backend user UUID"
              value={form.user_id}
              onChange={e => setForm({ ...form, user_id: e.target.value })}
              required={!isEditMode}
              disabled={isEditMode}
            />
          </div>

          <div>
            <label className="form-label">Employee Code</label>
            <input type="text" className="form-input" placeholder="e.g. EMP001" value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value })} required />
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
