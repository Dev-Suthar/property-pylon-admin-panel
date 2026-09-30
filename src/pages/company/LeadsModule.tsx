import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft, CalendarClock, CheckCircle2, Flame, LucideIcon, Mail, MapPin, MessageCircle, Phone, Search,
  StickyNote, Thermometer, Snowflake, UserCheck, X, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Column, DataTable } from '@/components/admin/DataTable';
import { StatusBadge, Tone } from '@/components/admin/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Lead, LeadListParams, LeadStage, LeadTemperature, LOST_REASONS, STAGES, TeamMember, TimelineItem,
  dateIN, inr, leadsApi, roleLabel, stageLabel, teamApi,
} from '@/services/companyApi';
import { LEAD_SOURCES, sourceLabel, workspaceService } from '@/services/workspaceService';
import { Field, Section } from '../workspace/shared';

const PAGE_SIZE = 25;
const ALL = 'all';

const TEMP: Record<LeadTemperature, { label: string; Icon: LucideIcon; tone: Tone }> = {
  hot: { label: 'Hot', Icon: Flame, tone: 'danger' },
  warm: { label: 'Warm', Icon: Thermometer, tone: 'warning' },
  cold: { label: 'Cold', Icon: Snowflake, tone: 'accent' },
};
const TEMPS = Object.keys(TEMP) as LeadTemperature[];

const TempBadge = ({ t }: { t?: LeadTemperature | null }) => {
  const x = TEMP[t ?? 'cold'];
  return (
    <StatusBadge tone={x.tone}>
      <x.Icon className="h-3 w-3" aria-hidden /> {x.label}
    </StatusBadge>
  );
};

const stageTone = (s?: string | null): Tone => (s === 'booked' ? 'success' : s === 'lost' ? 'danger' : s === 'negotiation' || s === 'site_visit' ? 'accent' : 'neutral');
const typeLabel = (t?: string) => (t === 'owner' ? 'Seller' : t === 'both' ? 'Buyer & seller' : 'Buyer');

const requirement = (l: Lead) => {
  const bhk = l.preferred_bhk?.filter(Boolean).join('/');
  const hasBudget = l.budget_min != null || l.budget_max != null;
  const budget = hasBudget
    ? l.budget_min != null && l.budget_max != null
      ? `${inr(l.budget_min, true)}–${inr(l.budget_max, true)}`
      : inr(l.budget_max ?? l.budget_min, true)
    : '';
  const area = l.preferred_area || (l as Lead & { area?: string | null }).area || '';
  return [bhk, budget, area].filter(Boolean).join(' · ') || '—';
};

const isOverdue = (iso?: string | null) => !!iso && new Date(iso).getTime() < Date.now();

const FollowUp = ({ iso }: { iso?: string | null }) =>
  !iso ? (
    <span className="text-slate-500">None</span>
  ) : isOverdue(iso) ? (
    <span className="whitespace-nowrap font-medium text-red-600">Overdue · {dateIN(iso, true)}</span>
  ) : (
    <span className="whitespace-nowrap text-slate-700">{dateIN(iso, true)}</span>
  );

const ago = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const fut = diff < 0;
  const s = Math.abs(diff) / 1000;
  const [n, u] = s < 60 ? [0, 'now'] : s < 3600 ? [Math.round(s / 60), 'min'] : s < 86400 ? [Math.round(s / 3600), 'h'] : s < 2592000 ? [Math.round(s / 86400), 'd'] : [0, ''];
  if (u === 'now') return 'just now';
  if (!u) return dateIN(iso);
  return fut ? `in ${n} ${u}` : `${n} ${u} ago`;
};

const KIND_ICON: Record<string, LucideIcon> = {
  call: Phone,
  whatsapp: MessageCircle,
  note: StickyNote,
  visit: MapPin,
  stage: ArrowRightLeft,
  task: CalendarClock,
  suggested_customer: UserCheck,
  suggested_property: UserCheck,
};
const itemIcon = (it: TimelineItem): LucideIcon => {
  const k = (it.meta as { kind?: string } | null)?.kind;
  if (k === 'temperature') return Thermometer;
  if (k === 'assign') return UserCheck;
  return KIND_ICON[it.kind] ?? StickyNote;
};

const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

/** Run a per-lead mutation over many leads; returns ok/failed counts. */
const runBulk = async (ids: string[], fn: (id: string) => Promise<unknown>, onProgress: (done: number) => void) => {
  let ok = 0;
  const failed: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    try {
      await fn(ids[i]);
      ok++;
    } catch (e) {
      failed.push((e as Error).message);
    }
    onProgress(i + 1);
  }
  return { ok, failed };
};

type Filters = Required<Pick<LeadListParams, 'type' | 'temperature' | 'stage' | 'source' | 'assigned_to' | 'follow_up' | 'sort'>>;
const DEFAULT_FILTERS: Filters = { type: ALL, temperature: ALL, stage: ALL, source: ALL, assigned_to: ALL, follow_up: ALL as Filters['follow_up'], sort: ALL as Filters['sort'] };

const FilterSelect = ({ label, value, onChange, options, className }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; className?: string }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className={cn('h-9 w-full sm:w-40', className)} aria-label={label}>
      <SelectValue placeholder={label} />
    </SelectTrigger>
    <SelectContent>
      {options.map(([v, l]) => (
        <SelectItem key={v} value={v}>
          {l}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default function LeadsModule({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [search, filters]);

  const params: LeadListParams = useMemo(() => {
    const p: LeadListParams = { page, limit: PAGE_SIZE, search: search || undefined };
    (Object.keys(filters) as (keyof Filters)[]).forEach((k) => {
      if (filters[k] !== ALL) (p as Record<string, unknown>)[k] = filters[k];
    });
    return p;
  }, [page, search, filters]);

  const list = useQuery({ queryKey: ['leads', companyId, params], queryFn: () => leadsApi.list(companyId, params), placeholderData: (prev) => prev });
  const team = useQuery({ queryKey: ['team', companyId], queryFn: () => teamApi.list(companyId) });
  const members = team.data?.data ?? [];
  const activeMembers = members.filter((m) => m.is_active);
  const rows = list.data?.data ?? [];

  const setF = (k: keyof Filters) => (v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const filtersOn = search || (Object.keys(filters) as (keyof Filters)[]).some((k) => filters[k] !== ALL);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const bulk = async (label: string, fn: (id: string) => Promise<unknown>) => {
    const ids = [...selected];
    setBulkBusy(`${label} 0/${ids.length}`);
    const { ok, failed } = await runBulk(ids, fn, (d) => setBulkBusy(`${label} ${d}/${ids.length}`));
    setBulkBusy(null);
    qc.invalidateQueries({ queryKey: ['leads', companyId] });
    ids.forEach((id) => qc.invalidateQueries({ queryKey: ['lead', companyId, id] }));
    if (failed.length) {
      toast({ title: `${ok} updated, ${failed.length} failed`, description: failed[0], variant: 'destructive' });
    } else {
      toast({ title: `${ok} lead${ok === 1 ? '' : 's'} updated` });
      setSelected(new Set());
    }
  };

  const columns: Column<Lead>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          className="h-4 w-4 accent-blue-600"
          aria-label="Select all leads on this page"
          checked={allOnPage}
          onChange={() =>
            setSelected((s) => {
              const n = new Set(s);
              rows.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id)));
              return n;
            })
          }
        />
      ),
      cell: (l) => (
        <input
          type="checkbox"
          className="h-4 w-4 accent-blue-600"
          aria-label={`Select ${l.name}`}
          checked={selected.has(l.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggle(l.id)}
        />
      ),
      csv: () => '',
      className: 'w-10',
    },
    {
      key: 'name',
      header: 'Lead',
      cell: (l) => (
        <div className="min-w-[10rem]">
          <div className="font-medium text-slate-900">{l.name}</div>
          <div className="text-xs text-slate-500">{l.phone} · {typeLabel(l.type)}</div>
        </div>
      ),
      csv: (l) => `${l.name} (${l.phone})`,
    },
    { key: 'temperature', header: 'Temperature', cell: (l) => <TempBadge t={l.temperature} />, csv: (l) => l.temperature ?? '' },
    { key: 'score', header: 'Score', cell: (l) => <span className="font-semibold tabular-nums text-slate-900">{l.lead_score ?? 0}</span>, csv: (l) => l.lead_score ?? 0 },
    {
      key: 'stage',
      header: 'Stage',
      cell: (l) => <StatusBadge tone={stageTone(l.lead_stage)}>{stageLabel(l.lead_stage)}</StatusBadge>,
      csv: (l) => `${stageLabel(l.lead_stage)}${l.lost_reason ? ` (${l.lost_reason})` : ''}`,
    },
    { key: 'req', header: 'Requirement', cell: (l) => <span className="whitespace-nowrap text-slate-700">{requirement(l)}</span>, csv: requirement },
    { key: 'source', header: 'Source', cell: (l) => <span className="whitespace-nowrap text-slate-600">{sourceLabel(l.source)}</span>, csv: (l) => sourceLabel(l.source) },
    { key: 'assignee', header: 'Assignee', cell: (l) => <span className="whitespace-nowrap">{l.Assignee?.name ?? 'Unassigned'}</span>, csv: (l) => l.Assignee?.name ?? '' },
    { key: 'follow', header: 'Next follow-up', cell: (l) => <FollowUp iso={l.next_follow_up_at} />, csv: (l) => (l.next_follow_up_at ? `${isOverdue(l.next_follow_up_at) ? 'Overdue ' : ''}${dateIN(l.next_follow_up_at, true)}` : '') },
  ];

  const toolbar = (
    <>
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
        <Input className="h-9 pl-8" placeholder="Search name, phone, email" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search leads" />
      </div>
      <div className="inline-flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Lead type">
        {([[ALL, 'All'], ['buyer', 'Buyers'], ['owner', 'Sellers']] as const).map(([v, l]) => (
          <button
            key={v}
            type="button"
            aria-pressed={filters.type === v}
            onClick={() => setF('type')(v)}
            className={cn('rounded-md px-3 py-1 text-sm', filters.type === v ? 'bg-slate-900 font-semibold text-white' : 'text-slate-600 hover:bg-slate-100')}
          >
            {l}
          </button>
        ))}
      </div>
      <FilterSelect label="Temperature" value={filters.temperature} onChange={setF('temperature')} options={[[ALL, 'Any temperature'], ...TEMPS.map((t) => [t, TEMP[t].label] as [string, string])]} className="sm:w-36" />
      <FilterSelect label="Stage" value={filters.stage} onChange={setF('stage')} options={[[ALL, 'Any stage'], ...STAGES.map((s) => [s.value, s.label] as [string, string])]} className="sm:w-36" />
      <FilterSelect label="Source" value={filters.source} onChange={setF('source')} options={[[ALL, 'Any source'], ...LEAD_SOURCES.map(([v, l]) => [v, l] as [string, string]), ['unknown', 'Not recorded']]} />
      <FilterSelect label="Assignee" value={filters.assigned_to} onChange={setF('assigned_to')} options={[[ALL, 'Anyone'], ...members.map((m) => [m.id, `${m.name}${m.is_active ? '' : ' (inactive)'}`] as [string, string])]} />
      <FilterSelect label="Follow-up" value={filters.follow_up} onChange={setF('follow_up')} options={[[ALL, 'Any follow-up'], ['today', 'Due today'], ['overdue', 'Overdue'], ['upcoming', 'Upcoming'], ['none', 'No follow-up']]} />
      <FilterSelect label="Sort" value={filters.sort} onChange={setF('sort')} options={[[ALL, 'Hot first'], ['score', 'Score'], ['newest', 'Newest'], ['follow_up', 'Next follow-up'], ['last_activity', 'Last activity']]} />
      {filtersOn ? (
        <Button variant="ghost" size="sm" onClick={() => { setSearchInput(''); setFilters(DEFAULT_FILTERS); }}>
          <X className="h-4 w-4" /> Clear
        </Button>
      ) : null}
    </>
  );

  return (
    <Section title="Leads" description={list.data ? `${list.data.total} lead${list.data.total === 1 ? '' : 's'} match` : 'Buyers and sellers of this company'}>
      {selected.size ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <span className="font-semibold">{selected.size} selected</span>
          <Select value="" onValueChange={(v) => bulk('Assigning', (id) => leadsApi.assign(companyId, id, v))} disabled={!!bulkBusy}>
            <SelectTrigger className="h-8 w-44 bg-white" aria-label="Assign selected leads to">
              <SelectValue placeholder="Assign to…" />
            </SelectTrigger>
            <SelectContent>
              {activeMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} · {roleLabel(m.role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value="" onValueChange={(v) => bulk('Updating', (id) => leadsApi.setTemperature(companyId, id, v as LeadTemperature))} disabled={!!bulkBusy}>
            <SelectTrigger className="h-8 w-44 bg-white" aria-label="Set temperature of selected leads">
              <SelectValue placeholder="Set temperature…" />
            </SelectTrigger>
            <SelectContent>
              {TEMPS.map((t) => (
                <SelectItem key={t} value={t}>
                  {TEMP[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {bulkBusy ? <span role="status">{bulkBusy}…</span> : null}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected(new Set())} disabled={!!bulkBusy}>
            Clear selection
          </Button>
        </div>
      ) : null}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(l) => l.id}
        loading={list.isLoading}
        error={list.error as Error | null}
        onRetry={() => list.refetch()}
        empty={filtersOn ? 'No leads match these filters' : 'No leads yet'}
        onRowClick={(l) => setOpenId(l.id)}
        page={page}
        pageSize={PAGE_SIZE}
        total={list.data?.total}
        onPageChange={setPage}
        csvName="leads"
        toolbar={toolbar}
      />
      <LeadDetail
        companyId={companyId}
        leadId={openId}
        initial={rows.find((r) => r.id === openId)}
        members={activeMembers}
        onClose={() => setOpenId(null)}
      />
    </Section>
  );
}

function LeadDetail({
  companyId, leadId, initial, members, onClose,
}: {
  companyId: string;
  leadId: string | null;
  initial?: Lead;
  members: TeamMember[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const id = leadId ?? '';
  const lead = useQuery({ queryKey: ['lead', companyId, id], queryFn: () => leadsApi.get(companyId, id), enabled: !!leadId, placeholderData: initial });
  const timeline = useQuery({ queryKey: ['lead', companyId, id, 'timeline'], queryFn: () => leadsApi.timeline(companyId, id), enabled: !!leadId });
  const l = lead.data ?? initial;

  const [lostOpen, setLostOpen] = useState(false);
  const [lostPick, setLostPick] = useState('');
  const [lostText, setLostText] = useState('');
  const [note, setNote] = useState('');
  const [fuOpen, setFuOpen] = useState(false);
  const [fu, setFu] = useState({ title: '', due_at: '', assigned_to: '' });

  useEffect(() => {
    setLostOpen(false);
    setLostPick('');
    setLostText('');
    setNote('');
    setFuOpen(false);
  }, [leadId]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['leads', companyId] });
    qc.invalidateQueries({ queryKey: ['lead', companyId, id] });
  };
  const fail = (title: string) => (e: Error) => toast({ title, description: e.message, variant: 'destructive' });

  const temp = useMutation({
    mutationFn: (t: LeadTemperature) => leadsApi.setTemperature(companyId, id, t),
    onSuccess: (_, t) => { refresh(); toast({ title: `Marked ${TEMP[t].label.toLowerCase()}` }); },
    onError: fail('Could not change temperature'),
  });
  const stage = useMutation({
    mutationFn: ({ s, reason }: { s: LeadStage; reason?: string }) => leadsApi.setStage(companyId, id, s, reason),
    onSuccess: (_, v) => { refresh(); setLostOpen(false); toast({ title: `Stage: ${stageLabel(v.s)}` }); },
    onError: fail('Could not change stage'),
  });
  const assign = useMutation({
    mutationFn: (uid: string) => leadsApi.assign(companyId, id, uid),
    onSuccess: (r) => { refresh(); toast({ title: `Assigned to ${r.Assignee?.name ?? 'member'}` }); },
    onError: fail('Could not assign lead'),
  });
  const addNote = useMutation({
    mutationFn: () => leadsApi.addNote(companyId, id, note.trim()),
    onSuccess: () => { refresh(); setNote(''); toast({ title: 'Note added' }); },
    onError: fail('Could not add note'),
  });
  const addFollowUp = useMutation({
    mutationFn: () =>
      workspaceService.createTask(companyId, {
        title: fu.title.trim(),
        type: 'follow_up',
        due_at: new Date(fu.due_at).toISOString(),
        customer_id: id,
        assigned_to: fu.assigned_to || undefined,
      }),
    onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: ['ws-tasks'] }); setFuOpen(false); toast({ title: 'Follow-up scheduled' }); },
    onError: fail('Could not schedule follow-up'),
  });

  const openFollowUp = () => {
    const d = new Date(Date.now() + 86400e3);
    d.setMinutes(0, 0, 0);
    setFu({ title: `Call ${l?.name ?? ''}`.trim(), due_at: toLocalInput(d), assigned_to: l?.assigned_to ?? '' });
    setFuOpen(true);
  };

  const lostReason = lostPick === 'other' ? lostText.trim() : lostPick;
  const current = l?.lead_stage ?? 'new';
  const flow = STAGES.filter((s) => s.value !== 'lost');
  const currentIdx = flow.findIndex((s) => s.value === current);

  return (
    <Sheet open={!!leadId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {!l ? (
          <p className="py-10 text-center text-sm text-slate-500">{lead.error ? (lead.error as Error).message : 'Loading…'}</p>
        ) : (
          <div className="space-y-6">
            <SheetHeader className="pr-6">
              <SheetTitle className="flex flex-wrap items-center gap-2 text-slate-900">
                {l.name} <TempBadge t={l.temperature} />
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                  <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 hover:underline"><Phone className="h-3.5 w-3.5" aria-hidden />{l.phone}</a>
                  {l.email ? <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:underline"><Mail className="h-3.5 w-3.5" aria-hidden />{l.email}</a> : null}
                  <span>{typeLabel(l.type)}</span>
                  <span>Score {l.lead_score ?? 0}</span>
                  <span>{sourceLabel(l.source)}</span>
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
              <span className="text-slate-500">Requirement: </span>{requirement(l)}
              <div className="mt-1"><span className="text-slate-500">Next follow-up: </span><FollowUp iso={l.next_follow_up_at} /></div>
            </div>

            <Field label="Temperature">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Temperature">
                {TEMPS.map((t) => {
                  const x = TEMP[t];
                  const on = l.temperature === t;
                  return (
                    <Button
                      key={t}
                      type="button"
                      size="sm"
                      variant={on ? 'default' : 'outline'}
                      aria-pressed={on}
                      disabled={temp.isPending}
                      onClick={() => !on && temp.mutate(t)}
                    >
                      <x.Icon className={cn('h-4 w-4', !on && (t === 'hot' ? 'text-red-600' : t === 'warm' ? 'text-amber-600' : 'text-blue-600'))} aria-hidden /> {x.label}
                    </Button>
                  );
                })}
              </div>
            </Field>

            <Field label="Stage">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Stage">
                {flow.map((s, i) => {
                  const on = current === s.value;
                  const passed = current !== 'lost' && i < currentIdx;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={on}
                      disabled={stage.isPending}
                      onClick={() => !on && stage.mutate({ s: s.value })}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium',
                        on ? 'border-blue-600 bg-blue-600 text-white' : passed ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-100',
                      )}
                    >
                      {passed ? <CheckCircle2 className="h-3 w-3" aria-hidden /> : null}
                      {i + 1}. {s.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={current === 'lost'}
                  onClick={() => setLostOpen((o) => !o)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium',
                    current === 'lost' ? 'border-red-600 bg-red-600 text-white' : 'border-red-200 text-red-700 hover:bg-red-50',
                  )}
                >
                  <XCircle className="h-3 w-3" aria-hidden /> Lost
                </button>
              </div>
              {current === 'lost' && l.lost_reason ? <p className="text-xs text-red-700">Lost reason: {l.lost_reason}</p> : null}
              {lostOpen ? (
                <div className="mt-2 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-800">Why was this lead lost?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...LOST_REASONS, 'other'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        aria-pressed={lostPick === r}
                        onClick={() => setLostPick(r)}
                        className={cn('rounded-full border px-3 py-1 text-xs', lostPick === r ? 'border-red-600 bg-red-600 text-white' : 'border-red-200 bg-white text-red-700')}
                      >
                        {r === 'other' ? 'Other…' : r}
                      </button>
                    ))}
                  </div>
                  {lostPick === 'other' ? <Input value={lostText} onChange={(e) => setLostText(e.target.value)} placeholder="Reason" aria-label="Lost reason" /> : null}
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" disabled={lostReason.length < 2 || stage.isPending} onClick={() => stage.mutate({ s: 'lost', reason: lostReason })}>
                      Mark lost
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLostOpen(false)}>Cancel</Button>
                  </div>
                </div>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Assigned to">
                <Select value={l.assigned_to ?? ''} onValueChange={(v) => v !== l.assigned_to && assign.mutate(v)} disabled={assign.isPending}>
                  <SelectTrigger aria-label="Assign lead to"><SelectValue placeholder={l.Assignee?.name ?? 'Unassigned'} /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} · {roleLabel(m.role)}</SelectItem>
                    ))}
                    {l.assigned_to && !members.some((m) => m.id === l.assigned_to) ? (
                      <SelectItem value={l.assigned_to} disabled>{l.Assignee?.name ?? 'Current assignee'} (inactive)</SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-end">
                <Button type="button" variant="outline" className="w-full" onClick={openFollowUp}>
                  <CalendarClock className="h-4 w-4" /> Add follow-up
                </Button>
              </div>
            </div>

            {fuOpen ? (
              <form
                className="space-y-3 rounded-lg border border-slate-200 p-3"
                onSubmit={(e) => { e.preventDefault(); addFollowUp.mutate(); }}
              >
                <Field label="Follow-up title"><Input value={fu.title} onChange={(e) => setFu((f) => ({ ...f, title: e.target.value }))} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Due"><Input type="datetime-local" value={fu.due_at} onChange={(e) => setFu((f) => ({ ...f, due_at: e.target.value }))} /></Field>
                  <Field label="Assign to">
                    <Select value={fu.assigned_to} onValueChange={(v) => setFu((f) => ({ ...f, assigned_to: v }))}>
                      <SelectTrigger aria-label="Assign follow-up to"><SelectValue placeholder="Lead's assignee" /></SelectTrigger>
                      <SelectContent>
                        {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={fu.title.trim().length < 2 || !fu.due_at || addFollowUp.isPending}>
                    {addFollowUp.isPending ? 'Saving…' : 'Schedule'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setFuOpen(false)}>Cancel</Button>
                </div>
              </form>
            ) : null}

            <Field label="Add note">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened on the call?" rows={3} />
              <Button size="sm" className="mt-2" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()}>
                {addNote.isPending ? 'Saving…' : 'Add note'}
              </Button>
            </Field>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-900">Timeline</h4>
              {timeline.isLoading ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : timeline.error ? (
                <p className="text-sm text-red-600">{(timeline.error as Error).message}</p>
              ) : !timeline.data?.length ? (
                <p className="text-sm text-slate-500">No activity yet</p>
              ) : (
                <ol className="space-y-3">
                  {timeline.data.map((it) => {
                    const Icon = itemIcon(it);
                    return (
                      <li key={it.id} className="flex gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="whitespace-pre-wrap break-words text-sm text-slate-900">{it.title}</p>
                          <p className="text-xs text-slate-500">
                            <span className="capitalize">{it.kind.replace('_', ' ')}</span> ·{' '}
                            <time dateTime={it.at} title={dateIN(it.at, true)}>{ago(it.at)}</time>
                            {it.by ? ` · by ${it.by}` : ''}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
