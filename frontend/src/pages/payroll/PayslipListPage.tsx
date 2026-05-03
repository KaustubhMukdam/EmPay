import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { payrollApi } from '@/api/payroll.api';
import { employeeApi } from '@/api/employees.api';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/constants/roles';
import { MONTH_NAMES } from '@/types/payroll.types';

const PayslipListPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeQuery, setEmployeeQuery] = useState('');
  const isEmployee = role === Role.EMPLOYEE;
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', 'payslip-picker', employeeQuery],
    queryFn: () => employeeApi.listEmployees({ q: employeeQuery || undefined, limit: 500 }),
  });

  React.useEffect(() => {
    if (isEmployee && employees.length > 0 && !selectedEmployeeId) {
      const emp = employees.find(e => e.user_id === user?.id);
      if (emp) {
        setSelectedEmployeeId(emp.id);
      }
    }
  }, [isEmployee, employees, user, selectedEmployeeId]);

  const { data: payslips = [] } = useQuery({
    queryKey: ['payslips', selectedEmployeeId],
    queryFn: () => payrollApi.getPayslipsForEmployee(selectedEmployeeId),
    enabled: !!selectedEmployeeId,
  });

  const filteredEmployees = employees
    .filter((emp) => emp.role === Role.EMPLOYEE)
    .slice(0, 100);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payslips</h1>
        <p className="page-subtitle">View and download employee payslips.</p>
      </div>

      {!isEmployee && (
        <div className="card" style={{ marginBottom: 24, position: 'relative' }}>
          <label className="form-label">Search Employee</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                className="form-input"
                value={employeeQuery}
                onChange={(e) => {
                  setEmployeeQuery(e.target.value);
                  // Don't clear selectedEmployeeId immediately to keep the table visible
                }}
                placeholder="Type name, email, or employee code..."
              />
              
              {employeeQuery && filteredEmployees.length > 0 && (
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
                  {filteredEmployees.map((emp) => (
                    <div 
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployeeId(emp.id);
                        setEmployeeQuery(`${emp.name} (${emp.employee_code})`);
                        // Hide results after selection
                      }}
                      style={{ 
                        padding: '10px 16px', 
                        cursor: 'pointer', 
                        fontSize: 14,
                        borderBottom: '1px solid #F1F5F9',
                        background: selectedEmployeeId === emp.id ? '#F0F9FF' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedEmployeeId === emp.id ? '#F0F9FF' : 'transparent'}
                    >
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>{emp.name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{emp.employee_code} • {emp.department} • {emp.designation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setEmployeeQuery('');
                setSelectedEmployeeId('');
              }}
              style={{ padding: '8px 16px', height: 42 }}
            >
              Clear
            </button>
          </div>
          
          {selectedEmployeeId && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>Selected:</span>
              <span style={{ fontSize: 13, color: '#15803D' }}>
                {employees.find(e => e.id === selectedEmployeeId)?.name}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="card">
        {payslips.length === 0 ? (
          <p style={{ color: '#64748B', fontSize: 14 }}>No payslips found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569' }}>Employee</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569' }}>Month</th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#475569' }}>Gross</th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#475569' }}>Deductions</th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#475569' }}>Net Pay</th>
                  <th style={{ padding: 12, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {[...payslips].sort((a, b) => {
                  if ((b.payrun_year || 0) !== (a.payrun_year || 0)) return (b.payrun_year || 0) - (a.payrun_year || 0);
                  return (b.payrun_month || 0) - (a.payrun_month || 0);
                }).map((ps) => {
                  const emp = employees.find(e => e.id === ps.employee_id);
                  return (
                    <tr key={ps.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: 12, fontSize: 14 }}>{emp?.employee_code}</td>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {MONTH_NAMES[ps.payrun_month || 0] || '—'} {ps.payrun_year}
                      </td>
                      <td style={{ padding: 12, fontSize: 14, textAlign: 'right', fontWeight: 500 }}>
                        ₹{ps.gross.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: 12, fontSize: 14, textAlign: 'right', fontWeight: 500, color: '#DC2626' }}>
                        ₹{(ps.pf_deduction + ps.prof_tax + ps.leave_deduction).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: 12, fontSize: 14, textAlign: 'right', fontWeight: 600, color: '#10B981' }}>
                        ₹{ps.net_pay.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <button
                          onClick={() => navigate(`/payroll/payslips/${ps.id}`)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: 14 }}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayslipListPage;
