import {useQuery} from '@tanstack/react-query';
import {familyApi} from '@/api/family';

export const useFamilyTreeData = (familyId: string | undefined) => {
  const membersQuery = useQuery({
    queryKey: ['family-members', familyId],
    queryFn: async () => {
      if (!familyId) return [];
      const response = await familyApi.getFamilyMembers(familyId);
      return response.data || [];
    },
    enabled: !!familyId,
    staleTime: 1000 * 60 * 5,
  });

  const relationshipsQuery = useQuery({
    queryKey: ['family-relationships', familyId],
    queryFn: async () => {
      if (!familyId) return [];
      const response = await familyApi.getFamilyRelationships(familyId);
      return response.data || [];
    },
    enabled: !!familyId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    members: membersQuery.data || [],
    relationships: relationshipsQuery.data || [],
    isLoading: membersQuery.isLoading || relationshipsQuery.isLoading,
    refetch: () => Promise.all([membersQuery.refetch(), relationshipsQuery.refetch()]),
  };
};