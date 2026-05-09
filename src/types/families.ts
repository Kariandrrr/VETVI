export type MembershipRole = 'viewer' | 'editor' | 'admin';
export type Gender = 'male' | 'female' | 'unknown';
export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling' | 'other';

export interface FamilyMember {
    id: string;
    family_group_id: string;
    first_name: string;
    last_name: string;
    patronymic?: string | null;
    maiden_name?: string | null;
    gender: Gender;
    birth_date?: string | null;
    birth_place?: string | null;
    death_date?: string | null;
    death_place?: string | null;
    is_alive?: boolean;
    avatar_url?: string | null;
    linked_user_id?: string | null;
    created_at: string;
    updated_at: string;
}

export interface FamilyMembershipRead {
  user_id: string;
  role: MembershipRole;
  joined_at: string;
}

export interface FamilyGroupRead {
   id: string;
  name: string;
  description?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  memberships?: FamilyMembershipRead[];
}

export interface FamilyGroupCreate {
  name: string;
  description?: string;
}

export interface InvitationCreate {
  assigned_role: MembershipRole;
  email?: string;
  max_uses?: number;
  expires_in_days?: number;
}

export interface InvitationRead {
  id: string;
  token: string;
  family_group_id: string;
  assigned_role: MembershipRole;
  expires_at: string;
  max_uses: number;
  times_used: number;
  is_active: boolean;
}

export interface Relationship {
  id: string;
  family_group_id: string;
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType | string;
  created_at: string;
}

// Хелпер для отображения имени в UI
export const getMemberFullName = (m: FamilyMember) =>
  `${m.last_name} ${m.first_name} ${m.patronymic ?? ''}`.trim();