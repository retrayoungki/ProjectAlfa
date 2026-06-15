import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService } from '../services/discussionService';

export const useChannels = (projectId: string) => {
  return useQuery({
    queryKey: ['channels', projectId],
    queryFn: () => discussionService.getChannels(projectId),
    enabled: !!projectId
  });
};

export const useMessages = (channelId: string) => {
  return useQuery({
    queryKey: ['messages', channelId],
    queryFn: () => discussionService.getMessages(channelId),
    enabled: !!channelId
  });
};

export const useCreateMessage = () => {
  return useMutation({
    mutationFn: ({ channelId, data }: { channelId: string; data: any }) => discussionService.createMessage(channelId, data)
  });
};

export const usePinnedMessages = (projectId: string) => {
  return useQuery({
    queryKey: ['pinnedMessages', projectId],
    queryFn: () => discussionService.getPinnedMessages(projectId),
    enabled: !!projectId
  });
};
