import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/api/leave.api';
import { employeeApi } from '@/api/employees.api';

const LeaveManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [typeForm, setTypeForm] = useState({ name: '', is_paid: true, max_days: 12 });
  const [allocationForm, setAllocationForm] = useState({
    employee_id: '',
    leave_type_id: '',
    year: new Date().getFullYear(),
    total_days: 12,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['leave', 'types'],
    queryFn: leaveApi.listTypes,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', 'lookup', employeeQuery],
    queryFn: () => employeeApi.listEmployees({ q: employeeQuery || undefined, limit: 200 }),
  });

  const createTypeMutation = useMutation({
    mutationFn: leaveApi.createType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
      setTypeForm({ name: '', is_paid: true, max_days: 12 });
    },
  });

  const createAllocationMutation = useMutation({
    mutationFn: leaveApi.createAllocation,
    onSuccess: () => {
      setAllocationForm((prev) => ({ ...prev, employee_id: '', leave_type_id: '', total_days: 12 }));
      setEmployeeQuery(''); // Reset query too
    },
  });

  const totalPages = Math.ceil(leaveTypes.length / itemsPerPage);
  const paginatedLeaveTypes = leaveTypes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Leave Management</h1>
        <p className="page-subtitle">Create leave types and allocate leave balances to employees.</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Create Leave Type</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTypeMutation.mutate(typeForm);
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}
        >
          <div>
            <label className="form-label">Name</label>
            <input
              className="form-input"
              value={typeForm.name}
              onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Paid Leave"
              required
            />
          </div>
          <div>
            <label className="form-label">Max Days</label>
            <input
              className="form-input"
              type="number"
              min={1}
              value={typeForm.max_days}
              onChange={(e) => setTypeForm((prev) => ({ ...prev, max_days: Number(e.target.value) }))}
              required
            />
          </div>
          <div>
            <label className="form-label">Paid Leave</label>
            <select
              className="form-input"
              value={String(typeForm.is_paid)}
              onChange={(e) => setTypeForm((prev) => ({ ...prev, is_paid: e.target.value === 'true' }))}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button className="btn btn-primary" type="submit" disabled={createTypeMutation.isPending}>
              {createTypeMutation.isPending ? 'Creating...' : 'Create Type'}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Allocate Leave</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAllocationMutation.mutate(allocationForm);
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}
        >
          <div style={{ position: 'relative' }}>
            <label className="form-label">Employee</label>
            <input
              className="form-input"
              value={employeeQuery}
              onChange={(e) => {
                setEmployeeQuery(e.target.value);
                // Don't clear employee_id immediately
              }}
              placeholder="Search by name, email, code..."
            />
            {employeeQuery && employees.length > 0 && !allocationForm.employee_id && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                backgroundColor: 'white', 
                border: '1px solid #E2E8F0', 
                borderRadius: '0 0 8px 8px', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                zIndex: 50,
                maxHeight: 200,
                overflowY: 'auto'
              }}>
                {employees.map((employee) => (
                  <div 
                    key={employee.id}
                    onClick={() => {
                      setAllocationForm((prev) => ({ ...prev, employee_id: employee.id }));
                      setEmployeeQuery(`${employee.name} (${employee.employee_code})`);
                    }}
                    style={{ 
                      padding: '10px 16px', 
                      cursor: 'pointer', 
                      fontSize: 14,
                      borderBottom: '1px solid #F1F5F9'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{employee.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{employee.employee_code} • {employee.department}</div>
                  </div>
                ))}
              </div>
            )}
            {allocationForm.employee_id && (
              <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>✓ Employee Selected</span>
                <button 
                  type="button"
                  onClick={() => {
                    setAllocationForm(prev => ({ ...prev, employee_id: '' }));
                    setEmployeeQuery('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#6366F1', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="form-label">Leave Type</label>
            <select
              className="form-input"
              value={allocationForm.leave_type_id}
              onChange={(e) => setAllocationForm((prev) => ({ ...prev, leave_type_id: e.target.value }))}
              required
            >
              <option value="">Select type</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Year</label>
            <input
              className="form-input"
              type="number"
              value={allocationForm.year}
              onChange={(e) => setAllocationForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
              required
            />
          </div>

          <div>
            <label className="form-label">Total Days</label>
            <input
              className="form-input"
              type="number"
              min={1}
              value={allocationForm.total_days}
              onChange={(e) => setAllocationForm((prev) => ({ ...prev, total_days: Number(e.target.value) }))}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button className="btn btn-primary" type="submit" disabled={createAllocationMutation.isPending}>
              {createAllocationMutation.isPending ? 'Allocating...' : 'Allocate'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Available Leave Types</h3>
        {leaveTypes.length === 0 ? (
          <p style={{ color: '#64748B' }}>No leave types created yet.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Paid</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Max Days</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeaveTypes.map((type) => (
                    <tr key={type.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: 12 }}>{type.name}</td>
                      <td style={{ padding: 12 }}>{type.is_paid ? 'Yes' : 'No'}</td>
                      <td style={{ padding: 12 }}>{type.max_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#F1F5F9', color: '#1E293B' }}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#F1F5F9', color: '#1E293B' }}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaveManagementPage;
