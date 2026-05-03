import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { payrollApi } from '@/api/payroll.api';
import { employeeApi } from '@/api/employees.api';

const PayslipDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: payslip, isLoading, error } = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => id ? payrollApi.getPayslipDetail(id) : Promise.reject('No ID'),
    enabled: !!id,
  });

  const { data: employee } = useQuery({
    queryKey: ['employee', payslip?.employee_id],
    queryFn: () => payslip ? employeeApi.getEmployee(payslip.employee_id) : Promise.reject('No employee'),
    enabled: !!payslip?.employee_id,
  });

  const handleDownloadPDF = () => {
    // For now, trigger browser print dialog which can save as PDF
    window.print();
  };

  if (isLoading) return <div className="card"><p style={{ color: '#94A3B8' }}>Loading...</p></div>;
  if (error || !payslip) return <div className="card"><p style={{ color: '#EF4444' }}>Payslip not found</p></div>;

  const totalDeductions = payslip.pf_deduction + payslip.prof_tax + payslip.leave_deduction;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/payroll/payslips')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="page-title">Payslip Detail</h1>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      <div className="card" style={{ maxWidth: 800, marginBottom: 24 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: 24, borderBottom: '2px solid #E2E8F0', marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>PAYSLIP</h2>
          <p style={{ margin: '0 0 12px 0', color: '#64748B', fontSize: 13 }}>
            For the Month of {new Date(payslip.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Employee Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Employee Code</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{employee?.employee_code}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Employee Name</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{employee?.name}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Department</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{employee?.department}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Designation</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{employee?.designation}</p>
          </div>
        </div>

        {/* Earnings */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Earnings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 14, color: '#475569' }}>Basic Salary</span>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>₹{payslip.basic.toLocaleString('en-IN')}</span>
            </div>
            {payslip.hra > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 14, color: '#475569' }}>HRA</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>₹{payslip.hra.toLocaleString('en-IN')}</span>
              </div>
            )}
            {payslip.other_allowances > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 14, color: '#475569' }}>Other Allowances</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>₹{payslip.other_allowances.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #E2E8F0', fontWeight: 700, fontSize: 15 }}>
              <span>Gross Salary</span>
              <span style={{ color: '#10B981' }}>₹{payslip.gross.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Deductions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 14, color: '#475569' }}>Provident Fund (12%)</span>
              <span style={{ fontWeight: 600, color: '#DC2626' }}>₹{payslip.pf_deduction.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 14, color: '#475569' }}>Professional Tax</span>
              <span style={{ fontWeight: 600, color: '#DC2626' }}>₹{payslip.prof_tax.toLocaleString('en-IN')}</span>
            </div>
            {payslip.leave_deduction > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 14, color: '#475569' }}>Leave Deduction</span>
                <span style={{ fontWeight: 600, color: '#DC2626' }}>₹{payslip.leave_deduction.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #E2E8F0', fontWeight: 700, fontSize: 15 }}>
              <span>Total Deductions</span>
              <span style={{ color: '#DC2626' }}>₹{totalDeductions.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div style={{ marginBottom: 24, padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Attendance Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#64748B' }}>Working Days</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{payslip.working_days}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#64748B' }}>Days Present</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#10B981' }}>{payslip.days_present}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#64748B' }}>Days on Leave</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>{payslip.days_on_leave}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: 12, color: '#64748B' }}>Unpaid Days</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#EF4444' }}>{payslip.unpaid_days}</p>
            </div>
          </div>
        </div>

        {/* Net Pay Box */}
        <div style={{ padding: 20, background: '#F0FDF4', border: '3px solid #10B981', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: 13, color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>Net Pay (Take Home)</p>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#15803D' }}>₹{payslip.net_pay.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
        <p>This is an electronically generated payslip and requires no signature.</p>
        <p>Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}</p>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 20px; }
          .page-header { display: none; }
          .card { box-shadow: none; border: 1px solid #E2E8F0; }
        }
      `}</style>
    </div>
  );
};

export default PayslipDetailPage;
