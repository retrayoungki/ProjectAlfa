import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/timesheetService';

export function useTimesheetsQuery(params?: {
  week?: string;
  month?: string;
  user_id?: string;
  project_id?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['timesheets', params],
    queryFn: () => api.fetchTimesheets(params),
  });
}

export function usePendingTimesheetsQuery() {
  return useQuery({
    queryKey: ['timesheets', 'pending'],
    queryFn: () => api.fetchPendingTimesheets(),
  });
}

export function useCreateTimesheetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTimesheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useUpdateTimesheetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string; data: any }) => api.updateTimesheet(variables.id, variables.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useDeleteTimesheetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTimesheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useApproveTimesheetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.approveTimesheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useRejectTimesheetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string; rejectionReason: string }) =>
      api.rejectTimesheet(variables.id, variables.rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}

export function useApproveBulkTimesheetsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.approveBulkTimesheets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
}
