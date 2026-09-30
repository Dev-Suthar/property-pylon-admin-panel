import { apiClient, handleApiError } from '@/lib/api';

export interface OptionItem {
  value: string | number;
  label: string;
  active: boolean;
}
export interface ListDef {
  key: string;
  group: string;
  label: string;
  description: string;
  locked: boolean;
  kind: 'text' | 'number';
  slug: boolean;
  max: number | null;
  defaults: { value: string | number; label: string }[];
}
export interface ResolvedList {
  source: 'default' | 'platform' | 'company';
  items: OptionItem[];
  updated_at: string | null;
}
export interface OptionListsResponse {
  scope: 'platform' | 'company';
  catalog: ListDef[];
  lists: Record<string, ResolvedList>;
}

const call = async <T>(fn: () => Promise<{ data: T }>) => {
  try {
    return (await fn()).data;
  } catch (e) {
    throw new Error(handleApiError(e));
  }
};

export const optionListService = {
  all: (companyId?: string | null) =>
    call<OptionListsResponse>(() => apiClient.get('/admin/option-lists', { params: companyId ? { company_id: companyId } : {} })),
  save: (key: string, items: OptionItem[], companyId?: string | null) =>
    call<ResolvedList & { key: string }>(() => apiClient.put(`/admin/option-lists/${key}`, { items, ...(companyId ? { company_id: companyId } : {}) })),
  reset: (key: string, companyId?: string | null) =>
    call<ResolvedList & { key: string }>(() => apiClient.delete(`/admin/option-lists/${key}`, { params: companyId ? { company_id: companyId } : {} })),
};
