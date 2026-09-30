import { apiClient, handleApiError } from '@/lib/api';

export type NoticeType = 'banner' | 'maintenance';
export type NoticeTone = 'info' | 'warning' | 'success';
export interface Notice {
  id: string;
  type: NoticeType;
  title: string;
  message: string;
  tone: NoticeTone;
  audience: { company_ids?: string[]; roles?: string[] };
  platforms: ('android' | 'ios')[];
  starts_at: string | null;
  ends_at: string | null;
  dismissible: boolean;
  is_active: boolean;
  live: boolean;
  created_at: string;
}
export type NoticeInput = Omit<Notice, 'id' | 'live' | 'created_at'>;

const call = async <T>(fn: () => Promise<{ data: T }>) => {
  try {
    return (await fn()).data;
  } catch (e) {
    throw new Error(handleApiError(e));
  }
};

export const noticeService = {
  list: () => call<{ data: Notice[] }>(() => apiClient.get('/admin/notices')).then((r) => r.data),
  create: (n: Partial<NoticeInput>) => call<Notice>(() => apiClient.post('/admin/notices', n)),
  update: (id: string, n: Partial<NoticeInput>) => call<Notice>(() => apiClient.put(`/admin/notices/${id}`, n)),
  remove: (id: string) => call(() => apiClient.delete(`/admin/notices/${id}`)),
};
