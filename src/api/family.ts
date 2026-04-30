import {axiosInstance} from '@/api/auth' ;
import type {FamilyGroupCreate, FamilyGroupRead, InvitationCreate, InvitationRead} from '@/types/families';

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
  removeMember: (familyId: string, userId: string) =>
    axiosInstance.delete(`${BASE_URL}/${familyId}/members/${userId}`),

  // Приглашения
  createInvite: (familyId: string, data: InvitationCreate) =>
    axiosInstance.post<InvitationRead>(`${BASE_URL}/${familyId}/invites`, data),

  joinByToken: (token: string) =>
    axiosInstance.post(`/invitations/join/${token}`),
};