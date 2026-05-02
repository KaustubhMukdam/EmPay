import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { employeeApi } from '@/api/employees.api';
import { Role } from '@/constants/roles';

/**
 * EmployeeListPage
 * 
 * Displays all employees in a table format.
 * - Admin/HR Officer: See create/edit/delete buttons
 * - Payroll Officer/Employee: Read-only view
 * 
 * Features:
 * - Auto-fetches employee list on mount via React Query
 * - Shows loading spinner while fetching
 * - Displays error if API call fails
 * - Role-based button visibility
 * - Links to detail and edit pages
 */
const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const [search, setSearch] = useState('');

  // ─── Fetch employees using React Query ───────────────────────────────────
  // React Query handles: loading, error, caching, refetching
  const { data: employees = [], isLoading, error, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeApi.listEmployees,
  });

  // ─── Filter employees based on search ────────────────────────────────────
  const filteredEmployees = employees.filter(emp =>
    emp.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
    emp.department?.toLowerCase().includes(search.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Check if user has edit permissions ──────────────────────────────────
  const canEdit = role === Role.ADMIN || role === Role.HR_OFFICER;

  // ─── Handle delete ───────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await employeeApi.deleteEmployee(id);
      refetch(); // Refresh list after delete
    } catch (err) {
      alert('Failed to delete employee');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Employees</h1>
        {canEdit && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/employees/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={16} />
            Add Employee
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <input
          type="text"
          placeholder="Search by code, department, or designation..."
          className="form-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {/* Loading state */}
      {isLoading && <div className="card"><p style={{ color: '#94A3B8' }}>Loading employees...</p></div>}

      {/* Error state */}
      {error && (
        <div className="card" style={{ background: '#FEE2E2', borderLeft: '4px solid #EF4444' }}>
          <p style={{ color: '#991B1B' }}>Failed to load employees. Please try again.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredEmployees.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#64748B', marginBottom: 16 }}>No employees found.</p>
          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/employees/new')}
            >
              Create First Employee
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && filteredEmployees.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#0F172A' }}>Employee Code</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#0F172A' }}>Department</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#0F172A' }}>Designation</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#0F172A' }}>DOJ</th>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#0F172A' }}>Status</th>
                {(canEdit) && <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#0F172A' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, idx) => (
                <tr
                  key={emp.id}
                  style={{
                    borderBottom: '1px solid #E2E8F0',
                    background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                  }}
                >
                  <td style={{ padding: 12, color: '#0F172A' }}>{emp.employee_code || '—'}</td>
                  <td style={{ padding: 12, color: '#0F172A' }}>{emp.department || '—'}</td>
                  <td style={{ padding: 12, color: '#0F172A' }}>{emp.designation || '—'}</td>
                  <td style={{ padding: 12, color: '#64748B' }}>
                    {emp.date_of_joining
                      ? new Date(emp.date_of_joining).toLocaleDateString('en-IN')
                      : '—'}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        background: emp.is_active ? '#DCFCE7' : '#FEE2E2',
                        color: emp.is_active ? '#15803D' : '#991B1B',
                      }}
                    >
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canEdit && (
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <button
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#4F46E5',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="View details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/employees/${emp.id}/edit`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#F59E0B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeListPage;
