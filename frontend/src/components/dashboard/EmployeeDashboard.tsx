import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Clock, 
  FileText,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from './StatCard';
import { analyticsApi } from '@/api/analytics.api';
import { leaveApi } from '@/api/leave.api';
import { payrollApi } from '@/api/payroll.api';
import { useAuthStore } from '@/store/authStore';
import { MONTH_NAMES } from '@/types/payroll.types';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['employee-summary'],
    queryFn: analyticsApi.getEmployeeSummary,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['leave-requests', 'my'],
    queryFn: leaveApi.myRequests,
  });

  const { data: payslips = [] } = useQuery({
    queryKey: ['payslips', 'my'],
    queryFn: async () => {
        // We need the employee ID first
        const summary = await analyticsApi.getEmployeeSummary();
        // This is a bit redundant but works for a dashboard view
        return payrollApi.listPayslips({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    },
  });

  const recentRequests = requests.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none"></div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Good Morning, {user?.name || 'Employee'}</h1>
        <p className="text-slate-500 flex items-center gap-2">
          <Calendar size={16} />
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckCircle size={24} />}
          value={summary?.present || 0}
          label="Days Present"
          color="green"
        />
        <StatCard
          icon={<AlertCircle size={24} />}
          value={summary?.absent || 0}
          label="Days Absent"
          color="red"
        />
        <StatCard
          icon={<Clock size={24} />}
          value={summary?.on_leave || 0}
          label="Days On Leave"
          color="purple"
        />
        <StatCard
          icon={<Calendar size={24} />}
          value={Object.values(summary?.leave_balance || {}).reduce((a, b) => a + b, 0)}
          label="Leave Balance"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Check-in & Recent Activity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-indigo-600" />
                Today's Status
            </h3>
            {summary?.check_in_today ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800">
                <CheckCircle size={24} />
                <div>
                  <p className="font-bold">Checked In</p>
                  <p className="text-xs">Your attendance is being recorded.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col gap-3">
                <div className="flex items-center gap-3 text-amber-800">
                    <AlertCircle size={24} />
                    <div>
                    <p className="font-bold">Not Checked In</p>
                    <p className="text-xs">Don't forget to mark your attendance!</p>
                    </div>
                </div>
                <Link to="/attendance/my" className="btn btn-primary w-full text-center py-2">
                    Go to Attendance
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                Latest Payslip
            </h3>
            {payslips.length > 0 ? (
                <div className="p-4 border border-slate-100 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-bold text-slate-900">{MONTH_NAMES[payslips[0].payrun_month]} {payslips[0].payrun_year}</p>
                        <p className="text-xs text-slate-500">Net Pay: ₹{payslips[0].net_pay.toLocaleString()}</p>
                    </div>
                    <Link to={`/payroll/payslips/${payslips[0].id}`} className="text-indigo-600 hover:text-indigo-800">
                        <ArrowRight size={20} />
                    </Link>
                </div>
            ) : (
                <p className="text-sm text-slate-500 italic">No payslips generated yet.</p>
            )}
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Recent Leave Requests</h3>
                    <Link to="/leave/my" className="text-xs text-indigo-600 font-semibold hover:underline">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                <th className="px-6 py-3 font-semibold">Period</th>
                                <th className="px-6 py-3 font-semibold">Days</th>
                                <th className="px-6 py-3 font-semibold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentRequests.map(req => (
                                <tr key={req.id} className="text-sm hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-700">
                                        {new Date(req.from_date).toLocaleDateString()} - {new Date(req.to_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{req.total_days}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                            req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {recentRequests.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">
                                        No recent leave requests.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
