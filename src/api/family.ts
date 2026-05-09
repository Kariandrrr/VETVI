import {axiosInstance} from '@/api/auth';
import type {
    FamilyGroupCreate,
    FamilyGroupRead,
    FamilyMember,
    InvitationCreate,
    InvitationRead,
    Relationship
} from '@/types/families';

const BASE_URL = '/families';

export const familyApi = {
  // Семейные группы
  createFamily: (data: FamilyGroupCreate) =>
    axiosInstance.post<FamilyGroupRead>(BASE_URL, data),
  getMyFamilies: () =>
    axiosInstance.get<FamilyGroupRead[]>(`${BASE_URL}/me`),
  getFamilyById: (familyId: string) =>
    axiosInstance.get<FamilyGroupRead>(`${BASE_URL}/${familyId}`),
  deleteFamily: (familyId: string) =>
    axiosInstance.delete(`${BASE_URL}/${familyId}`),

  // Участники
  getFamilyMembers: (familyId: string) =>
    axiosInstance.get<FamilyMember[]>(`${BASE_URL}/${familyId}/members`),
  createMember: (data: { family_group_id: string; first_name: string; last_name: string; linked_user_id?: string | null }) =>
    axiosInstance.post<FamilyMember>(`${BASE_URL}/members`, data),
    deleteMember: (memberId: string) =>
    axiosInstance.delete(`${BASE_URL}/members/${memberId}`),

  // Связи
  getFamilyRelationships: (familyId: string) =>
    axiosInstance.get<Relationship[]>(`${BASE_URL}/groups/${familyId}/relationships`),

  // Приглашения
  createInvite: (familyId: string, data: InvitationCreate) =>
    axiosInstance.post<InvitationRead>(`${BASE_URL}/${familyId}/invites`, data),
  joinByToken: (token: string) =>
    axiosInstance.post(`/invitations/join/${token}`),

     // Методы для избранной группы
  setFavoriteFamily: (familyId: string) =>
    axiosInstance.patch(`${BASE_URL}/${familyId}/favourite`),
  unsetFavoriteFamily: () =>
    axiosInstance.patch(`${BASE_URL}/favourite/unset`),
      getFavoriteFamily: () =>
    axiosInstance.get<FamilyGroupRead>(`${BASE_URL}/favourite`),
};