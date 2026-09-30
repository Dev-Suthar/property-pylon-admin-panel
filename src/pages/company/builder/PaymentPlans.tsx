import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormSheet } from '@/components/admin/FormSheet';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Empty, Field, Section } from '@/pages/workspace/shared';
import { bookingsApi, PLAN_TYPES, type Milestone, type PaymentPlan } from '@/services/companyApi';
import { cn } from '@/lib/utils';
import { ErrorRow, PLAN_TEMPLATES, qk, TRIGGERS } from './shared';

type Row = { name: string; pct: string; trigger: string };
const blank = (): Row => ({ name: '', pct: '', trigger: 'construction' });
const triggerLabel = (t?: string | null) => TRIGGERS.find((x) => x.value === t)?.label ?? t ?? '';

export function PaymentPlans({ companyId, projectId }: { companyId: string; projectId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.plans(companyId, projectId), queryFn: () => bookingsApi.plans(companyId, projectId) });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentPlan['type']>('clp');
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [formError, setFormError] = useState('');

  const total = Math.round(rows.reduce((s, r) => s + (Number(r.pct) || 0), 0) * 1000) / 1000;
  const refresh = () => qc.invalidateQueries({ queryKey: qk.plans(companyId, projectId) });

  const create = useMutation({
    mutationFn: (milestones: Milestone[]) => bookingsApi.createPlan(companyId, projectId, { name: name.trim(), type, milestones }),
    onSuccess: (p) => {
      toast({ title: 'Payment plan created', description: p.name });
      setOpen(false);
      refresh();
    },
    onError: (e: Error) => {
      setFormError(e.message);
      toast({ title: 'Could not create plan', description: e.message, variant: 'destructive' });
    },
  });
  const toggle = useMutation({
    mutationFn: (p: PaymentPlan) => bookingsApi.updatePlan(companyId, projectId, p.id, { is_active: !p.is_active }),
    onSuccess: (p) => {
      toast({ title: p.is_active ? 'Plan activated' : 'Plan deactivated', description: p.name });
      refresh();
    },
    onError: (e: Error) => toast({ title: 'Could not update plan', description: e.message, variant: 'destructive' }),
  });

  const openNew = () => {
    setName('');
    setType('clp');
    setRows([blank()]);
    setFormError('');
    setOpen(true);
  };
  const applyTemplate = (t: (typeof PLAN_TEMPLATES)[number]) => {
    setName(t.name);
    setType(t.type);
    setRows(t.milestones.map((m) => ({ name: m.name, pct: String(m.pct), trigger: m.trigger ?? 'construction' })));
    setFormError('');
  };
  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const submit = () => {
    setFormError('');
    if (name.trim().length < 2) return setFormError('Plan name is required');
    if (!rows.length) return setFormError('Add at least one milestone');
    if (rows.some((r) => !r.name.trim() || !(Number(r.pct) > 0))) return setFormError('Every milestone needs a name and a percentage above 0');
    if (Math.abs(total - 100) > 0.001) return setFormError(`Milestones must add up to 100% (now ${total}%)`);
    create.mutate(rows.map((r) => ({ name: r.name.trim(), pct: Number(r.pct), trigger: r.trigger })));
  };

  const plans = q.data ?? [];
  return (
    <Section
      title="Payment plans"
      description="Plans offered when booking a unit in this project"
      actions={
        <Button size="sm" onClick={openNew}>
          <Plus /> New plan
        </Button>
      }
    >
      {q.error ? <ErrorRow error={q.error as Error} onRetry={() => q.refetch()} /> : null}
      {q.isLoading ? <div className="h-24 animate-pulse rounded-xl bg-slate-100" /> : null}
      {!q.isLoading && !q.error && !plans.length ? <Empty text="No payment plans yet. Bookings need at least one active plan." /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-500">{PLAN_TYPES[p.type] ?? p.type}</div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <StatusBadge tone={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'Active' : 'Inactive'}</StatusBadge>
                <Switch
                  checked={p.is_active}
                  disabled={toggle.isPending}
                  onCheckedChange={() => toggle.mutate(p)}
                  aria-label={p.is_active ? `Deactivate ${p.name}` : `Activate ${p.name}`}
                />
              </label>
            </div>
            <ol className="mt-3 space-y-1 text-sm">
              {p.milestones.map((m, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-slate-600">
                    {i + 1}. {m.name}
                    {m.trigger ? <span className="text-xs text-slate-500"> · {triggerLabel(m.trigger)}</span> : null}
                  </span>
                  <span className="font-semibold text-slate-900">{Number(m.pct)}%</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <FormSheet open={open} onOpenChange={setOpen} title="New payment plan" onSubmit={submit} saving={create.isPending} submitText="Create plan" wide>
        <div>
          <div className="mb-2 text-sm font-medium text-slate-700">Use template</div>
          <div className="flex flex-wrap gap-2">
            {PLAN_TEMPLATES.map((t) => (
              <Button key={t.name} type="button" size="sm" variant="outline" onClick={() => applyTemplate(t)}>
                {t.name}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Plan name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Construction linked" required />
          </Field>
          <Field label="Type">
            <Select value={type} onValueChange={(v) => setType(v as PaymentPlan['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLAN_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Milestones</span>
            <span className={cn('font-semibold', Math.abs(total - 100) < 0.001 ? 'text-emerald-700' : 'text-red-700')}>
              Total {total}% {Math.abs(total - 100) < 0.001 ? '· OK' : '· must be 100%'}
            </span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_auto] gap-2 sm:grid-cols-[1fr_5rem_10rem_auto]">
              <Input aria-label={`Milestone ${i + 1} name`} value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder="Milestone" />
              <Input aria-label={`Milestone ${i + 1} percent`} type="number" min="0" max="100" step="0.01" value={r.pct} onChange={(e) => setRow(i, { pct: e.target.value })} placeholder="%" />
              <div className="col-span-2 col-start-1 row-start-2 sm:col-span-1 sm:col-start-auto sm:row-start-auto">
                <Select value={r.trigger} onValueChange={(v) => setRow(i, { trigger: v })}>
                  <SelectTrigger aria-label={`Milestone ${i + 1} trigger`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Remove milestone ${i + 1}`}
                disabled={rows.length <= 1}
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => setRows((rs) => [...rs, blank()])}>
            <Plus /> Add milestone
          </Button>
        </div>
        {formError ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
      </FormSheet>
    </Section>
  );
}
