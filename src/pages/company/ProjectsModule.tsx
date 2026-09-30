import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarDays, Layers, MapPin, Pencil, Plus, Search, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormSheet } from '@/components/admin/FormSheet';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Empty, Field, Section } from '@/pages/workspace/shared';
import { bookingsApi, builderApi, dateIN, inr, PROJECT_STATUS, type Booking, type Project, type ProjectStatus } from '@/services/companyApi';
import { ErrorRow, InventoryBar, qk } from './builder/shared';
import { UnitGrid, UnitLegend } from './builder/UnitGrid';
import { UnitSheet } from './builder/UnitSheet';
import { PaymentPlans } from './builder/PaymentPlans';

const STATUS_TONE: Record<ProjectStatus, 'neutral' | 'accent' | 'warning' | 'success'> = {
  upcoming: 'neutral',
  launched: 'accent',
  under_construction: 'warning',
  ready: 'success',
};

// ─── Project create / edit ────────────────────────────────────────────────
const emptyProject = { name: '', builder_name: '', rera_number: '', location: '', city: '', possession_date: '', status: 'upcoming' as ProjectStatus, amenities: '', description: '' };

function ProjectForm({ companyId, open, onOpenChange, project }: { companyId: string; open: boolean; onOpenChange: (o: boolean) => void; project?: Project | null }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyProject);
  useEffect(() => {
    if (!open) return;
    setForm(
      project
        ? {
            name: project.name,
            builder_name: project.builder_name ?? '',
            rera_number: project.rera_number ?? '',
            location: project.location ?? '',
            city: project.city ?? '',
            possession_date: project.possession_date?.slice(0, 10) ?? '',
            status: project.status,
            amenities: (project.amenities ?? []).join(', '),
            description: project.description ?? '',
          }
        : emptyProject,
    );
  }, [open, project]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: () => {
      const input: Partial<Project> = {
        name: form.name.trim(),
        builder_name: form.builder_name.trim() || null,
        rera_number: form.rera_number.trim() || null,
        location: form.location.trim() || null,
        city: form.city.trim() || null,
        possession_date: form.possession_date || null,
        status: form.status,
        amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        description: form.description.trim() || null,
      };
      return project ? builderApi.updateProject(companyId, project.id, input) : builderApi.createProject(companyId, input);
    },
    onSuccess: (p) => {
      toast({ title: project ? 'Project updated' : 'Project created', description: p.name });
      qc.invalidateQueries({ queryKey: [companyId, 'projects'] });
      qc.invalidateQueries({ queryKey: qk.project(companyId, p.id) });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: 'Could not save project', description: e.message, variant: 'destructive' }),
  });

  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title={project ? 'Edit project' : 'New project'} onSubmit={() => save.mutate()} saving={save.isPending} submitText={project ? 'Save' : 'Create project'}>
      <Field label="Project name">
        <Input value={form.name} onChange={set('name')} required minLength={2} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Builder">
          <Input value={form.builder_name} onChange={set('builder_name')} />
        </Field>
        <Field label="RERA number">
          <Input value={form.rera_number} onChange={set('rera_number')} />
        </Field>
        <Field label="Location">
          <Input value={form.location} onChange={set('location')} placeholder="SG Highway" />
        </Field>
        <Field label="City">
          <Input value={form.city} onChange={set('city')} />
        </Field>
        <Field label="Possession date">
          <Input type="date" value={form.possession_date} onChange={set('possession_date')} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProjectStatus }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_STATUS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Amenities (comma-separated)">
        <Input value={form.amenities} onChange={set('amenities')} placeholder="Pool, Gym, Clubhouse" />
      </Field>
      <Field label="Description">
        <Textarea rows={4} value={form.description} onChange={set('description')} />
      </Field>
    </FormSheet>
  );
}

// ─── Towers ───────────────────────────────────────────────────────────────
function AddTowerSheet({ companyId, projectId, open, onOpenChange, onCreated }: { companyId: string; projectId: string; open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  useEffect(() => {
    if (open) setName('');
  }, [open]);
  const m = useMutation({
    mutationFn: () => builderApi.createTower(companyId, projectId, name.trim()),
    onSuccess: (t) => {
      toast({ title: 'Tower added', description: t.name });
      qc.invalidateQueries({ queryKey: qk.project(companyId, projectId) });
      qc.invalidateQueries({ queryKey: [companyId, 'projects'] });
      onCreated(t.id);
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: 'Could not add tower', description: e.message, variant: 'destructive' }),
  });
  return (
    <FormSheet open={open} onOpenChange={onOpenChange} title="Add tower" onSubmit={() => { if (name.trim()) m.mutate(); }} saving={m.isPending} submitText="Add tower">
      <Field label="Tower name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tower C" required />
      </Field>
    </FormSheet>
  );
}

const emptyGen = { floor_from: '1', floor_to: '10', units_per_floor: '4', prefix: '', configuration: '', super_area: '', carpet_area: '', base_rate: '' };

function GenerateUnitsSheet({ companyId, projectId, tower, open, onOpenChange }: { companyId: string; projectId: string; tower: { id: string; name: string } | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [f, setF] = useState(emptyGen);
  useEffect(() => {
    if (open && tower) setF({ ...emptyGen, prefix: tower.name.replace(/^tower\s*/i, '').slice(0, 3) });
  }, [open, tower]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const n = (v: string) => (v === '' ? undefined : Number(v));
  const from = Number(f.floor_from);
  const to = Number(f.floor_to);
  const per = Number(f.units_per_floor);
  const count = to >= from && per > 0 ? (to - from + 1) * per : 0;

  const m = useMutation({
    mutationFn: () =>
      builderApi.generateUnits(companyId, projectId, tower!.id, {
        floor_from: from,
        floor_to: to,
        units_per_floor: per,
        prefix: f.prefix,
        configuration: f.configuration.trim() || undefined,
        super_area: n(f.super_area),
        carpet_area: n(f.carpet_area),
        base_rate: n(f.base_rate),
      }),
    onSuccess: (r) => {
      toast({ title: `${r.created} units created`, description: r.skipped ? `${r.skipped} already existed and were skipped` : undefined });
      qc.invalidateQueries({ queryKey: [companyId, 'units', projectId] });
      qc.invalidateQueries({ queryKey: qk.project(companyId, projectId) });
      qc.invalidateQueries({ queryKey: [companyId, 'projects'] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: 'Could not generate units', description: e.message, variant: 'destructive' }),
  });
  const sample = `${f.prefix}${Number.isFinite(from) ? from : ''}01`;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Generate units · ${tower?.name ?? ''}`}
      description={`Units are numbered <prefix><floor><NN>, e.g. ${sample}. Existing numbers are skipped.`}
      onSubmit={() => m.mutate()}
      saving={m.isPending}
      submitText={count ? `Generate ${count} units` : 'Generate'}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="From floor">
          <Input type="number" min="0" max="200" value={f.floor_from} onChange={set('floor_from')} required />
        </Field>
        <Field label="To floor">
          <Input type="number" min="0" max="200" value={f.floor_to} onChange={set('floor_to')} required />
        </Field>
        <Field label="Units per floor">
          <Input type="number" min="1" max="50" value={f.units_per_floor} onChange={set('units_per_floor')} required />
        </Field>
        <Field label="Prefix">
          <Input value={f.prefix} maxLength={6} onChange={set('prefix')} placeholder="A" />
        </Field>
        <Field label="Configuration">
          <Input value={f.configuration} onChange={set('configuration')} placeholder="3 BHK" />
        </Field>
        <Field label="Base rate (₹/sq ft)">
          <Input type="number" min="0" value={f.base_rate} onChange={set('base_rate')} />
        </Field>
        <Field label="Super area (sq ft)">
          <Input type="number" min="0" value={f.super_area} onChange={set('super_area')} />
        </Field>
        <Field label="Carpet area (sq ft)">
          <Input type="number" min="0" value={f.carpet_area} onChange={set('carpet_area')} />
        </Field>
      </div>
      {count > 2000 ? <p className="text-sm text-red-700">At most 2000 units at a time.</p> : null}
    </FormSheet>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────
function ProjectDetailView({ companyId, projectId, onBack }: { companyId: string; projectId: string; onBack: () => void }) {
  const q = useQuery({ queryKey: qk.project(companyId, projectId), queryFn: () => builderApi.project(companyId, projectId) });
  const bookings = useQuery({ queryKey: qk.bookings(companyId, { project_id: projectId }), queryFn: () => bookingsApi.list(companyId, { project_id: projectId }) });
  const [towerId, setTowerId] = useState('');
  const [editing, setEditing] = useState(false);
  const [addTower, setAddTower] = useState(false);
  const [generate, setGenerate] = useState(false);
  const [unitId, setUnitId] = useState<string | null>(null);
  const p = q.data;

  useEffect(() => {
    if (p?.towers.length && !p.towers.some((t) => t.id === towerId)) setTowerId(p.towers[0].id);
  }, [p, towerId]);
  const tower = p?.towers.find((t) => t.id === towerId) ?? null;

  const bookingCols: Column<Booking>[] = [
    { key: 'no', header: 'Booking', cell: (b) => <Link className="font-medium text-blue-700 hover:underline" to={`/c/${companyId}/bookings?booking=${b.id}`}>{b.booking_number}</Link> },
    { key: 'unit', header: 'Unit', cell: (b) => `${b.Unit?.Tower?.name ? `${b.Unit.Tower.name} · ` : ''}${b.Unit?.unit_number ?? '—'}` },
    { key: 'cust', header: 'Customer', cell: (b) => b.Customer?.name ?? '—' },
    { key: 'val', header: 'Value', cell: (b) => inr(b.total_value), className: 'text-right' },
    { key: 'st', header: 'Status', cell: (b) => <StatusBadge tone={b.status === 'confirmed' ? 'success' : 'danger'}>{b.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}</StatusBadge> },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft /> All projects
      </Button>
      {q.error ? <ErrorRow error={q.error as Error} onRetry={() => q.refetch()} /> : null}
      {q.isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-slate-100" /> : null}
      {p ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-900">{p.name}</h2>
                  <StatusBadge tone={STATUS_TONE[p.status]}>{PROJECT_STATUS[p.status] ?? p.status}</StatusBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                  {p.builder_name ? <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{p.builder_name}</span> : null}
                  {p.location || p.city ? <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[p.location, p.city].filter(Boolean).join(', ')}</span> : null}
                  {p.possession_date ? <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />Possession {dateIN(p.possession_date)}</span> : null}
                </div>
                {p.rera_number ? <div className="text-xs text-slate-500">RERA {p.rera_number}</div> : null}
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil /> Edit project
              </Button>
            </div>
            {p.amenities?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.amenities.map((a) => <StatusBadge key={a}>{a}</StatusBadge>)}
              </div>
            ) : null}
            {p.description ? <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{p.description}</p> : null}
            <InventoryBar className="mt-4" inventory={p.inventory} />
            {p.configurations.length ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                {p.configurations.map((c) => (
                  <span key={c.configuration} className="rounded-md bg-slate-100 px-2 py-1">
                    {c.configuration} · {c.count} units{c.min_area ? ` · ${Number(c.min_area)}${c.max_area && c.max_area !== c.min_area ? `–${Number(c.max_area)}` : ''} sq ft` : ''}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <Section
            title="Inventory"
            description="Click a unit to hold, release, block or edit it"
            actions={
              <>
                <Button size="sm" variant="outline" onClick={() => setAddTower(true)}>
                  <Plus /> Add tower
                </Button>
                <Button size="sm" disabled={!tower} onClick={() => setGenerate(true)}>
                  <Wand2 /> Generate units
                </Button>
              </>
            }
          >
            {!p.towers.length ? (
              <Empty text="No towers yet. Add a tower, then generate its units." />
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Tabs value={towerId} onValueChange={setTowerId}>
                    <TabsList>
                      {p.towers.map((t) => (
                        <TabsTrigger key={t.id} value={t.id}>
                          {t.name} <span className="ml-1.5 text-xs text-slate-500">{t.inventory?.total ?? 0}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                {tower ? <InventoryBar inventory={tower.inventory} /> : null}
                <UnitLegend />
                {tower ? <UnitGrid companyId={companyId} projectId={projectId} towerId={tower.id} onPick={(u) => setUnitId(u.id)} /> : null}
              </div>
            )}
          </Section>

          <PaymentPlans companyId={companyId} projectId={projectId} />

          <Section title="Bookings" description="Bookings in this project">
            <DataTable
              columns={bookingCols}
              rows={bookings.data ?? []}
              rowKey={(b) => b.id}
              loading={bookings.isLoading}
              error={bookings.error as Error | null}
              onRetry={() => bookings.refetch()}
              empty="No bookings yet"
            />
          </Section>

          <ProjectForm companyId={companyId} open={editing} onOpenChange={setEditing} project={p} />
          <AddTowerSheet companyId={companyId} projectId={projectId} open={addTower} onOpenChange={setAddTower} onCreated={setTowerId} />
          <GenerateUnitsSheet companyId={companyId} projectId={projectId} tower={tower} open={generate} onOpenChange={setGenerate} />
          <UnitSheet companyId={companyId} projectId={projectId} unitId={unitId} onOpenChange={(o) => !o && setUnitId(null)} />
        </>
      ) : null}
    </div>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────
/** Builder projects: list → detail (towers, unit grid, plans, bookings). `?project=<id>` opens detail. */
export default function ProjectsModule({ companyId }: { companyId: string }) {
  const [params, setParams] = useSearchParams();
  const projectId = params.get('project');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const q = useQuery({ queryKey: qk.projects(companyId, debounced), queryFn: () => builderApi.projects(companyId, debounced || undefined), enabled: !projectId });

  const go = (id: string | null) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('project', id);
      else next.delete('project');
      return next;
    });

  if (projectId) return <ProjectDetailView companyId={companyId} projectId={projectId} onBack={() => go(null)} />;

  const projects = q.data ?? [];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input className="pl-9" placeholder="Search projects" aria-label="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus /> New project
        </Button>
      </div>

      {q.error ? <ErrorRow error={q.error as Error} onRetry={() => q.refetch()} /> : null}
      {q.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : null}
      {!q.isLoading && !q.error && !projects.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
          <Empty text={debounced ? 'No projects match your search' : 'No builder projects yet. Create one to start managing inventory.'} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <div key={p.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
            <div className="flex items-start justify-between gap-2">
              <button type="button" className="min-w-0 text-left" onClick={() => go(p.id)}>
                <div className="truncate text-lg font-semibold text-slate-900 hover:underline">{p.name}</div>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{[p.location, p.city].filter(Boolean).join(', ') || '—'}</span>
                </div>
              </button>
              <Button size="icon" variant="ghost" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                <Pencil />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <StatusBadge tone={STATUS_TONE[p.status]}>{PROJECT_STATUS[p.status] ?? p.status}</StatusBadge>
              <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{p.towers_count ?? 0} towers</span>
              {p.rera_number ? <span className="truncate">RERA {p.rera_number}</span> : null}
            </div>
            <InventoryBar className="mt-4" inventory={p.inventory} />
            <Button className="mt-4 self-start" size="sm" variant="outline" onClick={() => go(p.id)}>
              Open project
            </Button>
          </div>
        ))}
      </div>

      <ProjectForm companyId={companyId} open={creating || !!editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }} project={editing} />
    </div>
  );
}
