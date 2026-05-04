export type MembershipRole = 'admin' | 'editor' | 'viewer';

export interface FamilyMember {
  id: string;
  user_id: string;
  role: MembershipRole;
  display_name?: string;
  avatar_url?: string;
  joined_at: string;
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