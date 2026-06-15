import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchClients, 
  fetchClientDetail, 
  fetchClientOptions, 
  fetchClientProjects, 
  createClient, 
  updateClient, 
  deleteClient 
} from '../services/clientService';

export function useClientsQuery(params?: {
  search?: string;
  client_type?: string;
  is_active?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => fetchClients(params),
  });
}

export function useClientDetailQuery(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClientDetail(id),
    enabled: !!id,
  });
}

export function useClientOptionsQuery() {
  return useQuery({
    queryKey: ['client-options'],
    queryFn: fetchClientOptions,
  });
}

export function useClientProjectsQuery(id: string) {
  return useQuery({
    queryKey: ['client-projects', id],
    queryFn: () => fetchClientProjects(id),
    enabled: !!id,
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-options'] });
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClient,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-options'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-options'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
