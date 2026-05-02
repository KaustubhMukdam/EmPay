import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { employeeApi } from '@/api/employees.api';
import { Role } from '@/constants/roles';

const EmployeeDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { role } = useAuthStore();

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getEmployee(id!),
    enabled: !!id,
  });

  const canEdit = role === Role.ADMIN || role === Role.HR_OFFICER;

  if (isLoading) return <div className="card"><p style={{ color: '#94A3B8' }}>Loading...</p></div>;
  if (error || !employee) return <div className="card"><p style={{ color: '#EF4444' }}>Employee not found</p></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/employees')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">{employee.employee_code} Details</h1>
        </div>
        {canEdit && (
          <button onClick={() => navigate(`/employees/${id}/edit`)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit2 size={16} />
            Edit
          </button>
        )}
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <DetailField label="Employee Code" value={employee.employee_code} />
            <DetailField label="Status" value={employee.is_active ? 'Active' : 'Inactive'} color={employee.is_active ? '#10B981' : '#EF4444'} />
          </div>
          <DetailField label="Department" value={employee.department} />
          <DetailField label="Designation" value={employee.designation} />
          <DetailField label="Date of Joining" value={employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString('en-IN') : '—'} />
          <DetailField label="Created At" value={employee.created_at ? new Date(employee.created_at).toLocaleDateString('en-IN') : '—'} />
        </div>
      </div>
    </div>
  );
};

const DetailField: React.FC<{ label: string; value: string | null; color?: string }> = ({ label, value, color }) => (
  <div>
    <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    <p style={{ fontSize: 15, color: color || '#0F172A', fontWeight: 500 }}>{value || '—'}</p>
  </div>
);

export default EmployeeDetailPage;
