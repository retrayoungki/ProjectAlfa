import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialService } from '../services/materialService';

export const useMaterialsQuery = (projectId?: string) => {
  return useQuery({
    queryKey: ['materials', projectId],
    queryFn: () => materialService.getMaterials(projectId),
  });
};

export const useMaterialByIdQuery = (id: string) => {
  return useQuery({
    queryKey: ['material', id],
    queryFn: () => materialService.getMaterialById(id),
    enabled: !!id
  });
};

export const useCreateMaterialMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: materialService.createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};

export const useUpdateMaterialMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => materialService.updateMaterial(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material', data.id] });
    },
  });
};

export const useDeleteMaterialMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: materialService.deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
};
