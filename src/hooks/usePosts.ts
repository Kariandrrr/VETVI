import {useInfiniteQuery, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {mediaApi, postsApi, reactionsApi, tagsApi} from '@/api/profile_posts';
import {getErrorMessage} from '@/api/apiError';
import {toast} from 'sonner';
import type {UUID} from '@/types/common';
import type {PostCreate, PostUpdate, ReactionType} from '@/types/profile_posts';

export const useFamilyFeed = (familyGroupId: UUID, limit = 20) => {
  return useInfiniteQuery({
    queryKey: ['family-feed', familyGroupId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await postsApi.getFamilyFeed(familyGroupId, pageParam, limit);
      return {
        posts: response.data,
        nextOffset: pageParam + limit,
        hasMore: response.data.length === limit,
      };
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined,
    initialPageParam: 0,
    enabled: !!familyGroupId,
  });
};

export const useUserPosts = (userId: UUID, options?: { enabled?: boolean }) => {
    return useInfiniteQuery({
        queryKey: ['user-posts', userId],
        queryFn: async ({ pageParam = 0 }) => {
            const response = await postsApi.getUserPosts(userId, pageParam, 20);
            return {
                posts: response.data,
                nextOffset: pageParam + 20,
                hasMore: response.data.length === 20,
            };
        },
        getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined,
        initialPageParam: 0,
        enabled: !!userId && options?.enabled !== false,
    });
};

export const useCreatePost = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PostCreate) => postsApi.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Пост опубликован');
      onSuccessCallback?.();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Ошибка при создании поста'));
    },
  });
};

export const useUpdatePost = (postId: UUID) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PostUpdate) => postsApi.updatePost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['family-feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Пост обновлён');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Ошибка при обновлении поста'));
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: UUID) => postsApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success('Пост удалён');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Ошибка при удалении поста'));
    },
  });
};

export const useUploadMedia = (postId: UUID) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => mediaApi.uploadMedia(postId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['family-feed'] });
      toast.success('Медиафайл загружен');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Ошибка при загрузке медиа'));
    },
  });
};

export const useToggleReaction = (familyGroupId: UUID, postId: UUID) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reactionType: ReactionType) =>
      reactionsApi.toggleReaction(familyGroupId, postId, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['my-reaction', familyGroupId, postId] });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Ошибка при установке реакции'));
    },
  });
};

export const useMyReaction = (familyGroupId: UUID, postId: UUID) => {
  return useQuery({
    queryKey: ['my-reaction', familyGroupId, postId],
    queryFn: async () => {
      const response = await reactionsApi.getMyReaction(familyGroupId, postId);
      return response.data;
    },
    enabled: !!familyGroupId && !!postId,
  });
};

export const useFamilyTags = (familyGroupId: UUID) => {
  return useQuery({
    queryKey: ['family-tags', familyGroupId],
    queryFn: async () => {
      const response = await tagsApi.getFamilyTags(familyGroupId);
      return response.data;
    },
    enabled: !!familyGroupId,
  });
};

export const useCreateTag = (familyGroupId: UUID) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => tagsApi.createTag(familyGroupId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-tags', familyGroupId] });
      toast.success('Тег создан');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Ошибка при создании тега'));
    },
  });
};

export const useAttachTagsToPost = (familyGroupId: UUID, postId: UUID) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagIds: UUID[]) => tagsApi.attachTagsToPost(familyGroupId, postId, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['family-feed'] });
      toast.success('Теги добавлены');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Ошибка при добавлении тегов'));
    },
  });
};