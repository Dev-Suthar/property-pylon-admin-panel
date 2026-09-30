import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Tone } from '@/components/admin/StatusBadge';
import { UNIT_STATUS, type Demand, type Inventory, type Milestone, type PaymentPlan, type UnitStatus } from '@/services/companyApi';
import { cn } from '@/lib/utils';

/** React Query keys, all prefixed with the company id. */
export const qk = {
  projects: (cid: string, search?: string) => [cid, 'projects', search ?? ''] as const,
  project: (cid: string, id: string) => [cid, 'project', id] as const,
  units: (cid: string, projectId: string, towerId?: string) => [cid, 'units', projectId, towerId ?? 'all'] as const,
  unit: (cid: string, id: string) => [cid, 'unit', id] as const,
  plans: (cid: string, projectId: string) => [cid, 'plans', projectId] as const,
  bookings: (cid: string, params: Record<string, string | undefined> = {}) => [cid, 'bookings', params] as const,
  booking: (cid: string, id: string) => [cid, 'booking', id] as const,
  collections: (cid: string, status: string) => [cid, 'collections', status] as const,
};

export const UNIT_TONE: Record<UnitStatus, Tone> = {
  available: 'success',
  hold: 'warning',
  booked: 'accent',
  sold: 'neutral',
  blocked: 'danger',
};
export const UNIT_ABBR: Record<UnitStatus, string> = { available: 'Avl', hold: 'Hold', booked: 'Bkd', sold: 'Sold', blocked: 'Blk' };
export const UNIT_ORDER: UnitStatus[] = ['available', 'hold', 'booked', 'sold', 'blocked'];

/** Tile / bar classes per tone (Tailwind only; theme remaps these). */
export const TONE_TILE: Record<Tone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400',
  accent: 'border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-400',
  neutral: 'border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400',
  danger: 'border-red-200 bg-red-50 text-red-800 hover:border-red-400',
};
export const TONE_BAR: Record<Tone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  accent: 'bg-blue-600',
  neutral: 'bg-slate-400',
  danger: 'bg-red-500',
};

export const DEMAND_TONE: Record<Demand['status'], Tone> = {
  pending: 'neutral',
  raised: 'accent',
  partially_paid: 'warning',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'neutral',
};

/** Stacked inventory bar with text counts underneath (never colour alone). */
export function InventoryBar({ inventory, className }: { inventory?: Inventory; className?: string }) {
  const inv = inventory ?? { available: 0, hold: 0, booked: 0, sold: 0, blocked: 0, total: 0 };
  const total = inv.total || 0;
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${total} units`}>
        {total
          ? UNIT_ORDER.map((s) =>
              inv[s] ? <div key={s} className={TONE_BAR[UNIT_TONE[s]]} style={{ width: `${(inv[s] / total) * 100}%` }} /> : null,
            )
          : null}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
        {UNIT_ORDER.map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className={cn('h-2 w-2 rounded-full', TONE_BAR[UNIT_TONE[s]])} aria-hidden />
            {UNIT_STATUS[s]} <span className="font-semibold text-slate-900">{inv[s] ?? 0}</span>
          </span>
        ))}
        <span className="text-slate-500">· {total} total</span>
      </div>
    </div>
  );
}

export function ErrorRow({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" /> {error.message}
      </span>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

/** Same templates the broker app offers (property-pylon-mobile-app/src/services/api/bookings.ts). */
export const PLAN_TEMPLATES: { name: string; type: PaymentPlan['type']; milestones: Milestone[] }[] = [
  {
    name: 'Construction linked',
    type: 'clp',
    milestones: [
      { name: 'On booking', pct: 10, trigger: 'booking' },
      { name: 'On agreement', pct: 10, trigger: 'agreement' },
      { name: 'Plinth', pct: 15, trigger: 'construction' },
      { name: 'Slabs (in stages)', pct: 45, trigger: 'construction' },
      { name: 'Finishing', pct: 15, trigger: 'construction' },
      { name: 'Possession', pct: 5, trigger: 'possession' },
    ],
  },
  {
    name: '20:80 subvention',
    type: 'subvention',
    milestones: [
      { name: 'On booking', pct: 10, trigger: 'booking' },
      { name: 'On agreement', pct: 10, trigger: 'agreement' },
      { name: 'On possession', pct: 80, trigger: 'possession' },
    ],
  },
  {
    name: 'Down payment',
    type: 'milestone',
    milestones: [
      { name: 'On booking', pct: 10, trigger: 'booking' },
      { name: 'Within 45 days', pct: 85, trigger: 'agreement' },
      { name: 'On possession', pct: 5, trigger: 'possession' },
    ],
  },
];

export const TRIGGERS: { value: string; label: string }[] = [
  { value: 'booking', label: 'On booking' },
  { value: 'agreement', label: 'On agreement' },
  { value: 'construction', label: 'Construction stage' },
  { value: 'possession', label: 'On possession' },
];

/** Read `data.error.message`-style messages already normalised by companyApi. */
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
