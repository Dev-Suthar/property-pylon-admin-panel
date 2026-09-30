import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Info, Megaphone, Pencil, Plus, Power, Trash2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FormSheet } from '@/components/admin/FormSheet';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useCompanies } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Notice, NoticeInput, noticeService } from '@/services/noticeService';

const ROLES = [['owner', 'Owners'], ['manager', 'Managers'], ['agent', 'Agents'], ['telecaller', 'Telecallers']] as const;
const EMPTY: NoticeInput = {
  type: 'banner', title: '', message: '', tone: 'info', audience: {}, platforms: [],
  starts_at: null, ends_at: null, dismissible: true, is_active: true,
};
/** ISO ↔ <input type="datetime-local"> (local time). */
const toLocal = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null);

const state = (n: Notice): { label: string; tone: 'success' | 'accent' | 'neutral' | 'danger' } => {
  if (!n.is_active) return { label: 'Off', tone: 'neutral' };
  if (n.live) return { label: 'Live', tone: n.type === 'maintenance' ? 'danger' : 'success' };
  if (n.starts_at && new Date(n.starts_at).getTime() > Date.now()) return { label: 'Scheduled', tone: 'accent' };
  return { label: 'Ended', tone: 'neutral' };
};

/** What the app will show (approximation of the mobile banner / maintenance screen). */
function Preview({ n }: { n: NoticeInput }) {
  if (n.type === 'maintenance') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
        <Wrench className="mx-auto h-8 w-8 text-slate-500" />
        <div className="mt-2 font-semibold text-slate-900">{n.title || 'Title'}</div>
        <div className="mt-1 text-sm text-slate-600">{n.message || 'Message'}</div>
        {n.ends_at ? <div className="mt-2 text-xs text-slate-500">Back by {when(n.ends_at)}</div> : null}
      </div>
    );
  }
  const Icon = n.tone === 'warning' ? AlertTriangle : n.tone === 'success' ? Megaphone : Info;
  return (
    <div className={cn('flex gap-3 rounded-xl border p-3', n.tone === 'warning' ? 'border-amber-200 bg-amber-50' : n.tone === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-blue-50')}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
      <div className="min-w-0 text-sm">
        <div className="font-semibold text-slate-900">{n.title || 'Title'}</div>
        <div className="text-slate-600">{n.message || 'Message'}</div>
      </div>
      {n.dismissible ? <span className="ml-auto text-xs text-slate-500">✕</span> : null}
    </div>
  );
}

/** Maintenance windows and in-app announcements for the apps. */
export function Notices() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const { companies } = useCompanies();
  const q = useQuery({ queryKey: ['notices'], queryFn: noticeService.list, refetchInterval: 60_000 });
  const [editing, setEditing] = useState<Notice | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NoticeInput>(EMPTY);
  const set = (p: Partial<NoticeInput>) => setForm({ ...form, ...p });

  const refresh = () => qc.invalidateQueries({ queryKey: ['notices'] });
  const onError = (e: Error) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' });
  const save = useMutation({
    mutationFn: () => (editing ? noticeService.update(editing.id, form) : noticeService.create(form)),
    onSuccess: (n) => {
      setOpen(false);
      refresh();
      toast({ title: n.live ? (n.type === 'maintenance' ? 'Maintenance is live' : 'Announcement is live') : 'Saved', description: n.live ? 'Apps pick it up within a minute.' : undefined });
    },
    onError,
  });
  const toggle = useMutation({ mutationFn: (n: Notice) => noticeService.update(n.id, { is_active: !n.is_active }), onSuccess: refresh, onError });
  const remove = useMutation({ mutationFn: (n: Notice) => noticeService.remove(n.id), onSuccess: refresh, onError });

  const openNew = (type: NoticeInput['type']) => {
    setEditing(null);
    setForm({ ...EMPTY, type, tone: type === 'maintenance' ? 'warning' : 'info', dismissible: type === 'banner' });
    setOpen(true);
  };
  const openEdit = (n: Notice) => {
    setEditing(n);
    const { id: _id, live: _live, created_at: _c, ...rest } = n;
    setForm(rest);
    setOpen(true);
  };

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? 'Unknown company';
  const audienceText = (n: Notice) => {
    const parts = [];
    parts.push(n.audience.company_ids?.length ? n.audience.company_ids.map(companyName).join(', ') : 'All companies');
    if (n.audience.roles?.length) parts.push(n.audience.roles.join(', '));
    if (n.platforms.length) parts.push(n.platforms.join(' + '));
    return parts.join(' · ');
  };

  const columns: Column<Notice>[] = [
    {
      key: 'what',
      header: 'Notice',
      cell: (n) => (
        <div className="min-w-56">
          <div className="flex items-center gap-2 font-medium text-slate-900">
            {n.type === 'maintenance' ? <Wrench className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />} {n.title}
          </div>
          <div className="line-clamp-1 text-xs text-slate-500">{n.message}</div>
        </div>
      ),
      csv: (n) => `${n.type}: ${n.title}`,
    },
    { key: 'status', header: 'Status', cell: (n) => { const s = state(n); return <StatusBadge tone={s.tone}>{s.label}</StatusBadge>; }, csv: (n) => state(n).label },
    { key: 'who', header: 'Who sees it', cell: (n) => <span className="text-sm text-slate-600">{audienceText(n)}</span>, csv: audienceText },
    {
      key: 'window',
      header: 'Window',
      cell: (n) => <span className="whitespace-nowrap text-sm text-slate-600">{when(n.starts_at) ?? 'Now'} → {when(n.ends_at) ?? 'until turned off'}</span>,
      csv: (n) => `${n.starts_at ?? ''} - ${n.ends_at ?? ''}`,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      cell: (n) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" aria-label={`Edit ${n.title}`} onClick={() => openEdit(n)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" aria-label={n.is_active ? `Turn off ${n.title}` : `Turn on ${n.title}`} title={n.is_active ? 'Turn off' : 'Turn on'} onClick={() => toggle.mutate(n)}>
            <Power className={cn('h-4 w-4', n.is_active ? 'text-emerald-600' : 'text-slate-400')} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Delete ${n.title}`}
            onClick={async () => {
              if (await confirm({ title: 'Delete this notice?', confirmText: 'Delete', destructive: true })) remove.mutate(n);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const liveMaintenance = (q.data ?? []).filter((n) => n.type === 'maintenance' && n.live);
  const toggleIn = <T,>(list: T[] | undefined, v: T) => ((list ?? []).includes(v) ? (list ?? []).filter((x) => x !== v) : [...(list ?? []), v]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements & maintenance"
        description="Banners show on the app’s Home screen. Maintenance shows a full-screen notice and pauses the app for the chosen companies (platform admins are never blocked)."
        actions={
          <>
            <Button variant="outline" onClick={() => openNew('maintenance')}><Wrench /> Maintenance window</Button>
            <Button onClick={() => openNew('banner')}><Plus /> Announcement</Button>
          </>
        }
      />
      {liveMaintenance.length ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <Wrench className="h-4 w-4" /> Maintenance is live for {liveMaintenance.map(audienceText).join('; ')} — those users can’t use the app right now.
        </div>
      ) : null}
      <Card>
        <CardContent className="p-4">
          <DataTable
            columns={columns}
            rows={q.data ?? []}
            rowKey={(n) => n.id}
            loading={q.isLoading}
            error={q.error as Error | null}
            onRetry={() => q.refetch()}
            empty="No announcements or maintenance windows yet"
          />
        </CardContent>
      </Card>

      <FormSheet
        open={open}
        onOpenChange={setOpen}
        wide
        title={`${editing ? 'Edit' : 'New'} ${form.type === 'maintenance' ? 'maintenance window' : 'announcement'}`}
        description={form.type === 'maintenance' ? 'Users in the chosen companies see this screen instead of the app until it ends.' : 'Shown on the Home screen of the app.'}
        onSubmit={() => save.mutate()}
        saving={save.isPending}
        submitText={editing ? 'Save' : form.type === 'maintenance' ? 'Schedule maintenance' : 'Publish'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set({ type: v as NoticeInput['type'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="banner">Announcement banner</SelectItem>
                <SelectItem value="maintenance">Maintenance (pauses the app)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.type === 'banner' ? (
            <div className="space-y-1.5">
              <Label>Style</Label>
              <Select value={form.tone} onValueChange={(v) => set({ tone: v as NoticeInput['tone'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="success">Offer / good news</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="n-title">Title</Label>
          <Input id="n-title" value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={120} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="n-msg">Message</Label>
          <Textarea id="n-msg" value={form.message} onChange={(e) => set({ message: e.target.value })} maxLength={1000} rows={3} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="n-start">Starts</Label>
            <Input id="n-start" type="datetime-local" value={toLocal(form.starts_at)} onChange={(e) => set({ starts_at: fromLocal(e.target.value) })} />
            <p className="text-xs text-slate-500">Empty = right away</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="n-end">Ends</Label>
            <Input id="n-end" type="datetime-local" value={toLocal(form.ends_at)} onChange={(e) => set({ ends_at: fromLocal(e.target.value) })} />
            <p className="text-xs text-slate-500">Empty = until turned off</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Companies</Label>
          <p className="text-xs text-slate-500">None selected = every company.</p>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {companies.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={(form.audience.company_ids ?? []).includes(c.id)} onChange={() => set({ audience: { ...form.audience, company_ids: toggleIn(form.audience.company_ids, c.id) } })} />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-3">
              {ROLES.map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={(form.audience.roles ?? []).includes(v)} onChange={() => set({ audience: { ...form.audience, roles: toggleIn(form.audience.roles, v) } })} /> {l}
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">None = everyone</p>
          </div>
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex gap-3">
              {(['android', 'ios'] as const).map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={form.platforms.includes(p)} onChange={() => set({ platforms: toggleIn(form.platforms, p) })} /> {p === 'ios' ? 'iOS' : 'Android'}
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">None = both</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          {form.type === 'banner' ? (
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.dismissible} onCheckedChange={(v) => set({ dismissible: v })} /> Users can dismiss it</label>
          ) : null}
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => set({ is_active: v })} /> On</label>
        </div>
        <div className="space-y-1.5">
          <Label>Preview</Label>
          <Preview n={form} />
        </div>
      </FormSheet>
    </div>
  );
}
