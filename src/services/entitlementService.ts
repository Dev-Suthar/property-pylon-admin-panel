import { apiClient, handleApiError } from '@/lib/api';
import type { LimitKey, ModuleKey } from './subscriptionPlanService';

export type { LimitKey, ModuleKey };

export const MODULE_KEYS: ModuleKey[] = ['builder', 'templates', 'reports', 'attendance', 'rentals', 'partners'];
export const LIMIT_KEYS: LimitKey[] = ['users', 'leads', 'listings', 'projects'];
export const MODULE_INFO: Record<ModuleKey, { label: string; hint: string }> = {
  builder: { label: 'Builder inventory', hint: 'Projects, units, holds, bookings, payment plans, collections' },
  templates: { label: 'WhatsApp templates', hint: 'Saved messages agents send from the app' },
  reports: { label: 'Reports & targets', hint: 'Funnel, agent performance, lost reasons, monthly targets' },
  attendance: { label: 'Attendance', hint: 'GPS check-in / check-out' },
  rentals: { label: 'Rental renewals', hint: 'Expiring rental agreements' },
  partners: { label: 'Channel partners', hint: 'Co-broking partners and commission split' },
};
export const LIMIT_INFO: Record<LimitKey, string> = {
  users: 'Team members (active)',
  leads: 'Leads',
  listings: 'Listings',
  projects: 'Builder projects',
};

export interface Entitlements {
  plan: { id: string; name: string } | null;
  subscription: { id: string; status: string; renewal_date: string; plan_name: string } | null;
  modules: Record<ModuleKey, boolean>;
  limits: Record<LimitKey, number | null>;
  overrides: { modules: Partial<Record<ModuleKey, boolean>>; limits: Partial<Record<LimitKey, number>> };
  source: { modules: Record<ModuleKey, 'plan' | 'override'>; limits: Record<LimitKey, 'plan' | 'override'> };
  features: Record<ModuleKey, boolean>;
  usage: Record<LimitKey, number>;
}

export type ModuleOverride = boolean | 'inherit';
export type LimitOverride = number | 'unlimited' | 'inherit';

const call = async <T>(fn: () => Promise<{ data: T }>) => {
  try {
    return (await fn()).data;
  } catch (e) {
    throw new Error(handleApiError(e));
  }
};

export const entitlementService = {
  get: (companyId: string) => call<Entitlements>(() => apiClient.get(`/admin/companies/${companyId}/entitlements`)),
  update: (companyId: string, body: { modules?: Partial<Record<ModuleKey, ModuleOverride>>; limits?: Partial<Record<LimitKey, LimitOverride>> }) =>
    call<Entitlements>(() => apiClient.put(`/admin/companies/${companyId}/entitlements`, body)),
};
