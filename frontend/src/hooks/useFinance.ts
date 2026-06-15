import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/financeService';

export function useInvoicesQuery() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: api.fetchInvoices,
  });
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useDeleteInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}
