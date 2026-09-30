import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Lock, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ListDef, OptionItem, optionListService } from '@/services/optionListService';

const SOURCE_TEXT = { default: 'Built-in default', platform: 'Platform list', company: 'This company’s list' } as const;
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/**
 * Edit the dropdown lists the apps show. companyId = null edits the
 * platform-wide lists; otherwise a company-only copy.
 */
export function OptionListEditor({ companyId = null }: { companyId?: string | null }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const q = useQuery({ queryKey: ['option-lists', companyId ?? 'platform'], queryFn: () => optionListService.all(companyId) });
  const [selected, setSelected] = useState<string>('lead_sources');
  const [draft, setDraft] = useState<OptionItem[]>([]);
  const [newLabel, setNewLabel] = useState('');

  const def: ListDef | undefined = q.data?.catalog.find((c) => c.key === selected);
  const current = q.data?.lists[selected];
  useEffect(() => {
    setDraft(current ? current.items.map((i) => ({ ...i })) : []);
    setNewLabel('');
  }, [current, selected]);

  const groups = useMemo(() => [...new Set((q.data?.catalog ?? []).map((c) => c.group))], [q.data]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(current?.items ?? []);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['option-lists'] });
  const save = useMutation({
    mutationFn: () => optionListService.save(selected, draft, companyId),
    onSuccess: () => { invalidate(); toast({ title: `${def?.label} saved`, description: 'The app picks it up the next time it loads lists.' }); },
    onError: (e: Error) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' }),
  });
  const reset = useMutation({
    mutationFn: () => optionListService.reset(selected, companyId),
    onSuccess: () => { invalidate(); toast({ title: companyId ? 'Company list removed' : 'Back to the built-in list' }); },
    onError: (e: Error) => toast({ title: 'Could not reset', description: e.message, variant: 'destructive' }),
  });

  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= draft.length) return;
    const next = [...draft];
    [next[i], next[j]] = [next[j], next[i]];
    setDraft(next);
  };
  const patch = (i: number, p: Partial<OptionItem>) => setDraft(draft.map((it, k) => (k === i ? { ...it, ...p } : it)));
  const add = () => {
    const label = newLabel.trim();
    if (!label || !def) return;
    let value: string | number = def.slug ? slugify(label) : label;
    if (def.kind === 'number') value = parseInt(label, 10);
    if (def.kind === 'number' && !Number.isInteger(value)) {
      toast({ title: 'Enter hours as a number', variant: 'destructive' });
      return;
    }
    const itemLabel = def.kind === 'number' ? `${value} hours` : label;
    if (draft.some((d) => String(d.value).toLowerCase() === String(value).toLowerCase())) {
      toast({ title: 'Already in the list', variant: 'destructive' });
      return;
    }
    setDraft([...draft, { value, label: itemLabel, active: true }]);
    setNewLabel('');
  };

  if (q.error) return <p className="text-sm text-red-600">{(q.error as Error).message}</p>;
  if (!q.data) return <div className="h-64 animate-pulse rounded-lg bg-slate-100" />;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <nav className="shrink-0 space-y-4 lg:w-60" aria-label="Lists">
        {groups.map((g) => (
          <div key={g}>
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{g}</div>
            {q.data.catalog.filter((c) => c.group === g).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelected(c.key)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm',
                  c.key === selected ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <span className="truncate">{c.label}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {c.locked ? <Lock className="h-3 w-3 opacity-70" aria-label="Fixed values" /> : null}
                  {q.data.lists[c.key]?.source !== 'default' ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-label="Customised" /> : null}
                </span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {def && current ? (
        <Card className="min-w-0 flex-1">
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{def.label}</h2>
                <p className="text-sm text-slate-500">{def.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge tone={current.source === 'default' ? 'neutral' : 'accent'}>{SOURCE_TEXT[current.source]}</StatusBadge>
                  {def.locked ? <StatusBadge><Lock className="h-3 w-3" /> Fixed values — rename, reorder or hide only</StatusBadge> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={reset.isPending || (companyId ? current.source !== 'company' : current.source === 'default')}
                  onClick={async () => {
                    const ok = await confirm({
                      title: companyId ? 'Remove this company’s list?' : 'Reset to the built-in list?',
                      description: companyId ? 'The company goes back to the platform list.' : 'Every company without its own list gets the built-in defaults.',
                      confirmText: 'Reset',
                      destructive: true,
                    });
                    if (ok) reset.mutate();
                  }}
                >
                  {companyId ? 'Use platform list' : 'Reset to built-in'}
                </Button>
                <Button variant="outline" disabled={!dirty} onClick={() => setDraft(current.items.map((i) => ({ ...i })))}>Discard</Button>
                <Button disabled={!dirty || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Save list'}</Button>
              </div>
            </div>

            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {draft.map((it, i) => (
                <li key={`${it.value}-${i}`} className={cn('flex flex-wrap items-center gap-2 px-3 py-2', !it.active && 'opacity-60')}>
                  <div className="flex flex-col">
                    <button type="button" className="text-slate-400 hover:text-slate-900 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${it.label} up`}><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" className="text-slate-400 hover:text-slate-900 disabled:opacity-30" disabled={i === draft.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${it.label} down`}><ArrowDown className="h-3.5 w-3.5" /></button>
                  </div>
                  <Input className="h-8 min-w-40 flex-1" value={it.label} onChange={(e) => patch(i, { label: e.target.value })} aria-label="Label" />
                  <span className="hidden w-32 shrink-0 truncate text-right font-mono text-xs text-slate-500 sm:inline" title="Stored value">{String(it.value)}</span>
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <Switch checked={it.active} onCheckedChange={(v) => patch(i, { active: v })} aria-label={`Show ${it.label}`} />
                    {it.active ? 'Shown' : 'Hidden'}
                  </label>
                  {!def.locked ? (
                    <button type="button" className="rounded p-1 text-slate-400 hover:text-red-600" onClick={() => setDraft(draft.filter((_, k) => k !== i))} aria-label={`Remove ${it.label}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>

            {!def.locked ? (
              <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
                <Input
                  className="max-w-sm"
                  placeholder={def.kind === 'number' ? 'Hours, e.g. 48' : 'New item'}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  aria-label="New item"
                />
                <Button type="submit" variant="outline" disabled={!newLabel.trim()}><Plus /> Add</Button>
              </form>
            ) : null}
            <p className="text-xs text-slate-500">
              Hiding keeps old records valid; removing only affects what agents can pick from now on.
              {companyId ? ' Saving creates a copy for this company only.' : ' Companies with their own copy are not affected.'}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
