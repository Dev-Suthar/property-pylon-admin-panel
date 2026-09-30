import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionGrid, PermissionLegend } from '@/components/admin/PermissionGrid';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { CompanyRole, Overrides, Scope, permissionService } from '@/services/permissionService';

const scopeOf = (perms: string[]): Scope => (perms.includes('leads:view_all') ? 'all' : perms.includes('leads:view_team') ? 'team' : 'self');

/** Change what each role may do in this company only. Enforced by the server. */
export default function PermissionsModule({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const matrix = useQuery({ queryKey: ['permission-matrix'], queryFn: permissionService.matrix, staleTime: Infinity });
  const saved = useQuery({ queryKey: ['permission-overrides', companyId], queryFn: () => permissionService.company(companyId) });
  const [draft, setDraft] = useState<Overrides>({});
  useEffect(() => setDraft(saved.data?.overrides ?? {}), [saved.data]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved.data?.overrides ?? {});
  const changes = Object.values(draft).reduce((n, o) => n + (o?.grant.length ?? 0) + (o?.revoke.length ?? 0), 0);

  const toggle = (role: CompanyRole, perm: string) => {
    const base = matrix.data!.matrix[role].includes(perm);
    const o = { grant: [...(draft[role]?.grant ?? [])], revoke: [...(draft[role]?.revoke ?? [])] };
    const list = base ? o.revoke : o.grant;
    const i = list.indexOf(perm);
    if (i >= 0) list.splice(i, 1);
    else list.push(perm);
    const next = { ...draft, [role]: o };
    if (!o.grant.length && !o.revoke.length) delete next[role];
    setDraft(next);
  };

  const scopes = useMemo(() => {
    if (!matrix.data) return undefined;
    return Object.fromEntries(
      matrix.data.roles.map((r) => {
        const perms = matrix.data!.matrix[r].filter((p) => !draft[r]?.revoke.includes(p)).concat(draft[r]?.grant ?? []);
        return [r, scopeOf(perms)];
      }),
    ) as Record<CompanyRole, Scope>;
  }, [matrix.data, draft]);

  const save = useMutation({
    mutationFn: (o: Overrides) => permissionService.save(companyId, o),
    onSuccess: (res) => {
      qc.setQueryData(['permission-overrides', companyId], res);
      toast({ title: 'Permissions saved', description: 'Applies on the next request each user makes in the app.' });
    },
    onError: (e: Error) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' }),
  });

  const error = (matrix.error || saved.error) as Error | null;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Roles & permissions</CardTitle>
            <CardDescription>
              Click a cell to change it for this company only. “See every lead / team’s leads” also sets how much data a role sees.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!changes && !Object.keys(saved.data?.overrides ?? {}).length}
              onClick={async () => {
                if (await confirm({ title: 'Reset to the default matrix?', description: 'Every change for this company is removed.', confirmText: 'Reset', destructive: true })) save.mutate({});
              }}
            >
              Reset to default
            </Button>
            <Button variant="outline" disabled={!dirty} onClick={() => setDraft(saved.data?.overrides ?? {})}>Discard</Button>
            <Button disabled={!dirty || save.isPending} onClick={() => save.mutate(draft)}>{save.isPending ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PermissionLegend />
          <span className="text-xs font-semibold text-slate-600">
            {changes ? `${changes} change${changes === 1 ? '' : 's'} from default${dirty ? ' · not saved' : ''}` : 'Default matrix'}
          </span>
        </div>
        {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
        {matrix.data && saved.data ? (
          <PermissionGrid matrix={matrix.data} overrides={draft} scopes={scopes} onToggle={toggle} />
        ) : !error ? (
          <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
        ) : null}
      </CardContent>
    </Card>
  );
}
