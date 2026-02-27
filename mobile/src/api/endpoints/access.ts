import { apiClient } from '../client';

export type AccessRole = 'father' | 'mother' | 'nanny' | 'doctor';

export interface ChildAccess {
  _id: string;
  childId: string;
  userId: string;
  email: string;
  name: string;
  role: AccessRole;
  canRead: boolean;
  canWrite: boolean;
  canInvite: boolean;
}

export const accessApi = {
  list: (childId: string) =>
    apiClient.get<{ access: ChildAccess[] }>(`/access/list/${childId}`).then((r) => r.data),

  invite: (childId: string, data: { email: string; role: AccessRole }) =>
    apiClient.post(`/access/invite/${childId}`, data).then((r) => r.data),

  revoke: (childId: string, userId: string) =>
    apiClient.delete(`/access/revoke/${childId}/${userId}`).then((r) => r.data),
};
