import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/api/auth';
import type { UUID } from '@/types/common';

export interface Invitation {
  id: UUID;
  family_group_id: UUID;
  token: string;
  assigned_role: 'viewer' | 'editor' | 'admin';
  max_uses: number;
  times_used: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  invited_by: UUID;
}

export const useFamilyInvites = (familyId: string) => {
  return useQuery<Invitation[]>({
    queryKey: ['invites', familyId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/families/invites/${familyId}`);
      return response.data;
    },
    enabled: !!familyId,
  });
};

export const useRevokeInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, inviteId }: { familyId: string; inviteId: string }) => {
      await axiosInstance.post(`/families/invites/${familyId}/${inviteId}/revoke`, {});
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invites', variables.familyId] });
    },
  });
};



interface DeleteInviteParams {
  familyId: string | number;
  inviteId: string | number;
}

export const useDeleteInvite = () => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, DeleteInviteParams>({
    mutationFn: ({ familyId, inviteId }) =>
      axiosInstance.delete(`/families/invites/${familyId}/${inviteId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['invites', variables.familyId]
      });
    },
  });
};