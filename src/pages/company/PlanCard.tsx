import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  LIMIT_INFO, LIMIT_KEYS, LimitKey, LimitOverride, MODULE_INFO, MODULE_KEYS, ModuleKey, ModuleOverride, entitlementService,
} from '@/services/entitlementService';
import { subscriptionPlanService } from '@/services/subscriptionPlanService';
import { subscriptionService } from '@/services/subscriptionService';

const dateIN = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—');
const addMonths = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00`);
  x.setMonth(x.getMonth() + n);
  return x.toISOString().slice(0, 10);
};

/**
 * Company's plan, subscription, usage vs limits, and admin overrides.
 * Server enforces all of it (MODULE_DISABLED / PLAN_LIMIT).
 */
export function PlanCard({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const ent = useQuery({ queryKey: ['entitlements', companyId], queryFn: () => entitlementService.get(companyId) });
  const plans = useQuery({ queryKey: ['subscription-plans', 'active'], queryFn: () => subscriptionPlanService.getAll({ limit: 100, is_active: true }) });
  const e = ent.data;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['entitlements', companyId] });
    qc.invalidateQueries({ queryKey: ['company', companyId] });
  };
  const onError = (err: Error) => toast({ title: 'Could not save', description: err.message, variant: 'destructive' });

  // ── subscription ──
  const [planId, setPlanId] = useState('');
  useEffect(() => setPlanId(e?.plan?.id ?? ''), [e?.plan?.id]);
  const assign = useMutation({
    mutationFn: () =>
      e?.subscription
        ? subscriptionService.update(e.subscription.id, { plan_id: planId })
        : subscriptionService.create({ company_id: companyId, plan_id: planId }),
    onSuccess: () => { refresh(); toast({ title: e?.subscription ? 'Plan changed' : 'Plan assigned' }); },
    onError,
  });
  const extend = useMutation({
    mutationFn: (months: number) => subscriptionService.update(e!.subscription!.id, { renewal_date: addMonths(e!.subscription!.renewal_date, months) }),
    onSuccess: () => { refresh(); toast({ title: 'Renewal date extended' }); },
    onError,
  });
  const cancel = useMutation({
    mutationFn: () => subscriptionService.cancel(e!.subscription!.id),
    onSuccess: () => { refresh(); toast({ title: 'Subscription cancelled', description: 'The company is now unrestricted until a plan is assigned.' }); },
    onError,
  });

  // ── overrides ──
  const [mods, setMods] = useState<Record<string, ModuleOverride>>({});
  const [lims, setLims] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!e) return;
    setMods(Object.fromEntries(MODULE_KEYS.map((k) => [k, typeof e.overrides.modules[k] === 'boolean' ? (e.overrides.modules[k] as boolean) : 'inherit'])));
    setLims(Object.fromEntries(LIMIT_KEYS.map((k) => {
      const v = e.overrides.limits[k];
      return [k, v === undefined || v === null ? '' : v < 0 ? 'unlimited' : String(v)];
    })));
  }, [e]);
  const saveOverrides = useMutation({
    mutationFn: () =>
      entitlementService.update(companyId, {
        modules: mods as Record<ModuleKey, ModuleOverride>,
        limits: Object.fromEntries(LIMIT_KEYS.map((k) => {
          const v = (lims[k] ?? '').trim();
          return [k, v === '' ? 'inherit' : v === 'unlimited' ? 'unlimited' : Number(v)] as [LimitKey, LimitOverride];
        })),
      }),
    onSuccess: () => { refresh(); toast({ title: 'Overrides saved', description: 'Applied immediately in the app and API.' }); },
    onError,
  });

  if (ent.error) return <p className="text-sm text-red-600">{(ent.error as Error).message}</p>;
  if (!e) return <div className="h-40 animate-pulse rounded-lg bg-slate-100" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-5 w-5" /> Plan & limits</CardTitle>
        <CardDescription>
          {e.plan ? <>On <span className="font-semibold text-slate-900">{e.plan.name}</span> · renews {dateIN(e.subscription?.renewal_date)}</> : 'No active subscription — everything is on, no limits.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1">
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger aria-label="Plan"><SelectValue placeholder="Choose a plan" /></SelectTrigger>
              <SelectContent>
                {(plans.data?.plans ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} · ₹{Number(p.price).toLocaleString('en-IN')}/{p.period === 'yearly' ? 'yr' : 'mo'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => assign.mutate()} disabled={!planId || planId === e.plan?.id || assign.isPending}>
            {e.subscription ? 'Change plan' : 'Assign plan'}
          </Button>
          {e.subscription ? (
            <>
              <Button variant="outline" onClick={() => extend.mutate(1)} disabled={extend.isPending}>+1 month</Button>
              <Button variant="outline" onClick={() => extend.mutate(12)} disabled={extend.isPending}>+1 year</Button>
              <Button
                variant="outline"
                className="text-red-600"
                disabled={cancel.isPending}
                onClick={async () => {
                  if (await confirm({ title: 'Cancel this subscription?', description: 'Limits and plan modules stop applying until a new plan is assigned.', confirmText: 'Cancel subscription', destructive: true })) cancel.mutate();
                }}
              >
                Cancel
              </Button>
            </>
          ) : null}
        </div>

        {/* Usage */}
        <div className="grid gap-4 sm:grid-cols-2">
          {LIMIT_KEYS.map((k) => {
            const limit = e.limits[k];
            const used = e.usage[k] ?? 0;
            const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
            const over = limit !== null && used >= limit;
            return (
              <div key={k} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{LIMIT_INFO[k]}</span>
                  <span className={cn('font-semibold', over ? 'text-red-600' : 'text-slate-900')}>
                    {used} / {limit ?? '∞'}{over ? ' · full' : ''}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className={cn('h-1.5 rounded-full', over ? 'bg-red-500' : 'bg-blue-600')} style={{ width: `${limit ? pct : 0}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`${LIMIT_INFO[k]} override`}
                    className="h-8"
                    placeholder={`Plan: ${e.source.limits[k] === 'plan' ? limit ?? 'unlimited' : 'overridden'}`}
                    value={lims[k] ?? ''}
                    onChange={(ev) => setLims({ ...lims, [k]: ev.target.value })}
                  />
                  <Button type="button" size="sm" variant="ghost" onClick={() => setLims({ ...lims, [k]: 'unlimited' })}>∞</Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modules */}
        <div className="space-y-2">
          {MODULE_KEYS.map((k) => (
            <div key={k} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  {MODULE_INFO[k].label}
                  <StatusBadge tone={e.modules[k] ? 'success' : 'danger'}>{e.modules[k] ? 'On' : 'Off'}</StatusBadge>
                  {e.source.modules[k] === 'override' ? <StatusBadge tone="accent">Override</StatusBadge> : null}
                  {k === 'builder' && e.modules.builder && !e.features.builder ? <StatusBadge>Hidden by owner</StatusBadge> : null}
                </div>
                <div className="text-xs text-slate-500">{MODULE_INFO[k].hint}</div>
              </div>
              <Select value={String(mods[k] ?? 'inherit')} onValueChange={(v) => setMods({ ...mods, [k]: v === 'inherit' ? 'inherit' : v === 'true' })}>
                <SelectTrigger className="h-8 w-40" aria-label={`${MODULE_INFO[k].label} override`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Follow plan</SelectItem>
                  <SelectItem value="true">Force on</SelectItem>
                  <SelectItem value="false">Force off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => saveOverrides.mutate()} disabled={saveOverrides.isPending}>{saveOverrides.isPending ? 'Saving…' : 'Save overrides'}</Button>
          <span className="text-xs text-slate-500">Empty limit = follow plan · ∞ = unlimited for this company.</span>
        </div>
      </CardContent>
    </Card>
  );
}
