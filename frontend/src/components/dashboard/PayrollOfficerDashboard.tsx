import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from './StatCard';
import { analyticsApi } from '@/api/analytics.api';
import { payrollApi } from '@/api/payroll.api';

export const PayrollOfficerDashboard: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: analyticsApi.getAdminAnalytics,
  });

  const { data: payruns = [] } = useQuery({
    queryKey: ['payruns'],
    queryFn: payrollApi.listPayruns,
  });

  const recentPayruns = payruns.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Payroll Dashboard</h1>
        <p className="text-slate-500">Monitor and process organization payroll.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock size={24} />}
          value={analytics?.pending_leaves || 0}
          label="Pending Leaves"
          color="orange"
        />
        <StatCard
          icon={<DollarSign size={24} />}
          value={analytics?.processed_payruns || 0}
          label="Processed Payruns"
          color="purple"
        />
        <StatCard
          icon={<Users size={24} />}
          value={analytics?.total_employees || 0}
          label="Total Employees"
          color="blue"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          value={analytics?.total_payslips || 0}
          label="Total Payslips"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/payroll/run" className="flex items-center justify-between p-4 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-colors">
                <span className="flex items-center gap-2"><Play size={18} /> Run New Payroll</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/payroll/payslips" className="flex items-center justify-between p-4 bg-slate-50 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition-colors">
                <span className="flex items-center gap-2"><DollarSign size={18} /> View All Payslips</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 text-amber-600">
                <Clock size={20} />
                Payroll Status
            </h3>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
                {analytics?.payroll_due_month ? (
                    <p>Payroll for <b>{analytics.payroll_due_month}/{analytics.payroll_due_year}</b> is pending processing.</p>
                ) : (
                    <p>All payruns are up to date.</p>
                )}
            </div>
          </div>
        </div>

        {/* Recent Payruns */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Recent Payruns</h3>
                    <Link to="/payroll/run" className="text-xs text-indigo-600 font-semibold hover:underline">Manage All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                <th className="px-6 py-3 font-semibold">Period</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                                <th className="px-6 py-3 font-semibold">Processed At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentPayruns.map(run => (
                                <tr key={run.id} className="text-sm hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">
                                        Month {run.month}, {run.year}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            run.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {run.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {run.processed_at ? new Date(run.processed_at).toLocaleDateString() : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
