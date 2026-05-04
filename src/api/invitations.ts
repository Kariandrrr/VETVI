import {axiosInstance} from './auth';
import type {InvitationRead} from '@/types/families';

export const invitationsAPI = {
  createInvite: async (familyId: string, maxUses: number = 1): Promise<InvitationRead> => {
    const response = await axiosInstance.post(`/invitations/families/${familyId}/invites`, {
      max_uses: maxUses,
      assigned_role: 'editor'
    });
    return response.data;
  },

  joinByToken: async (token: string) => {
    const response = await axiosInstance.post(`/invitations/join/${token}`);
    return response.data;
  }
};