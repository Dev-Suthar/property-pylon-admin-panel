import { apiClient, handleApiError } from '@/lib/api';

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  impersonating_user_id: string | null;
  company_id: string | null;
  company_name: string | null;
  method: string;
  path: string;
  entity: string | null;
  entity_id: string | null;
  status_code: number | null;
  summary: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

export const auditService = {
  async list(params: { page?: number; limit?: number; company_id?: string; entity?: string; method?: string; from?: string; to?: string }) {
    try {
      const { data } = await apiClient.get('/admin/audit-logs', { params });
      return data as { logs: AuditLog[]; total: number; page: number; limit: number };
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },
};
