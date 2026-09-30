/**
 * Company-scoped APIs (the same ones the broker app uses). Super admins are
 * allowed through `authorize`, so the admin panel can do everything an agency
 * can: visits, follow-ups, deals/commissions, partners, pipeline, rentals,
 * attendance, insights, lead capture, CSV import/export, media, notes.
 */
import { apiClient, handleApiError } from '@/lib/api';

const base = (companyId: string) => `/companies/${companyId}`;

const call = async <T>(fn: () => Promise<{ data: T }>): Promise<T> => {
  try {
    return (await fn()).data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const LEAD_SOURCES = [
  ['walk_in', 'Walk-in'], ['referral', 'Referral'], ['website', 'Website'], ['facebook', 'Facebook'],
  ['instagram', 'Instagram'], ['google', 'Google'], ['99acres', '99acres'], ['magicbricks', 'MagicBricks'],
  ['housing', 'Housing.com'], ['justdial', 'Justdial'], ['whatsapp', 'WhatsApp'], ['call', 'Phone call'],
  ['hoarding', 'Hoarding'], ['partner', 'Channel partner'], ['other', 'Other'],
] as const;
export const sourceLabel = (s?: string | null) =>
  LEAD_SOURCES.find(([v]) => v === s)?.[1] ?? (s && s !== 'unknown' ? s : 'Not recorded');

export interface Visit {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  priority?: string;
  notes?: string;
  property_id: string;
  customer_id: string;
  Property?: { id: string; title: string };
  Customer?: { id: string; name: string; phone?: string };
  property?: { id: string; title: string };
  customer?: { id: string; name: string; phone?: string };
  property_title?: string;
  customer_name?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  due_at: string;
  status: 'open' | 'done' | 'cancelled';
  priority: string;
  Customer?: { id: string; name: string } | null;
  Property?: { id: string; title: string } | null;
  Assignee?: { id: string; name: string } | null;
}

export interface Partner {
  id: string;
  name: string;
  firm_name?: string;
  phone?: string;
  email?: string;
  rera_number?: string;
  default_commission_pct?: string | number | null;
  notes?: string;
  is_active: boolean;
  deals?: number;
  commission_shared?: number;
}

export interface Deal {
  id: string;
  deal_type: 'sale' | 'rent';
  deal_date: string;
  final_amount?: string;
  commission_amount?: string;
  partner_id?: string | null;
  partner_commission_pct?: string | null;
  partner_commission_amount?: string | null;
  commission_status: 'pending' | 'received' | 'waived';
  net_commission: number;
  Property?: { id: string; title: string };
  Customer?: { id: string; name: string };
  Partner?: { id: string; name: string } | null;
  Closer?: { id: string; name: string } | null;
}

export interface PipelineColumn {
  status: 'OPEN' | 'DISCUSSION' | 'DEALING' | 'CLOSED';
  count: number;
  items: Array<{ id: string; title: string; city?: string; bhk?: string; price?: string; monthly_rent?: string; property_purpose?: string; image?: string | null }>;
}

const qs = (params: Record<string, unknown>) => ({ params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) });

export interface CompanyStats {
  today?: { follow_ups_due: number; overdue: number; visits_today: number; new_leads: number; hot_leads: number };
  leads_by_stage?: Record<string, number>;
  total_customers?: number;
  active_properties?: number;
  deals_closed_this_month?: number;
  visits_this_week?: number;
}

export const workspaceService = {
  stats: (cid: string) => call<CompanyStats>(() => apiClient.get(`${base(cid)}/dashboard/stats`)),

  // Visits
  visits: (cid: string, params: { status?: string; page?: number; limit?: number } = {}) =>
    call<any>(() => apiClient.get(`${base(cid)}/visits`, qs({ limit: 50, ...params }))),
  createVisit: (cid: string, data: { property_id: string; customer_id: string; date: string; time: string; notes?: string; priority?: string }) =>
    call<Visit>(() => apiClient.post(`${base(cid)}/visits`, data)),
  updateVisit: (cid: string, id: string, data: Partial<Visit>) => call<Visit>(() => apiClient.put(`${base(cid)}/visits/${id}`, data)),
  visitStatus: (cid: string, id: string, status: Visit['status']) =>
    call<Visit>(() => apiClient.patch(`${base(cid)}/visits/${id}/status`, { status })),
  deleteVisit: (cid: string, id: string) => call(() => apiClient.delete(`${base(cid)}/visits/${id}`)),

  // Follow-ups
  tasks: (cid: string, params: { status?: string; due?: string } = {}) =>
    call<{ data: Task[]; total: number; overdue: number }>(() => apiClient.get(`${base(cid)}/tasks`, qs({ limit: 100, ...params }))),
  createTask: (cid: string, data: Partial<Task> & { customer_id?: string; assigned_to?: string }) =>
    call<Task>(() => apiClient.post(`${base(cid)}/tasks`, data)),
  updateTask: (cid: string, id: string, data: Partial<Task>) => call<Task>(() => apiClient.put(`${base(cid)}/tasks/${id}`, data)),
  deleteTask: (cid: string, id: string) => call(() => apiClient.delete(`${base(cid)}/tasks/${id}`)),

  // Partners
  partners: (cid: string) => call<{ data: Partner[] }>(() => apiClient.get(`${base(cid)}/partners`)).then((r) => r.data),
  savePartner: (cid: string, data: Partial<Partner>, id?: string) =>
    call<Partner>(() => (id ? apiClient.put(`${base(cid)}/partners/${id}`, data) : apiClient.post(`${base(cid)}/partners`, data))),
  deletePartner: (cid: string, id: string) => call(() => apiClient.delete(`${base(cid)}/partners/${id}`)),

  // Deals & commissions
  deals: (cid: string, params: { commission_status?: string } = {}) =>
    call<{ data: Deal[]; total: number; summary: { gross: number; partner_share: number; received: number; pending: number } }>(() =>
      apiClient.get(`${base(cid)}/deals`, qs(params))
    ),
  updateDeal: (cid: string, id: string, data: Record<string, unknown>) => call<Deal>(() => apiClient.patch(`${base(cid)}/deals/${id}`, data)),

  // Pipeline / properties
  pipeline: (cid: string) => call<{ columns: PipelineColumn[] }>(() => apiClient.get(`${base(cid)}/insights/pipeline`)).then((r) => r.columns),
  propertyStatus: (cid: string, id: string, status: string) =>
    call(() => apiClient.patch(`${base(cid)}/properties/${id}/status`, { status })),
  closeDeal: (cid: string, id: string, data: Record<string, unknown>) =>
    call(() => apiClient.post(`${base(cid)}/properties/${id}/close-deal`, data)),
  share: (cid: string, id: string) =>
    call<{ share_url: string; whatsapp_text: string; brochure_url: string }>(() =>
      apiClient.post(`${base(cid)}/properties/${id}/share`, { share_method: 'admin' })
    ),
  uploadPropertyMedia: (cid: string, id: string, file: File, type: 'image' | 'video' | 'floor_plan', onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    return call(() =>
      apiClient.post(`${base(cid)}/properties/${id}/media`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5 * 60 * 1000, // server compresses + watermarks videos
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
    );
  },
  deletePropertyMedia: (cid: string, propertyId: string, mediaId: string) =>
    call(() => apiClient.delete(`${base(cid)}/properties/${propertyId}/media/${mediaId}`)),

  // Suggestions (property ↔ customer)
  suggestedCustomers: (cid: string, propertyId: string) =>
    call<any>(() => apiClient.get(`${base(cid)}/properties/${propertyId}/suggested-customers`)),
  addSuggestedCustomers: (cid: string, propertyId: string, customerIds: string[]) =>
    call(() => apiClient.post(`${base(cid)}/properties/${propertyId}/suggested-customers`, { customer_ids: customerIds })),
  removeSuggestedCustomer: (cid: string, propertyId: string, customerId: string) =>
    call(() => apiClient.delete(`${base(cid)}/properties/${propertyId}/suggested-customers/${customerId}`)),
  autoSuggestCustomers: (cid: string, propertyId: string) =>
    call(() => apiClient.post(`${base(cid)}/properties/${propertyId}/auto-suggest-customers`, {})),

  // Notes
  addPropertyNote: (cid: string, propertyId: string, content: string, type = 'general') =>
    call(() => apiClient.post(`${base(cid)}/notes/properties/${propertyId}/notes`, { content, type })),
  deletePropertyNote: (cid: string, propertyId: string, noteId: string) =>
    call(() => apiClient.delete(`${base(cid)}/notes/properties/${propertyId}/notes/${noteId}`)),
  deleteCustomerNote: (cid: string, customerId: string, noteId: string) =>
    call(() => apiClient.delete(`${base(cid)}/notes/customers/${customerId}/notes/${noteId}`)),

  // Rentals
  rentals: (cid: string) =>
    call<any>(() => apiClient.get(`${base(cid)}/rental-agreements/expiring`, qs({ mode: 'all', limit: 100 }))),

  // Attendance
  attendance: (cid: string, params: { from?: string; to?: string } = {}) =>
    call<{ data: any[] }>(() => apiClient.get(`${base(cid)}/attendance`, qs(params))).then((r) => r.data),

  // Insights
  leadSources: (cid: string, from?: string) =>
    call<{ data: Array<{ source: string; leads: number; hot: number; converted: number; conversion_rate: number }>; total_leads: number }>(() =>
      apiClient.get(`${base(cid)}/insights/lead-sources`, qs({ from }))
    ),
  leaderboard: (cid: string, from?: string) =>
    call<{ data: Array<{ user_id: string; name: string; role: string; visits_completed: number; deals_closed: number; commission: number; tasks_done: number }> }>(() =>
      apiClient.get(`${base(cid)}/insights/leaderboard`, qs({ from }))
    ).then((r) => r.data),

  // Lead capture + CSV
  leadWebhook: (cid: string) => call<{ key: string; url: string; example: Record<string, string> }>(() => apiClient.get(`${base(cid)}/lead-webhook`)),
  rotateLeadWebhook: (cid: string) => call<{ key: string; url: string }>(() => apiClient.post(`${base(cid)}/lead-webhook/rotate`)),
  importCsv: (cid: string, entity: 'customers' | 'properties', csv: string, dryRun: boolean) =>
    call<{ total: number; created: number; skipped: number; failed: number; errors: Array<{ row: number; errors: string[] }>; dry_run: boolean }>(() =>
      apiClient.post(`${base(cid)}/data/import/${entity}`, { csv, dry_run: dryRun })
    ),
  downloadCsv: async (cid: string, kind: 'export' | 'template', entity: string) => {
    try {
      const res = await apiClient.get(`${base(cid)}/data/${kind}/${entity}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}${kind === 'template' ? '-template' : ''}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Lookups for pickers
  properties: (cid: string, search?: string) =>
    call<any>(() => apiClient.get(`${base(cid)}/properties`, qs({ limit: 50, search }))),
  customers: (cid: string, search?: string) =>
    call<any>(() => apiClient.get(`${base(cid)}/customers`, qs({ limit: 50, search }))),
};

export const rows = <T,>(payload: any): T[] => payload?.data ?? payload?.properties ?? payload?.customers ?? payload?.visits ?? payload?.agreements ?? (Array.isArray(payload) ? payload : []);

export const inr = (n?: number | string | null) => {
  const v = Number(n);
  if (n === null || n === undefined || n === '' || Number.isNaN(v)) return '—';
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
};
