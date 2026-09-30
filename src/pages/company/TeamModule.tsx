import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Copy, Eye, KeyRound, Pencil, Power, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient, handleApiError } from '@/lib/api';
import { startViewAs, ViewAs } from '@/lib/viewAs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { FormSheet } from '@/components/admin/FormSheet';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { StatusBadge, type Tone } from '@/components/admin/StatusBadge';
import { Field, Section, copy } from '@/pages/workspace/shared';
import { useToast } from '@/hooks/use-toast';
import { ROLES, dateIN, roleLabel, teamApi, type CompanyRole, type TeamMember } from '@/services/companyApi';

const ROLE_TONE: Record<string, Tone> = { owner: 'accent', admin: 'accent', manager: 'warning', agent: 'neutral', telecaller: 'neutral' };
const REASSIGN_ENTITIES = [
  { key: 'leads', label: 'Leads', hint: 'All leads assigned to them' },
  { key: 'properties', label: 'Listings', hint: 'Properties they handle' },
  { key: 'visits', label: 'Site visits', hint: 'Scheduled visits only' },
  { key: 'tasks', label: 'Follow-ups', hint: 'Open tasks only' },
];
const needsManager = (role: string) => role === 'agent' || role === 'telecaller';

interface MemberForm {
  name: string;
  email: string;
  phone: string;
  role: CompanyRole;
  manager_id: string;
}
const EMPTY: MemberForm = { name: '', email: '', phone: '', role: 'agent', manager_id: '' };

const Stat = ({ label, value }: { label: string; value?: number }) => (
  <Card>
    <CardContent className="flex items-center justify-between gap-3 p-5">
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-bold text-slate-900">{value ?? '—'}</div>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
        <Users className="h-5 w-5 text-slate-600" />
      </div>
    </CardContent>
  </Card>
);

/** Company team: members, roles, activation, passwords and work reassignment. */
export default function TeamModule({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const key = ['c-team', companyId];
  const team = useQuery({ queryKey: key, queryFn: () => teamApi.list(companyId) });
  const members = useMemo(() => team.data?.data ?? [], [team.data]);
  const managers = members.filter((m) => m.is_active && ['owner', 'manager', 'admin'].includes(m.role));
  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ['company', companyId] });
  };
  const onError = (title: string) => (e: Error) => toast({ title, description: e.message, variant: 'destructive' });

  // ── Add / edit ──
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<MemberForm>(EMPTY);
  const set = <K extends keyof MemberForm>(k: K, v: MemberForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const [secret, setSecret] = useState<{ name: string; email: string; password: string; created: boolean } | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setSheetOpen(true);
  };
  const openEdit = (m: TeamMember) => {
    setEditing(m);
    setForm({
      name: m.name,
      email: m.email,
      phone: m.phone ?? '',
      role: (m.role === 'admin' ? 'owner' : m.role) as CompanyRole,
      manager_id: m.manager_id ?? '',
    });
    setSheetOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const manager_id = needsManager(form.role) ? form.manager_id || null : null;
      if (editing) {
        const input: Parameters<typeof teamApi.update>[2] = { name: form.name.trim(), phone: form.phone.trim() || null, manager_id };
        if (form.role !== editing.role) input.role = form.role;
        await teamApi.update(companyId, editing.id, input);
        return null;
      }
      return teamApi.create(companyId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        manager_id,
      });
    },
    onSuccess: (res) => {
      refresh();
      setSheetOpen(false);
      if (res) {
        setSecret({ name: res.member.name, email: res.member.email, password: res.temp_password, created: true });
        toast({ title: 'Member added', description: res.member.name });
      } else toast({ title: 'Member updated', description: form.name });
    },
    onError: onError(editing ? 'Could not update member' : 'Could not add member'),
  });

  const toggleActive = useMutation({
    mutationFn: (m: TeamMember) => teamApi.setActive(companyId, m.id, !m.is_active),
    onSuccess: (r, m) => {
      refresh();
      toast({ title: r.is_active ? 'Member activated' : 'Member deactivated', description: m.name });
    },
    onError: onError('Could not change status'),
  });
  const navigate = useNavigate();
  // Read-only "view as": see the app's data exactly as this member does.
  const viewAs = useMutation({
    mutationFn: async (m: TeamMember) => {
      try {
        return (await apiClient.post(`/admin/users/${m.id}/impersonate`)).data as ViewAs;
      } catch (e) {
        throw new Error(handleApiError(e));
      }
    },
    onSuccess: (v) => {
      startViewAs(v);
      toast({ title: `Viewing as ${v.user.name}`, description: 'Read-only for 30 minutes. Exit from the yellow bar.' });
      navigate(`/c/${companyId}/leads`);
    },
    onError: (e: Error) => toast({ title: 'Could not start view-as', description: e.message, variant: 'destructive' }),
  });
  const resetPw = useMutation({
    mutationFn: (m: TeamMember) => teamApi.resetPassword(companyId, m.id),
    onSuccess: (r, m) => setSecret({ name: m.name, email: m.email, password: r.temp_password, created: false }),
    onError: onError('Could not reset password'),
  });

  const askToggle = async (m: TeamMember) => {
    const ok = await confirm(
      m.is_active
        ? {
            title: `Deactivate ${m.name}?`,
            description: 'They will be signed out of the app and cannot log in. Their leads stay assigned to them until you reassign the work.',
            confirmText: 'Deactivate',
            destructive: true,
          }
        : { title: `Activate ${m.name}?`, description: 'They will be able to log in again.', confirmText: 'Activate' },
    );
    if (ok) toggleActive.mutate(m);
  };
  const askReset = async (m: TeamMember) => {
    const ok = await confirm({
      title: `Reset password for ${m.name}?`,
      description: 'Their current password stops working immediately. A new temporary password will be shown once.',
      confirmText: 'Reset password',
      destructive: true,
    });
    if (ok) resetPw.mutate(m);
  };

  // ── Reassign ──
  const [reOpen, setReOpen] = useState(false);
  const [re, setRe] = useState<{ from: string; to: string; entities: string[] }>({ from: '', to: '', entities: REASSIGN_ENTITIES.map((e) => e.key) });
  const [moved, setMoved] = useState<Record<string, number> | null>(null);
  const openReassign = (from?: TeamMember) => {
    setRe({ from: from?.id ?? '', to: '', entities: REASSIGN_ENTITIES.map((e) => e.key) });
    setMoved(null);
    setReOpen(true);
  };
  const reassign = useMutation({
    mutationFn: () => teamApi.reassign(companyId, re.from, re.to, re.entities),
    onSuccess: (r) => {
      setMoved(r.moved);
      refresh();
      toast({ title: 'Work reassigned' });
    },
    onError: onError('Could not reassign work'),
  });
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? '';
  const submitReassign = async () => {
    const ok = await confirm({
      title: 'Reassign work?',
      description: `Move ${re.entities.join(', ')} from ${nameOf(re.from)} to ${nameOf(re.to)}. This cannot be undone automatically.`,
      confirmText: 'Reassign',
    });
    if (ok) reassign.mutate();
  };

  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: 'Member',
      cell: (m) => (
        <div className="min-w-[180px]">
          <div className="font-medium text-slate-900">{m.name}</div>
          <div className="text-xs text-slate-500">{m.email}</div>
          {m.phone ? <div className="text-xs text-slate-500">{m.phone}</div> : null}
        </div>
      ),
      csv: (m) => `${m.name} <${m.email}>${m.phone ? ` ${m.phone}` : ''}`,
    },
    { key: 'role', header: 'Role', cell: (m) => <StatusBadge tone={ROLE_TONE[m.role] ?? 'neutral'}>{roleLabel(m.role)}</StatusBadge>, csv: (m) => roleLabel(m.role) },
    { key: 'manager', header: 'Manager', cell: (m) => <span className="text-slate-600">{m.Manager?.name ?? '—'}</span>, csv: (m) => m.Manager?.name ?? '' },
    {
      key: 'status',
      header: 'Status',
      cell: (m) => <StatusBadge tone={m.is_active ? 'success' : 'danger'}>{m.is_active ? 'Active' : 'Inactive'}</StatusBadge>,
      csv: (m) => (m.is_active ? 'Active' : 'Inactive'),
    },
    {
      key: 'login',
      header: 'Last login',
      cell: (m) => <span className="whitespace-nowrap text-slate-600">{m.last_login ? dateIN(m.last_login, true) : 'Never'}</span>,
      csv: (m) => m.last_login ?? '',
    },
    {
      key: 'stats',
      header: 'Activity',
      cell: (m) =>
        m.stats ? (
          <div className="grid min-w-[220px] grid-cols-5 gap-2 text-center text-xs">
            {[
              ['Leads', m.stats.leads],
              ['Hot', m.stats.hot_leads],
              ['Visits/wk', m.stats.visits_this_week],
              ['Calls today', m.stats.calls_today],
              ['Deals', m.stats.deals],
            ].map(([l, v]) => (
              <div key={l as string}>
                <div className="font-semibold text-slate-900">{v}</div>
                <div className="text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        ) : (
          '—'
        ),
      csv: (m) =>
        m.stats ? `leads ${m.stats.leads}; hot ${m.stats.hot_leads}; visits/wk ${m.stats.visits_this_week}; calls today ${m.stats.calls_today}; deals ${m.stats.deals}` : '',
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      cell: (m) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label={`View the app as ${m.name} (read-only)`}
            title="View as (read-only)"
            disabled={viewAs.isPending || !m.is_active}
            onClick={() => viewAs.mutate(m)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label={`Edit ${m.name}`} title="Edit" onClick={() => openEdit(m)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Reset password for ${m.name}`}
            title="Reset password"
            disabled={resetPw.isPending}
            onClick={() => askReset(m)}
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label={`Reassign work from ${m.name}`} title="Reassign work" onClick={() => openReassign(m)}>
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={m.is_active ? `Deactivate ${m.name}` : `Activate ${m.name}`}
            title={m.is_active ? 'Deactivate' : 'Activate'}
            disabled={toggleActive.isPending}
            onClick={() => askToggle(m)}
            className={m.is_active ? 'text-red-600' : 'text-emerald-600'}
          >
            <Power className="h-4 w-4" />
          </Button>
        </div>
      ),
      csv: () => '',
    },
  ];

  const roleHint = ROLES.find((r) => r.value === form.role)?.hint;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Team members" value={team.data?.total} />
        <Stat label="Active" value={team.data?.active} />
      </div>

      <Section
        title="Team"
        description="Everyone who uses the app for this company. Managers see their own team; agents and telecallers see their own leads."
        actions={
          <>
            <Button variant="outline" onClick={() => openReassign()}>
              <ArrowRightLeft /> Reassign work
            </Button>
            <Button onClick={openAdd}>
              <UserPlus /> Add member
            </Button>
          </>
        }
      >
        <DataTable
          columns={columns}
          rows={members}
          rowKey={(m) => m.id}
          loading={team.isLoading}
          error={team.error as Error | null}
          onRetry={() => team.refetch()}
          empty="No team members yet"
          csvName="team"
        />
      </Section>

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? `Edit ${editing.name}` : 'Add team member'}
        description={editing ? 'Email cannot be changed.' : 'A temporary password is generated and shown once after saving.'}
        onSubmit={() => {
          if (form.name.trim().length < 2) {
            toast({ title: 'Name is required', variant: 'destructive' });
            return;
          }
          if (!editing && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            toast({ title: 'A valid email is required', variant: 'destructive' });
            return;
          }
          save.mutate();
        }}
        saving={save.isPending}
        submitText={editing ? 'Save changes' : 'Add member'}
      >
        <Field label="Name">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} disabled={!!editing} required={!editing} />
        </Field>
        <Field label="Phone">
          <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Role">
          <Select value={form.role} onValueChange={(v) => set('role', v as CompanyRole)}>
            <SelectTrigger aria-label="Role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label} — <span className="text-slate-500">{r.hint}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {roleHint ? <p className="text-xs text-slate-500">{roleHint}</p> : null}
        </Field>
        {needsManager(form.role) ? (
          <Field label="Reports to">
            <Select value={form.manager_id || 'none'} onValueChange={(v) => set('manager_id', v === 'none' ? '' : v)}>
              <SelectTrigger aria-label="Manager">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No manager</SelectItem>
                {managers
                  .filter((m) => m.id !== editing?.id)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} · {roleLabel(m.role)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </FormSheet>

      {/* Temporary password — shown once */}
      <Dialog open={!!secret} onOpenChange={(o) => !o && setSecret(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{secret?.created ? 'Member added' : 'Password reset'}</DialogTitle>
            <DialogDescription>
              Share these sign-in details with {secret?.name}. They should change the password after logging in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="text-slate-500">Email</div>
              <div className="font-medium text-slate-900 break-all">{secret?.email}</div>
            </div>
            <div className="text-sm">
              <div className="text-slate-500">Temporary password</div>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 break-all rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900">{secret?.password}</code>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Copy password"
                  onClick={async () => {
                    const ok = await copy(secret?.password ?? '');
                    toast({ title: ok ? 'Password copied' : 'Could not copy — select and copy it manually', variant: ok ? 'default' : 'destructive' });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Warning: this password will not be shown again. Copy it now.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecret(null)}>I have copied it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign work */}
      <Dialog open={reOpen} onOpenChange={setReOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reassign work</DialogTitle>
            <DialogDescription>Move open work from one member to another, e.g. when someone leaves.</DialogDescription>
          </DialogHeader>
          {moved ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Moved from {nameOf(re.from)} to {nameOf(re.to)}:
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(moved).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-slate-200 p-3 text-center">
                    <div className="text-xl font-bold text-slate-900">{v}</div>
                    <div className="text-xs text-slate-500">{REASSIGN_ENTITIES.find((e) => e.key === k)?.label ?? k}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="From">
                  <Select value={re.from} onValueChange={(v) => setRe((r) => ({ ...r, from: v, to: r.to === v ? '' : r.to }))}>
                    <SelectTrigger aria-label="From member">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                          {m.is_active ? '' : ' (inactive)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="To">
                  <Select value={re.to} onValueChange={(v) => setRe((r) => ({ ...r, to: v }))}>
                    <SelectTrigger aria-label="To member">
                      <SelectValue placeholder="Select active member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members
                        .filter((m) => m.is_active && m.id !== re.from)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} · {roleLabel(m.role)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-medium text-slate-900">What to move</legend>
                {REASSIGN_ENTITIES.map((e) => (
                  <label key={e.key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-blue-600"
                      checked={re.entities.includes(e.key)}
                      onChange={(ev) => {
                        const on = ev.target.checked;
                        setRe((r) => ({ ...r, entities: on ? [...r.entities, e.key] : r.entities.filter((x) => x !== e.key) }));
                      }}
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">{e.label}</span>
                      <span className="block text-xs text-slate-500">{e.hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </div>
          )}
          <DialogFooter>
            {moved ? (
              <Button onClick={() => setReOpen(false)}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setReOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={!re.from || !re.to || !re.entities.length || reassign.isPending} onClick={submitReassign}>
                  {reassign.isPending ? 'Moving…' : 'Reassign'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
