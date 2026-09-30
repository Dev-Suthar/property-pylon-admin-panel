import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, Building2, CheckCircle2, ChevronRight, Circle, FileSpreadsheet, Shuffle, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Section } from '@/pages/workspace/shared';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { companyService } from '@/services/companyService';
import { settingsApi, type CompanySettings } from '@/services/companyApi';

const ROUTING: { value: NonNullable<CompanySettings['lead_routing']>; title: string; body: string; icon: typeof UserRound }[] = [
  { value: 'owner', title: 'Owner gets all new leads', body: 'New leads from forms, portals and imports land with the owner, who assigns them by hand.', icon: UserRound },
  {
    value: 'round_robin',
    title: 'Round robin across active agents & telecallers',
    body: 'Each new lead goes to the next active agent or telecaller in turn, so work is shared evenly.',
    icon: Shuffle,
  },
];

const Info = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="min-w-0">
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{value || '—'}</dd>
  </div>
);

/** Company switches (lead routing, builder module), lead capture link and profile. */
export default function SettingsModule({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const key = ['c-settings', companyId];
  const settings = useQuery({ queryKey: key, queryFn: () => settingsApi.get(companyId) });
  const company = useQuery({ queryKey: ['company', companyId], queryFn: () => companyService.getById(companyId) });

  const save = useMutation({
    mutationFn: (input: CompanySettings) => settingsApi.update(companyId, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<CompanySettings>(key);
      qc.setQueryData<CompanySettings>(key, { ...prev, ...input });
      return { prev };
    },
    onSuccess: (res, input) => {
      qc.setQueryData(key, res);
      toast({
        title: 'Settings saved',
        description:
          input.lead_routing !== undefined
            ? `New leads: ${ROUTING.find((r) => r.value === input.lead_routing)?.title}`
            : `Builder module ${input.builder_enabled ? 'turned on' : 'turned off'}`,
      });
    },
    onError: (e: Error, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast({ title: 'Could not save settings', description: e.message, variant: 'destructive' });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const s = settings.data;
  const routing = s?.lead_routing ?? 'owner';
  const c = company.data;

  return (
    <div className="space-y-6">
      {settings.error ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {(settings.error as Error).message}
          </span>
          <Button size="sm" variant="outline" onClick={() => settings.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      <Section title="Lead routing" description="Who gets new leads that arrive without an assignee.">
        <div role="radiogroup" aria-label="Lead routing" className="grid gap-3 p-2 md:grid-cols-2">
          {ROUTING.map((r) => {
            const selected = routing === r.value;
            const Icon = r.icon;
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!s || save.isPending}
                onClick={() => !selected && save.mutate({ lead_routing: r.value })}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-blue-100' : 'bg-slate-100')}>
                  <Icon className={cn('h-5 w-5', selected ? 'text-blue-700' : 'text-slate-600')} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{r.title}</span>
                    {selected ? <StatusBadge tone="accent">Selected</StatusBadge> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{r.body}</p>
                </div>
                {selected ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Builder module" description="For developers and builder-side sales teams.">
        <label className="flex flex-wrap items-center justify-between gap-4 p-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">Projects, units, bookings & collections</span>
              <StatusBadge tone={s?.builder_enabled ? 'success' : 'neutral'}>{s?.builder_enabled ? 'On' : 'Off'}</StatusBadge>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Adds project and tower inventory, unit holds, bookings with cost sheets and payment plans, and demand/collection tracking to the
              app for this company. Turning it off hides these screens; existing data is kept.
            </p>
          </div>
          <Switch
            aria-label="Builder module"
            checked={!!s?.builder_enabled}
            disabled={!s || save.isPending}
            onCheckedChange={(v) => save.mutate({ builder_enabled: v })}
          />
        </label>
      </Section>

      <Link
        to={`/c/${companyId}/import`}
        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <FileSpreadsheet className="h-5 w-5 text-slate-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-900">Lead capture & import</div>
          <p className="text-sm text-slate-600">Website/portal webhook, bulk CSV import and lead sources.</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
      </Link>

      <Section
        title="Company profile"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/companies">
              <Building2 /> Edit in Companies
            </Link>
          </Button>
        }
      >
        {company.error ? (
          <p className="p-2 text-sm text-red-700">{(company.error as Error).message}</p>
        ) : company.isLoading ? (
          <div className="grid gap-4 p-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : c ? (
          <dl className="grid gap-4 p-2 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Name" value={c.name} />
            <Info label="Email" value={c.email} />
            <Info label="Phone" value={c.phone} />
            <Info label="Address" value={c.address} />
            <Info
              label="Status"
              value={<StatusBadge tone={c.is_active ? 'success' : 'danger'}>{c.is_active ? 'Active' : 'Inactive'}</StatusBadge>}
            />
          </dl>
        ) : null}
      </Section>
    </div>
  );
}
