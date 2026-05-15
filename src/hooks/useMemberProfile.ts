import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {profileApi} from '@/api/profile_posts';
import {getErrorMessage} from '@/api/apiError';
import {toast} from 'sonner';
import type {UUID} from '@/types/common';
import type {MemberProfileUpdate} from '@/types/profile_posts';

export const useMemberProfile = (familyGroupId: UUID, memberId: UUID) => {
  return useQuery({
    queryKey: ['member-profile', familyGroupId, memberId],
    queryFn: async () => {
      if (!familyGroupId || !memberId) {
        throw new Error('Missing familyGroupId or memberId');
      }
      const response = await profileApi.getMemberProfile(familyGroupId, memberId);
      return response.data;
    },
    enabled: !!familyGroupId && !!memberId,
  });
};

export const useMyProfile = (familyGroupId: UUID) => {
  return useQuery({
    queryKey: ['my-profile', familyGroupId],
    queryFn: async () => {
      if (!familyGroupId) {
        throw new Error('Missing familyGroupId');
      }
      const response = await profileApi.getMyProfile(familyGroupId);
      return response.data;
    },
    enabled: !!familyGroupId,
  });
};

export const useAllFamilyMembers = (familyGroupId: UUID) => {
  return useQuery({
    queryKey: ['family-members', familyGroupId],
    queryFn: async () => {
      if (!familyGroupId) {
        throw new Error('Missing familyGroupId');
      }
      const response = await profileApi.getAllFamilyMembers(familyGroupId);
      return response.data;
    },
    enabled: !!familyGroupId,
  });
};

export const useUpdateMemberProfile = (familyGroupId: UUID, memberId: UUID) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MemberProfileUpdate) => {
      if (!familyGroupId || !memberId) {
        throw new Error('Missing familyGroupId or memberId for update');
      }
      return profileApi.updateMemberProfile(familyGroupId, memberId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-profile', familyGroupId, memberId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile', familyGroupId] });
      queryClient.invalidateQueries({ queryKey: ['family-members', familyGroupId] });
      toast.success('Профиль обновлён');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Ошибка при обновлении профиля'));
    },
  });
};