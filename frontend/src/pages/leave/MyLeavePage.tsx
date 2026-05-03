import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/api/leave.api';
import { LEAVE_STATUS_CLASSES, LEAVE_STATUS_LABELS } from '@/types/leave.types';

const MyLeavePage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    leave_type_id: '',
    from_date: '',
    to_date: '',
    reason: '',
  });

  const { data: leaveTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['leave', 'types'],
    queryFn: leaveApi.listTypes,
  });

  // Filter to show only real leave types (exclude auto-generated ones from seeding)
  const realLeaveTypes = leaveTypes.filter(lt => !lt.name.includes('Auto Leave Type'));

  const { data: allocations = [] } = useQuery({
    queryKey: ['leave', 'allocations', 'my'],
    queryFn: leaveApi.myAllocations,
  });

  const { data: myRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['leave', 'requests', 'my'],
    queryFn: leaveApi.myRequests,
  });

  const createRequestMutation = useMutation({
    mutationFn: leaveApi.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'allocations', 'my'] });
      setForm({ leave_type_id: '', from_date: '', to_date: '', reason: '' });
    },
  });

  const leaveTypeName = useMemo(() => {
    const map = new Map(leaveTypes.map((item) => [item.id, item.name]));
    return (id: string) => map.get(id) || 'Unknown';
  }, [leaveTypes]);

  const currentYearAllocations = allocations.filter((item) => item.year === currentYear);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Leave</h1>
        <p className="page-subtitle">Apply leave and track request status.</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 16 }}>Apply for Leave</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createRequestMutation.mutate({
              leave_type_id: form.leave_type_id,
              from_date: form.from_date,
              to_date: form.to_date,
              reason: form.reason || undefined,
            });
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}
        >
          <div>
            <label className="form-label">Leave Type</label>
            <select
              className="form-input"
              value={form.leave_type_id}
              onChange={(e) => setForm((prev) => ({ ...prev, leave_type_id: e.target.value }))}
              required
            >
              <option value="">Select type</option>
              {realLeaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.is_paid ? 'Paid' : 'Unpaid'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-input"
              value={form.from_date}
              onChange={(e) => setForm((prev) => ({ ...prev, from_date: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-input"
              value={form.to_date}
              onChange={(e) => setForm((prev) => ({ ...prev, to_date: e.target.value }))}
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Reason</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Optional reason"
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" type="submit" disabled={createRequestMutation.isPending || typesLoading}>
              {createRequestMutation.isPending ? 'Submitting...' : 'Apply Leave'}
            </button>
          </div>
        </form>
        {createRequestMutation.error && (
          <div style={{ marginTop: 12, color: '#991B1B', background: '#FEE2E2', padding: '10px 12px', borderRadius: 8 }}>
            Failed to submit leave request.
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 16 }}>My Leave Balance ({currentYear})</h3>
        {currentYearAllocations.length === 0 ? (
          <p style={{ color: '#64748B' }}>No leave allocations yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {currentYearAllocations.map((allocation) => (
              <div key={allocation.id} className="card-sm">
                <div style={{ color: '#64748B', fontSize: 13 }}>{leaveTypeName(allocation.leave_type_id)}</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>
                  {Math.max(allocation.total_days - allocation.used_days, 0)}
                </div>
                <div style={{ color: '#64748B', fontSize: 12 }}>Remaining of {allocation.total_days}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 16 }}>My Leave Requests</h3>
        {requestsLoading ? (
          <p style={{ color: '#64748B' }}>Loading requests...</p>
        ) : myRequests.length === 0 ? (
          <p style={{ color: '#64748B' }}>No leave requests yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Type</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>From</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>To</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Days</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {[...myRequests]
                  .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
                  .map((request) => (
                    <tr key={request.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: 12 }}>{leaveTypeName(request.leave_type_id)}</td>
                      <td style={{ padding: 12 }}>{request.from_date}</td>
                      <td style={{ padding: 12 }}>{request.to_date}</td>
                      <td style={{ padding: 12 }}>{request.total_days}</td>
                      <td style={{ padding: 12 }}>
                        <span className={`badge ${LEAVE_STATUS_CLASSES[request.status]}`}>
                          {LEAVE_STATUS_LABELS[request.status]}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>{request.reason || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLeavePage;
