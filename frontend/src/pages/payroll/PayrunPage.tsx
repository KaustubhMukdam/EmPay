import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { payrollApi } from '@/api/payroll.api';
import { employeeApi } from '@/api/employees.api';
import { MONTH_NAMES } from '@/types/payroll.types';

const PayrunPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: payruns = [] } = useQuery({
    queryKey: ['payruns'],
    queryFn: payrollApi.listPayruns,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.listEmployees(),
  });

  const createPayrunMutation = useMutation({
    mutationFn: () => payrollApi.createPayrun(month, year),
    onSuccess: (data) => {
      setResult(data);
      setShowConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
    },
  });

  const existingPayrun = payruns.find(p => p.month === month && p.year === year);
  const payslipCount = result ? employees.length : 0;

  const totalPages = Math.ceil(payruns.length / itemsPerPage);
  const paginatedPayruns = [...payruns]
    .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
    })
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payroll Processing</h1>
        <p className="page-subtitle">Run payroll for a specific month and generate payslips.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Select Month & Year</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
          <div>
            <label className="form-label">Month</label>
            <select
              className="form-input"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTH_NAMES.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input
              type="number"
              className="form-input"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2020}
              max={2030}
            />
          </div>
          <div>
            {existingPayrun ? (
              <div style={{ padding: 12, background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: '#92400E', fontSize: 13 }}>
                <AlertCircle size={16} />
                Already processed
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setShowConfirm(true)}
                disabled={createPayrunMutation.isPending}
              >
                {createPayrunMutation.isPending ? 'Processing...' : 'Run Payroll'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showConfirm && !existingPayrun && (
        <div className="card" style={{ marginBottom: 24, border: '2px solid #FBBF24', background: '#FFFBEB' }}>
          <h3 style={{ marginTop: 0, color: '#92400E' }}>Confirm Payrun</h3>
          <p style={{ color: '#78350F', fontSize: 14 }}>
            This will generate payslips for <strong>{employees.length}</strong> active employees for{' '}
            <strong>{MONTH_NAMES[month]} {year}</strong>. This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn btn-primary"
              style={{ background: '#DC2626' }}
              onClick={() => createPayrunMutation.mutate()}
              disabled={createPayrunMutation.isPending}
            >
              {createPayrunMutation.isPending ? 'Processing...' : 'Confirm & Run'}
            </button>
            <button
              className="btn"
              style={{ background: '#E5E7EB', color: '#000' }}
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="card" style={{ marginBottom: 24, border: '2px solid #10B981', background: '#ECFDF5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <CheckCircle size={24} color="#10B981" />
            <div>
              <h3 style={{ margin: 0, color: '#059669' }}>Payrun Processed Successfully</h3>
              <p style={{ margin: '4px 0 0 0', color: '#047857', fontSize: 13 }}>
                Generated <strong>{payslipCount}</strong> payslips for {MONTH_NAMES[result.month]} {result.year}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div style={{ padding: 12, background: '#F0FDF4', borderRadius: 8 }}>
              <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#65A30D' }}>Status</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#15803D' }}>{result.status}</p>
            </div>
            <div style={{ padding: 12, background: '#F0FDF4', borderRadius: 8 }}>
              <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#65A30D' }}>Processed At</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#15803D' }}>
                {result.processed_at ? new Date(result.processed_at).toLocaleDateString('en-IN') : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Recent Payruns</h3>
        {payruns.length === 0 ? (
          <p style={{ color: '#64748B', fontSize: 14 }}>No payruns yet.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569' }}>Month</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569' }}>Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayruns.map((pr) => (
                    <tr key={pr.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: 12, fontSize: 14 }}>{MONTH_NAMES[pr.month]} {pr.year}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: pr.status === 'processed' ? '#DBEAFE' : '#FEF3C7', color: pr.status === 'processed' ? '#075985' : '#92400E' }}>
                          {pr.status}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {pr.processed_at ? new Date(pr.processed_at).toLocaleDateString('en-IN') : '—'}
                      </td>
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
                    className="btn"
                    style={{ padding: '4px 12px', fontSize: 12, background: '#F1F5F9', color: '#1E293B' }}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="btn"
                    style={{ padding: '4px 12px', fontSize: 12, background: '#F1F5F9', color: '#1E293B' }}
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

export default PayrunPage;
