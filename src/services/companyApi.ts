/**
 * Company-scoped APIs for the v2 app modules (leads, team, builder, bookings,
 * collections, reports, targets, templates, settings). Same endpoints the
 * broker app uses; super admins act as the company owner (server `authorize`).
 * Shapes mirror property-pylon-mobile-app/src/services/api/*.
 */
import { apiClient, handleApiError } from '@/lib/api';

const base = (cid: string) => `/companies/${cid}`;
const qs = (params: Record<string, unknown>) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
};
const call = async <T>(fn: () => Promise<{ data: T }>): Promise<T> => {
  try {
    return (await fn()).data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};
const get = <T>(cid: string, path: string) => call<T>(() => apiClient.get(`${base(cid)}${path}`));
const post = <T>(cid: string, path: string, body: unknown = {}) => call<T>(() => apiClient.post(`${base(cid)}${path}`, body));
const put = <T>(cid: string, path: string, body: unknown) => call<T>(() => apiClient.put(`${base(cid)}${path}`, body));
const patch = <T>(cid: string, path: string, body: unknown) => call<T>(() => apiClient.patch(`${base(cid)}${path}`, body));
const del = <T>(cid: string, path: string) => call<T>(() => apiClient.delete(`${base(cid)}${path}`));

// ─── Shared helpers ────────────────────────────────────────────────────────
export const inr = (n?: number | string | null, compact = false) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  if (compact) {
    if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2).replace(/\.?0+$/, '')} Cr`;
    if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2).replace(/\.?0+$/, '')} L`;
  }
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
};
export const dateIN = (iso?: string | null, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' })
    : '—';
export const thisMonth = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 7);
export const shiftMonth = (m: string, by: number) => {
  const d = new Date(`${m}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
};
export const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// ─── Leads ─────────────────────────────────────────────────────────────────
export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'site_visit' | 'negotiation' | 'booked' | 'lost';
export const STAGES: { value: LeadStage; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'site_visit', label: 'Site visit' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'booked', label: 'Booked' },
  { value: 'lost', label: 'Lost' },
];
export const stageLabel = (s?: string | null) => STAGES.find((x) => x.value === s)?.label ?? 'New';
export const LOST_REASONS = ['Budget mismatch', 'Bought elsewhere', 'Not responding', 'Location mismatch', 'Plan postponed', 'Not genuine'];

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  type: 'buyer' | 'owner' | 'both';
  status: 'active' | 'inactive';
  temperature?: LeadTemperature;
  lead_stage?: LeadStage;
  lead_score?: number;
  lost_reason?: string | null;
  next_follow_up_at?: string | null;
  assigned_to?: string | null;
  source?: string | null;
  preferred_area?: string | null;
  preferred_bhk?: string[] | null;
  budget_min?: number | string | null;
  budget_max?: number | string | null;
  Assignee?: { id: string; name: string } | null;
  next_action?: { id: string; title: string; type: string; due_at: string } | null;
  last_contact?: string | null;
  notes?: string | null;
  created_at: string;
}
export interface LeadListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  temperature?: string;
  stage?: string;
  source?: string;
  assigned_to?: string;
  follow_up?: 'today' | 'overdue' | 'upcoming' | 'none';
  score_min?: number;
  sort?: 'score' | 'newest' | 'follow_up' | 'last_activity';
}
export interface TimelineItem {
  id: string;
  kind: string;
  at: string;
  title: string;
  meta?: Record<string, unknown> | null;
  by?: string | null;
}

export const leadsApi = {
  list: (cid: string, params: LeadListParams) =>
    get<{ data: Lead[]; total: number; page: number; limit: number }>(cid, `/customers${qs(params as Record<string, unknown>)}`),
  get: (cid: string, id: string) => get<Lead>(cid, `/customers/${id}`),
  update: (cid: string, id: string, data: Partial<Lead>) => put<Lead>(cid, `/customers/${id}`, data),
  setTemperature: (cid: string, id: string, temperature: LeadTemperature) => patch<Lead>(cid, `/customers/${id}/temperature`, { temperature }),
  setStage: (cid: string, id: string, stage: LeadStage, lost_reason?: string) => patch<Lead>(cid, `/customers/${id}/stage`, { stage, lost_reason }),
  assign: (cid: string, id: string, assigned_to: string) => post<Lead>(cid, `/customers/${id}/assign`, { assigned_to }),
  timeline: (cid: string, id: string) => get<{ data: TimelineItem[] }>(cid, `/customers/${id}/timeline?limit=50`).then((r) => r.data),
  addNote: (cid: string, id: string, content: string) => post(cid, `/notes/customers/${id}/notes`, { content, type: 'general' }),
};

// ─── Team ──────────────────────────────────────────────────────────────────
export type CompanyRole = 'owner' | 'manager' | 'agent' | 'telecaller';
export const ROLES: { value: CompanyRole; label: string; hint: string }[] = [
  { value: 'owner', label: 'Owner', hint: 'Everything, whole company' },
  { value: 'manager', label: 'Manager', hint: 'Their team’s leads and reports' },
  { value: 'agent', label: 'Agent', hint: 'Own leads, visits, bookings' },
  { value: 'telecaller', label: 'Telecaller', hint: 'Own leads and calls, no inventory edits' },
];
export const roleLabel = (r?: string | null) => (r === 'admin' ? 'Owner' : ROLES.find((x) => x.value === r)?.label ?? r ?? '—');

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: CompanyRole | string;
  manager_id?: string | null;
  is_active: boolean;
  last_login?: string | null;
  Manager?: { id: string; name: string } | null;
  stats?: { leads: number; hot_leads: number; visits_this_week: number; calls_today: number; deals: number };
}

export const teamApi = {
  list: (cid: string) => get<{ data: TeamMember[]; total: number; active: number }>(cid, '/team'),
  create: (cid: string, input: { name: string; email: string; phone?: string; role: CompanyRole; manager_id?: string | null }) =>
    post<{ member: TeamMember; temp_password: string }>(cid, '/team', input),
  update: (cid: string, id: string, input: Partial<Pick<TeamMember, 'name' | 'phone' | 'role' | 'manager_id'>>) =>
    put<TeamMember>(cid, `/team/${id}`, input),
  setActive: (cid: string, id: string, active: boolean) => post<{ id: string; is_active: boolean }>(cid, `/team/${id}/${active ? 'activate' : 'deactivate'}`),
  resetPassword: (cid: string, id: string) => post<{ id: string; temp_password: string }>(cid, `/team/${id}/reset-password`),
  reassign: (cid: string, from_user_id: string, to_user_id: string, entities?: string[]) =>
    post<{ moved: Record<string, number> }>(cid, '/team/reassign', { from_user_id, to_user_id, entities }),
};

// ─── Company settings ──────────────────────────────────────────────────────
export interface CompanySettings {
  lead_routing?: 'owner' | 'round_robin';
  builder_enabled?: boolean;
}
export const settingsApi = {
  get: (cid: string) => get<CompanySettings>(cid, '/settings'),
  update: (cid: string, input: CompanySettings) => put<CompanySettings>(cid, '/settings', input),
};

// ─── WhatsApp templates ────────────────────────────────────────────────────
export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  category: string;
  is_active: boolean;
}
export const TEMPLATE_PLACEHOLDERS = ['{name}', '{property}', '{link}', '{agent}', '{date}'];
export const templatesApi = {
  list: (cid: string) => get<{ data: MessageTemplate[] }>(cid, '/templates?all=true').then((r) => r.data),
  create: (cid: string, input: Partial<MessageTemplate>) => post<MessageTemplate>(cid, '/templates', input),
  update: (cid: string, id: string, input: Partial<MessageTemplate>) => put<MessageTemplate>(cid, `/templates/${id}`, input),
  remove: (cid: string, id: string) => del(cid, `/templates/${id}`),
};

// ─── Builder inventory ─────────────────────────────────────────────────────
export type UnitStatus = 'available' | 'hold' | 'booked' | 'sold' | 'blocked';
export type Inventory = Record<UnitStatus | 'total', number>;
export const UNIT_STATUS: Record<UnitStatus, string> = {
  available: 'Available', hold: 'On hold', booked: 'Booked', sold: 'Sold', blocked: 'Blocked',
};
export type ProjectStatus = 'upcoming' | 'launched' | 'under_construction' | 'ready';
export const PROJECT_STATUS: Record<ProjectStatus, string> = {
  upcoming: 'Upcoming', launched: 'Launched', under_construction: 'Under construction', ready: 'Ready to move',
};
export interface Project {
  id: string;
  name: string;
  rera_number?: string | null;
  builder_name?: string | null;
  location?: string | null;
  city?: string | null;
  possession_date?: string | null;
  amenities?: string[];
  description?: string | null;
  status: ProjectStatus;
  inventory?: Inventory;
  towers_count?: number;
}
export interface Tower {
  id: string;
  name: string;
  floors: number;
  inventory?: Inventory;
}
export interface ProjectDetail extends Project {
  towers: Tower[];
  inventory: Inventory;
  configurations: { configuration: string; min_area: string | null; max_area: string | null; count: number }[];
}
export interface Unit {
  id: string;
  project_id: string;
  tower_id: string;
  floor: number;
  unit_number: string;
  configuration?: string | null;
  carpet_area?: string | null;
  super_area?: string | null;
  facing?: string | null;
  base_rate?: string | null;
  plc?: string | null;
  status: UnitStatus;
  hold_until?: string | null;
  HoldCustomer?: { id: string | null; name: string } | null;
  HoldBy?: { id: string; name: string } | null;
  indicative_price?: number | null;
  Tower?: { id: string; name: string };
}
export const builderApi = {
  projects: (cid: string, search?: string) => get<{ data: Project[] }>(cid, `/projects${qs({ search })}`).then((r) => r.data),
  project: (cid: string, id: string) => get<ProjectDetail>(cid, `/projects/${id}`),
  createProject: (cid: string, input: Partial<Project>) => post<Project>(cid, '/projects', input),
  updateProject: (cid: string, id: string, input: Partial<Project>) => put<Project>(cid, `/projects/${id}`, input),
  createTower: (cid: string, projectId: string, name: string) => post<Tower>(cid, `/projects/${projectId}/towers`, { name }),
  generateUnits: (
    cid: string,
    projectId: string,
    towerId: string,
    input: { floor_from: number; floor_to: number; units_per_floor: number; prefix?: string; configuration?: string; super_area?: number; carpet_area?: number; base_rate?: number },
  ) => post<{ created: number; skipped: number }>(cid, `/projects/${projectId}/towers/${towerId}/generate-units`, input),
  units: (cid: string, projectId: string, towerId?: string) =>
    get<{ data: Unit[] }>(cid, `/projects/${projectId}/units${qs({ tower_id: towerId })}`).then((r) => r.data),
  unit: (cid: string, id: string) => get<Unit>(cid, `/units/${id}`),
  updateUnit: (cid: string, id: string, input: Partial<Unit>) => put<Unit>(cid, `/units/${id}`, input),
  hold: (cid: string, id: string, customer_id: string, hours: number) => post<Unit>(cid, `/units/${id}/hold`, { customer_id, hours }),
  release: (cid: string, id: string) => post<{ id: string; status: string }>(cid, `/units/${id}/release`),
};

// ─── Bookings, payment plans, collections ──────────────────────────────────
export interface Milestone {
  name: string;
  pct: number;
  trigger?: string | null;
}
export interface PaymentPlan {
  id: string;
  name: string;
  type: 'clp' | 'milestone' | 'subvention';
  milestones: Milestone[];
  is_active: boolean;
}
export const PLAN_TYPES: Record<PaymentPlan['type'], string> = { clp: 'Construction linked', milestone: 'Milestone', subvention: 'Subvention' };
export interface Demand {
  id: string;
  seq: number;
  milestone: string;
  pct: string;
  amount: string;
  paid_amount: string;
  due_date?: string | null;
  status: 'pending' | 'raised' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  outstanding?: number;
  Booking?: {
    id: string;
    booking_number: string;
    Customer?: { id: string; name: string; phone: string };
    Unit?: { id: string; unit_number: string };
    Project?: { id: string; name: string };
  };
}
export interface PaymentRow {
  id: string;
  amount: string;
  paid_at: string;
  mode: string;
  reference?: string | null;
  receipt_number: string;
  demand_id?: string | null;
}
export interface Booking {
  id: string;
  booking_number: string;
  booking_date: string;
  agreement_value: string;
  total_value: string;
  status: 'confirmed' | 'cancelled';
  cancel_reason?: string | null;
  cost_sheet: {
    lines?: { label: string; amount: number }[];
    agreement_value?: number;
    gst_pct?: number;
    gst?: number;
    total?: number;
    plan?: { name: string };
  };
  paid_total: number;
  outstanding?: number;
  Project?: { id: string; name: string };
  Unit?: { id: string; unit_number: string; floor: number; configuration?: string; Tower?: { name: string } };
  Customer?: { id: string; name: string; phone: string };
  Creator?: { id: string; name: string };
  Demands?: Demand[];
  Payments?: PaymentRow[];
}
export interface BookingDocs {
  cost_sheet: string;
  allotment_letter: string;
  demands: { id: string; seq: number; url: string }[];
  receipts: { id: string; receipt_number: string; url: string }[];
}
export const PAYMENT_MODES = [
  { label: 'UPI', value: 'upi' },
  { label: 'Bank transfer', value: 'bank_transfer' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Loan disbursal', value: 'loan_disbursal' },
  { label: 'Cash', value: 'cash' },
];
export const DEMAND_STATUS: Record<Demand['status'], string> = {
  pending: 'Not raised', raised: 'Raised', partially_paid: 'Part paid', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled',
};

export const bookingsApi = {
  plans: (cid: string, projectId: string) => get<{ data: PaymentPlan[] }>(cid, `/projects/${projectId}/payment-plans`).then((r) => r.data),
  createPlan: (cid: string, projectId: string, plan: { name: string; type: string; milestones: Milestone[] }) =>
    post<PaymentPlan>(cid, `/projects/${projectId}/payment-plans`, plan),
  updatePlan: (cid: string, projectId: string, planId: string, plan: Partial<PaymentPlan>) =>
    put<PaymentPlan>(cid, `/projects/${projectId}/payment-plans/${planId}`, plan),
  list: (cid: string, params: { status?: string; customer_id?: string; project_id?: string } = {}) =>
    get<{ data: Booking[] }>(cid, `/bookings${qs(params)}`).then((r) => r.data),
  get: (cid: string, id: string) => get<Booking>(cid, `/bookings/${id}`),
  documents: (cid: string, id: string) => get<BookingDocs>(cid, `/bookings/${id}/documents`),
  cancel: (cid: string, id: string, reason: string) => post(cid, `/bookings/${id}/cancel`, { reason }),
  collections: (cid: string, status: 'due' | 'overdue' | 'upcoming' | 'paid') =>
    get<{ data: Demand[]; totals: { outstanding: number; overdue: number } }>(cid, `/collections?status=${status}`),
  raise: (cid: string, demandId: string, due_date?: string) => post<Demand>(cid, `/demands/${demandId}/raise`, { due_date }),
  pay: (cid: string, demandId: string, input: { amount: number; mode: string; reference?: string; paid_at?: string }) =>
    post<PaymentRow>(cid, `/demands/${demandId}/payments`, input),
};

// ─── Reports & targets ─────────────────────────────────────────────────────
export type TargetMetric = 'leads_contacted' | 'site_visits' | 'bookings' | 'revenue';
export const METRIC_LABEL: Record<TargetMetric, string> = {
  leads_contacted: 'Leads contacted', site_visits: 'Site visits', bookings: 'Bookings', revenue: 'Revenue',
};
export interface AgentRow {
  user_id: string;
  name: string;
  role: string;
  leads_contacted: number;
  site_visits: number;
  bookings: number;
  revenue: number;
  commission: number;
  open_leads: number;
  hot_leads: number;
}
export interface TargetRow {
  user_id: string;
  name: string;
  role: string;
  metrics: { metric: TargetMetric; target: number; achieved: number; pct: number | null }[];
}
export const reportsApi = {
  funnel: (cid: string, month: string) => get<{ total: number; lost: number; steps: { stage: string; reached: number; pct: number }[] }>(cid, `/insights/funnel?month=${month}`),
  agents: (cid: string, month: string) => get<{ data: AgentRow[] }>(cid, `/insights/agent-performance?month=${month}`).then((r) => r.data),
  lostReasons: (cid: string, month: string) => get<{ total: number; data: { reason: string; count: number }[] }>(cid, `/insights/lost-reasons?month=${month}`),
  sources: (cid: string, month: string) => {
    const from = `${month}-01`;
    const to = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10);
    return get<{ data: { source: string; leads: number; hot: number; converted: number; conversion_rate: number }[] }>(cid, `/insights/lead-sources?from=${from}&to=${to}`).then((r) => r.data);
  },
  forecast: (cid: string) => get<{ overdue: number; months: { month: string; amount: number }[]; later: number; not_raised: number }>(cid, '/insights/collections-forecast'),
  targets: (cid: string, month: string) => get<{ month: string; data: TargetRow[] }>(cid, `/targets?month=${month}`),
  setTargets: (cid: string, month: string, targets: { user_id: string; metric: TargetMetric; target_value: number }[]) =>
    put<{ month: string; data: TargetRow[] }>(cid, '/targets', { month, targets }),
};
