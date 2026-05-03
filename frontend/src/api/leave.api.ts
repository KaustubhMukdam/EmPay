import apiClient from '@/api';
import type {
  LeaveAllocation,
  LeaveAllocationCreate,
  LeaveRequest,
  LeaveRequestCreate,
  LeaveType,
  LeaveTypeCreate,
} from '@/types/leave.types';

export const leaveApi = {
  listTypes: async (): Promise<LeaveType[]> => {
    const res = await apiClient.get<LeaveType[]>('/leave/types');
    return res.data;
  },

  createType: async (payload: LeaveTypeCreate): Promise<LeaveType> => {
    const res = await apiClient.post<LeaveType>('/leave/types', payload);
    return res.data;
  },

  myAllocations: async (): Promise<LeaveAllocation[]> => {
    const res = await apiClient.get<LeaveAllocation[]>('/leave/allocations/my');
    return res.data;
  },

  createAllocation: async (payload: LeaveAllocationCreate): Promise<LeaveAllocation> => {
    const res = await apiClient.post<LeaveAllocation>('/leave/allocations', payload);
    return res.data;
  },

  myRequests: async (): Promise<LeaveRequest[]> => {
    const res = await apiClient.get<LeaveRequest[]>('/leave/requests/my');
    return res.data;
  },

  allRequests: async (): Promise<LeaveRequest[]> => {
    const res = await apiClient.get<LeaveRequest[]>('/leave/requests/all');
    return res.data;
  },

  createRequest: async (payload: LeaveRequestCreate): Promise<LeaveRequest> => {
    const res = await apiClient.post<LeaveRequest>('/leave/requests', payload);
    return res.data;
  },

  approveRequest: async (requestId: string): Promise<LeaveRequest> => {
    const res = await apiClient.patch<LeaveRequest>(`/leave/requests/${requestId}/approve`);
    return res.data;
  },

  rejectRequest: async (requestId: string): Promise<LeaveRequest> => {
    const res = await apiClient.patch<LeaveRequest>(`/leave/requests/${requestId}/reject`);
    return res.data;
  },
};