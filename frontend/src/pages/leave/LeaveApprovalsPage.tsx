import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/api/leave.api';
import { employeeApi } from '@/api/employees.api';
import { LEAVE_STATUS_CLASSES, LEAVE_STATUS_LABELS } from '@/types/leave.types';

const LeaveApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['leave', 'types'],
    queryFn: leaveApi.listTypes,
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['leave', 'requests', 'all'],
    queryFn: leaveApi.allRequests,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.listEmployees(),
  });

  const approveMutation = useMutation({
    mutationFn: leaveApi.approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'all'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: leaveApi.rejectRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', 'requests', 'all'] });
    },
  });

  const employeeLabel = useMemo(() => {
    const map = new Map(employees.map((item) => [item.id, `${item.employee_code || 'No Code'} - ${item.name || item.user_id}`]));
    return (id: string) => map.get(id) || id;
  }, [employees]);

  const leaveTypeName = useMemo(() => {
    const map = new Map(leaveTypes.map((item) => [item.id, item.name]));
    return (id: string) => map.get(id) || 'Unknown';
  }, [leaveTypes]);

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const paginatedRequests = useMemo(() => {
    return [...requests]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [requests, currentPage, itemsPerPage]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Leave Approvals</h1>
        <p className="page-subtitle">Approve or reject leave requests.</p>
      </div>

      <div className="card">
        {isLoading ? (
          <p style={{ color: '#64748B' }}>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: '#64748B' }}>No leave requests found.</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <th style={{ padding: 12, textAlign: 'left' }}>Employee</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Type</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>From</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>To</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Days</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Reason</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map((request) => (
                    <tr key={request.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: 12 }}>{employeeLabel(request.employee_id)}</td>
                      <td style={{ padding: 12 }}>{leaveTypeName(request.leave_type_id)}</td>
                      <td style={{ padding: 12 }}>{request.from_date}</td>
                      <td style={{ padding: 12 }}>{request.to_date}</td>
                      <td style={{ padding: 12 }}>{request.total_days}</td>
                      <td style={{ padding: 12 }}>{request.reason || '—'}</td>
                      <td style={{ padding: 12 }}>
                        <span className={`badge ${LEAVE_STATUS_CLASSES[request.status]}`}>
                          {LEAVE_STATUS_LABELS[request.status]}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        {request.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => approveMutation.mutate(request.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => rejectMutation.mutate(request.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Page {currentPage} of {totalPages} ({requests.length} total requests)
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#F1F5F9', color: '#1E293B' }}
                    onClick={() => {
                        setCurrentPage(prev => Math.max(prev - 1, 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#F1F5F9', color: '#1E293B' }}
                    onClick={() => {
                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
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

export default LeaveApprovalsPage;
