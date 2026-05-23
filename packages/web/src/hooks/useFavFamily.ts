import { useQuery } from '@tanstack/react-query';
import { familyApi } from '@/api/family';
import { useFamilyTreeData } from '@/hooks/useFamilyTreeData';

export const useFavoriteFamily = () => {
const { data: favoriteFamily, isLoading: isLoadingFavorite } = useQuery({
  queryKey: ['favorite-family'],
  queryFn: async () => {
    const response = await familyApi.getFavoriteFamily();
    return response.data;
  },
  retry: false,
});

  const { members, relationships, isLoading: isLoadingTree } = useFamilyTreeData(
    favoriteFamily?.id
  );

  return {
    favoriteFamily,
    members,
    relationships,
    isLoading: isLoadingFavorite || isLoadingTree,
  };
};