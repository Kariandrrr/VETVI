import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {familyApi} from '@/api/family';
import type {InvitationCreate} from '@/types/families';

export const useFamilies = () => {
  return useQuery({
    queryKey: ['families'],
    queryFn: familyApi.getMyFamilies,
  });
};

export const useCreateFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: familyApi.createFamily,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });
};

export const useCreateInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, data }: { familyId: string; data: InvitationCreate }) =>
      familyApi.createInvite(familyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });
};

export const useDeleteFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: familyApi.deleteFamily,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['families'] }),
  });
};