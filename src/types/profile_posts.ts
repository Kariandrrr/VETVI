import type {UUID} from './common';

export type MembershipRole = 'admin' | 'editor' | 'viewer';
export type GenderEnum = 'male' | 'female' | 'other' | 'unknown';
export type PostType = 'text' | 'photo' | 'audio' | 'video' | 'document';
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'laugh';

export interface MediaFileRead {
  id: UUID;
  post_id: UUID;
  user_id: UUID;
  original_name: string;
  stored_name: string;
  file_path: string;
  mime_type: string;
  file_size_bytes: number;
  sort_order: number;
  created_at: string;
}

export interface TagRead {
  id: UUID;
  family_group_id: UUID;
  name: string;
  created_at: string;
}

export interface ReactionSummary {
  reaction_type: ReactionType;
  count: number;
}

export interface PostRead {
  id: UUID;
  author_id: UUID;
  attributed_to_member_id: UUID | null;
  post_type: PostType;
  title: string | null;
  body: string | null;
  created_at: string;
  updated_at: string;
  media: MediaFileRead[];
  tags: TagRead[];
  reactions: ReactionSummary[];
  author: AuthorUser | null;
}

export interface PostCreate {
  attributed_to_member_id?: UUID | null;
  post_type?: PostType;
  title?: string | null;
  body?: string | null;
}

export interface PostUpdate {
  title?: string | null;
  body?: string | null;
}

export interface MemberProfileRead {
  id: UUID;
  user_id: UUID;
  family_group_id: UUID;
  role: MembershipRole;
  joined_at: string;
  linked_user_id: UUID;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  first_name: string;
  last_name: string;
  patronymic: string | null;
  maiden_name: string | null;
  gender: GenderEnum;
  birth_place: string | null;
  death_date: string | null;
  death_place: string | null;
  is_alive: boolean;
}

export interface MemberProfileUpdate {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  first_name?: string;
  last_name?: string;
  patronymic?: string | null;
  maiden_name?: string | null;
  gender?: GenderEnum;
  birth_place?: string | null;
  death_date?: string | null;
  death_place?: string | null;
  is_alive?: boolean;
}

export interface ReactionRead {
  post_id: UUID;
  member_id: UUID;
  reaction_type: ReactionType | null;
  action: 'added' | 'removed' | 'updated';
}

export interface MyReactionResponse {
  post_id: UUID;
  member_id: UUID;
  reaction_type: ReactionType | null;
}

export interface AuthorUser {
    id: UUID;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    role: string;
    created_at: string;
}
