import {axiosInstance} from './auth';
import type {UUID} from '@/types/common';
import type {
    MediaFileRead,
    MemberProfileRead,
    MemberProfileUpdate,
    MyReactionResponse,
    PostCreate,
    PostRead,
    PostUpdate,
    ReactionRead,
    ReactionType,
    TagRead,
} from '@/types/profile_posts';

// ========== PROFILES ==========

export const profileApi = {
  getMyProfile: (familyGroupId: UUID) =>
    axiosInstance.get<MemberProfileRead>(
      `/profiles/families/${familyGroupId}/members/me`
    ),

  getMemberProfile: (familyGroupId: UUID, memberId: UUID) =>
    axiosInstance.get<MemberProfileRead>(
      `/profiles/families/${familyGroupId}/members/${memberId}`
    ),

  getAllFamilyMembers: (familyGroupId: UUID) =>
    axiosInstance.get<MemberProfileRead[]>(
      `/profiles/families/${familyGroupId}/members`
    ),

  updateMemberProfile: (
    familyGroupId: UUID,
    memberId: UUID,
    data: MemberProfileUpdate
  ) =>
    axiosInstance.patch<MemberProfileRead>(
      `/profiles/families/${familyGroupId}/members/${memberId}`,
      data
    ),

    updateMyProfile: async (data: {
    first_name?: string;
    last_name?: string;
    patronymic?: string | null;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    birth_place?: string | null;
    date_of_birth?: string | null;
    bio?: string | null;
}) => {
    console.log('Sending update to server:', data);
    const response = await axiosInstance.patch<MemberProfileRead>(`/profiles/me/profile`, data);
    console.log('Server response:', response.data);
    return response.data;
},
};



// ========== POSTS ==========

export const postsApi = {
  createPost: (data: PostCreate) =>
    axiosInstance.post<PostRead>('/posts/posts', data),

  getUserPosts: (userId: UUID, skip = 0, limit = 20) =>
    axiosInstance.get<PostRead[]>(`/posts/users/${userId}/posts`, {
      params: { skip, limit },
    }),

  getFamilyFeed: (familyGroupId: UUID, skip = 0, limit = 20) =>
    axiosInstance.get<PostRead[]>(`/posts/families/${familyGroupId}/feed`, {
      params: { skip, limit },
    }),

  getPost: (postId: UUID) =>
    axiosInstance.get<PostRead>(`/posts/posts/${postId}`),

  updatePost: (postId: UUID, data: PostUpdate) =>
    axiosInstance.put<PostRead>(`/posts/posts/${postId}`, data),

  deletePost: (postId: UUID) =>
    axiosInstance.delete(`/posts/posts/${postId}`),
};

// ========== MEDIA ==========

export const mediaApi = {
  uploadMedia: (postId: UUID, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post<MediaFileRead>(
      `/media/posts/${postId}/media`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  getMediaStreamUrl: (mediaId: UUID) =>
    `/media/media/${mediaId}/stream`,
};

// ========== REACTIONS ==========

export const reactionsApi = {
  toggleReaction: (
    familyGroupId: UUID,
    postId: UUID,
    reactionType: ReactionType
  ) =>
    axiosInstance.post<ReactionRead>(
      `/reactions/families/${familyGroupId}/posts/${postId}/reactions`,
      { reaction_type: reactionType }
    ),

  getPostReactions: (familyGroupId: UUID, postId: UUID) =>
    axiosInstance.get<{ post_id: UUID; reactions: Record<string, number>; total: number }>(
      `/reactions/families/${familyGroupId}/posts/${postId}/reactions`
    ),

  getMyReaction: (familyGroupId: UUID, postId: UUID) =>
    axiosInstance.get<MyReactionResponse>(
      `/reactions/families/${familyGroupId}/posts/${postId}/my-reaction`
    ),
};

// ========== TAGS ==========

export const tagsApi = {
  createTag: (familyGroupId: UUID, name: string) =>
    axiosInstance.post<TagRead>(`/tags/families/${familyGroupId}/tags`, { name }),

  getFamilyTags: (familyGroupId: UUID) =>
    axiosInstance.get<TagRead[]>(`/tags/families/${familyGroupId}/tags`),

  updateTag: (familyGroupId: UUID, tagId: UUID, name: string) =>
    axiosInstance.put<TagRead>(`/tags/families/${familyGroupId}/tags/${tagId}`, { name }),

  attachTagsToPost: (familyGroupId: UUID, postId: UUID, tagIds: UUID[]) =>
    axiosInstance.post<PostRead>(
      `/tags/families/${familyGroupId}/posts/${postId}/tags`,
      tagIds
    ),
};