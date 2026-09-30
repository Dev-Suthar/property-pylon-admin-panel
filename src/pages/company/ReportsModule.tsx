import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ChevronLeft, ChevronRight, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Empty, Section } from '@/pages/workspace/shared';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { sourceLabel } from '@/services/workspaceService';
import {
  METRIC_LABEL, inr, monthLabel, reportsApi, roleLabel, shiftMonth, stageLabel, thisMonth,
  type AgentRow, type TargetMetric,
} from '@/services/companyApi';

const METRICS: TargetMetric[] = ['leads_contacted', 'site_visits', 'bookings', 'revenue'];
const fmtMetric = (m: TargetMetric, v: number) => (m === 'revenue' ? inr(v, true) : String(v));

const Bar = ({ pct, tone = 'bg-blue-600' }: { pct: number; tone?: string }) => (
  <div className="h-2 rounded-full bg-slate-100">
    <div className={cn('h-2 rounded-full', tone)} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
  </div>
);

const ErrorLine = ({ error, onRetry }: { error: unknown; onRetry: () => void }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    <span className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4" /> {(error as Error)?.message ?? 'Could not load'}
    </span>
    <Button size="sm" variant="outline" onClick={onRetry}>
      Retry
    </Button>
  </div>
);
const Loading = () => (
  <div className="space-y-3 p-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-4 animate-pulse rounded bg-slate-100" />
    ))}
  </div>
);

/** Monthly reports (funnel, agents, lost reasons, sources, collections) and team targets. */
export default function ReportsModule({ companyId }: { companyId: string }) {
  const [month, setMonth] = useState(thisMonth());
  const current = thisMonth();

  const funnel = useQuery({ queryKey: ['c-funnel', companyId, month], queryFn: () => reportsApi.funnel(companyId, month) });
  const agents = useQuery({ queryKey: ['c-agents', companyId, month], queryFn: () => reportsApi.agents(companyId, month) });
  const lost = useQuery({ queryKey: ['c-lost', companyId, month], queryFn: () => reportsApi.lostReasons(companyId, month) });
  const sources = useQuery({ queryKey: ['c-sources', companyId, month], queryFn: () => reportsApi.sources(companyId, month) });
  const forecast = useQuery({ queryKey: ['c-forecast', companyId], queryFn: () => reportsApi.forecast(companyId) });

  const agentCols: Column<AgentRow>[] = [
    {
      key: 'name',
      header: 'Member',
      cell: (r) => (
        <div className="min-w-[140px]">
          <div className="font-medium text-slate-900">{r.name}</div>
          <div className="text-xs text-slate-500">{roleLabel(r.role)}</div>
        </div>
      ),
      csv: (r) => r.name,
    },
    { key: 'role', header: 'Role', cell: (r) => roleLabel(r.role), className: 'hidden', csv: (r) => roleLabel(r.role) },
    { key: 'leads_contacted', header: 'Contacted', cell: (r) => r.leads_contacted },
    { key: 'site_visits', header: 'Site visits', cell: (r) => r.site_visits },
    { key: 'bookings', header: 'Bookings', cell: (r) => r.bookings },
    { key: 'revenue', header: 'Revenue', cell: (r) => <span className="whitespace-nowrap">{inr(r.revenue, true)}</span>, csv: (r) => r.revenue },
    { key: 'commission', header: 'Commission', cell: (r) => <span className="whitespace-nowrap">{inr(r.commission, true)}</span>, csv: (r) => r.commission },
    { key: 'open_leads', header: 'Open leads', cell: (r) => r.open_leads },
    { key: 'hot_leads', header: 'Hot', cell: (r) => r.hot_leads },
  ];

  const maxLost = Math.max(1, ...(lost.data?.data ?? []).map((r) => r.count));
  const fc = forecast.data;
  const maxForecast = Math.max(1, ...(fc?.months ?? []).map((m) => m.amount), fc?.overdue ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">Monthly numbers for the whole company.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
            <ChevronLeft />
          </Button>
          <div className="min-w-[140px] text-center font-medium text-slate-900" aria-live="polite">
            {monthLabel(month)}
          </div>
          <Button size="icon" variant="outline" aria-label="Next month" disabled={month >= current} onClick={() => setMonth((m) => shiftMonth(m, 1))}>
            <ChevronRight />
          </Button>
          {month !== current ? (
            <Button size="sm" variant="ghost" onClick={() => setMonth(current)}>
              This month
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Lead funnel"
          description={funnel.data ? `${funnel.data.total} leads created · ${funnel.data.lost} lost` : 'Leads created this month and how far they got'}
        >
          {funnel.error ? (
            <ErrorLine error={funnel.error} onRetry={() => funnel.refetch()} />
          ) : funnel.isLoading ? (
            <Loading />
          ) : !funnel.data?.total ? (
            <Empty text="No leads created this month" />
          ) : (
            <div className="space-y-3 p-2">
              {funnel.data.steps.map((s) => (
                <div key={s.stage} className="space-y-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="text-slate-600">{stageLabel(s.stage)}</span>
                    <span className="font-semibold text-slate-900">
                      {s.reached} · {s.pct}%
                    </span>
                  </div>
                  <Bar pct={s.pct} tone={s.stage === 'booked' ? 'bg-emerald-600' : 'bg-blue-600'} />
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-600">Lost</span>
                <StatusBadge tone="danger">{funnel.data.lost} lost</StatusBadge>
              </div>
            </div>
          )}
        </Section>

        <Section title="Lost reasons" description={lost.data ? `${lost.data.total} leads lost` : undefined}>
          {lost.error ? (
            <ErrorLine error={lost.error} onRetry={() => lost.refetch()} />
          ) : lost.isLoading ? (
            <Loading />
          ) : !lost.data?.data.length ? (
            <Empty text="No lost leads this month" />
          ) : (
            <div className="space-y-3 p-2">
              {lost.data.data.map((r) => (
                <div key={r.reason} className="space-y-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="text-slate-600">{r.reason || 'No reason given'}</span>
                    <span className="font-semibold text-slate-900">{r.count}</span>
                  </div>
                  <Bar pct={(r.count / maxLost) * 100} tone="bg-red-500" />
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Agent performance" description={`Activity in ${monthLabel(month)}. Open and hot leads are current.`}>
        <DataTable
          columns={agentCols}
          rows={agents.data ?? []}
          rowKey={(r) => r.user_id}
          loading={agents.isLoading}
          error={agents.error as Error | null}
          onRetry={() => agents.refetch()}
          empty="No team activity"
          csvName={`agent-performance-${month}`}
        />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Lead sources" description="Leads created this month by source">
          <DataTable
            columns={[
              { key: 'source', header: 'Source', cell: (r) => <span className="font-medium text-slate-900">{sourceLabel(r.source)}</span>, csv: (r) => sourceLabel(r.source) },
              { key: 'leads', header: 'Leads', cell: (r) => r.leads },
              { key: 'hot', header: 'Hot', cell: (r) => r.hot },
              { key: 'converted', header: 'Converted', cell: (r) => r.converted },
              {
                key: 'rate',
                header: 'Conversion',
                cell: (r) => <span className={r.conversion_rate ? 'font-semibold text-emerald-700' : 'text-slate-500'}>{r.conversion_rate}%</span>,
                csv: (r) => r.conversion_rate,
              },
            ]}
            rows={sources.data ?? []}
            rowKey={(r) => r.source}
            loading={sources.isLoading}
            error={sources.error as Error | null}
            onRetry={() => sources.refetch()}
            empty="No leads this month"
          />
        </Section>

        <Section title="Collections forecast" description="Demands due, from today (not tied to the month above)">
          {forecast.error ? (
            <ErrorLine error={forecast.error} onRetry={() => forecast.refetch()} />
          ) : forecast.isLoading || !fc ? (
            <Loading />
          ) : (
            <div className="space-y-3 p-2">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
                <span className="font-medium text-red-700">Overdue</span>
                <span className="font-semibold text-red-700">{inr(fc.overdue)}</span>
              </div>
              {fc.months.map((m) => (
                <div key={m.month} className="space-y-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="text-slate-600">{monthLabel(m.month)}</span>
                    <span className="font-semibold text-slate-900">{inr(m.amount)}</span>
                  </div>
                  <Bar pct={(m.amount / maxForecast) * 100} tone="bg-emerald-600" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
                <div>
                  <div className="text-slate-500">Later</div>
                  <div className="font-semibold text-slate-900">{inr(fc.later)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Not raised yet</div>
                  <div className="font-semibold text-slate-900">{inr(fc.not_raised)}</div>
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>

      <TargetsSection companyId={companyId} month={month} />
    </div>
  );
}

function TargetsSection({ companyId, month }: { companyId: string; month: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const key = ['c-targets', companyId, month];
  const targets = useQuery({ queryKey: key, queryFn: () => reportsApi.targets(companyId, month) });
  const rows = useMemo(() => targets.data?.data ?? [], [targets.data]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const cellKey = (u: string, m: TargetMetric) => `${u}:${m}`;

  const original = useMemo(() => {
    const o: Record<string, string> = {};
    rows.forEach((r) => r.metrics.forEach((m) => (o[cellKey(r.user_id, m.metric)] = m.target ? String(m.target) : '')));
    return o;
  }, [rows]);

  useEffect(() => {
    setEditing(false);
  }, [month]);
  const startEdit = () => {
    setDraft(original);
    setEditing(true);
  };

  const changes = useMemo(
    () =>
      Object.entries(draft)
        .filter(([k, v]) => v.trim() !== '' && v !== original[k])
        .map(([k, v]) => {
          const [user_id, metric] = k.split(':');
          return { user_id, metric: metric as TargetMetric, target_value: Number(v) };
        }),
    [draft, original],
  );
  const invalid = changes.some((c) => !Number.isFinite(c.target_value) || c.target_value < 0);

  const save = useMutation({
    mutationFn: () => reportsApi.setTargets(companyId, month, changes),
    onSuccess: (res) => {
      qc.setQueryData(key, res);
      setEditing(false);
      toast({ title: 'Targets saved', description: `${changes.length} target${changes.length === 1 ? '' : 's'} updated for ${monthLabel(month)}` });
    },
    onError: (e: Error) => toast({ title: 'Could not save targets', description: e.message, variant: 'destructive' }),
  });

  return (
    <Section
      title="Targets"
      description={`Monthly targets for ${monthLabel(month)}. Set a target to 0 to remove it.`}
      actions={
        editing ? (
          <>
            <Button variant="outline" onClick={() => setEditing(false)} disabled={save.isPending}>
              <X /> Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={!changes.length || invalid || save.isPending}>
              <Save /> {save.isPending ? 'Saving…' : `Save${changes.length ? ` (${changes.length})` : ''}`}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={startEdit} disabled={!rows.length}>
            <Pencil /> Edit targets
          </Button>
        )
      }
    >
      {targets.error ? (
        <ErrorLine error={targets.error} onRetry={() => targets.refetch()} />
      ) : targets.isLoading ? (
        <Loading />
      ) : !rows.length ? (
        <Empty text="No team members" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-2 font-medium">Member</th>
                {METRICS.map((m) => (
                  <th key={m} className="px-3 py-2 font-medium">
                    {METRIC_LABEL[m]}
                    {m === 'revenue' ? ' (₹)' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">{roleLabel(r.role)}</div>
                  </td>
                  {METRICS.map((metric) => {
                    const cell = r.metrics.find((x) => x.metric === metric) ?? { target: 0, achieved: 0, pct: null };
                    const k = cellKey(r.user_id, metric);
                    const pct = cell.pct ?? 0;
                    return (
                      <td key={metric} className="px-3 py-3">
                        {editing ? (
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              aria-label={`${METRIC_LABEL[metric]} target for ${r.name}`}
                              className={cn('h-9 w-28', draft[k] !== original[k] && 'border-blue-500')}
                              placeholder="No target"
                              value={draft[k] ?? ''}
                              onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                            />
                            <div className="text-xs text-slate-500">Achieved {fmtMetric(metric, cell.achieved)}</div>
                          </div>
                        ) : (
                          <div className="min-w-[120px] space-y-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-semibold text-slate-900">{fmtMetric(metric, cell.achieved)}</span>
                              <span className="text-xs text-slate-500">{cell.target ? `of ${fmtMetric(metric, cell.target)}` : 'No target'}</span>
                            </div>
                            {cell.target ? (
                              <>
                                <Bar pct={pct} tone={pct >= 100 ? 'bg-emerald-600' : 'bg-blue-600'} />
                                <div className={cn('text-xs', pct >= 100 ? 'font-semibold text-emerald-700' : 'text-slate-500')}>
                                  {pct}%{pct >= 100 ? ' · achieved' : ''}
                                </div>
                              </>
                            ) : null}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
