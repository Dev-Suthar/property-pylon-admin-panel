import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Lock, Pencil, Unlock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { CustomerPicker, Field } from '@/pages/workspace/shared';
import { builderApi, dateIN, inr, UNIT_STATUS, type Unit } from '@/services/companyApi';
import { ErrorRow, qk, UNIT_TONE } from './shared';

const HOLD_HOURS = [2, 6, 12, 24, 48, 72, 168];
const hoursLabel = (h: number) => (h === 168 ? '7 days' : h >= 24 ? `${h / 24} day${h > 24 ? 's' : ''}` : `${h} hours`);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between gap-3 py-1.5 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-medium text-slate-900">{value ?? '—'}</span>
  </div>
);

/** Unit details + hold / release / block / edit, like the app's unit sheet. */
export function UnitSheet({
  companyId,
  projectId,
  unitId,
  onOpenChange,
}: {
  companyId: string;
  projectId: string;
  unitId: string | null;
  onOpenChange: (o: boolean) => void;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const open = !!unitId;
  const q = useQuery({ queryKey: qk.unit(companyId, unitId ?? ''), queryFn: () => builderApi.unit(companyId, unitId!), enabled: open });
  const u = q.data;

  const [mode, setMode] = useState<'view' | 'hold' | 'edit'>('view');
  const [customer, setCustomer] = useState('');
  const [hours, setHours] = useState('24');
  const [form, setForm] = useState({ configuration: '', super_area: '', carpet_area: '', facing: '', base_rate: '', plc: '' });
  const [holdError, setHoldError] = useState('');

  useEffect(() => {
    setMode('view');
    setCustomer('');
    setHours('24');
    setHoldError('');
  }, [unitId]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: [companyId, 'units', projectId] });
    qc.invalidateQueries({ queryKey: qk.unit(companyId, unitId ?? '') });
    qc.invalidateQueries({ queryKey: qk.project(companyId, projectId) });
    qc.invalidateQueries({ queryKey: [companyId, 'projects'] });
  };
  const onError = (title: string) => (e: Error) => toast({ title, description: e.message, variant: 'destructive' });

  const hold = useMutation({
    mutationFn: () => builderApi.hold(companyId, unitId!, customer, Number(hours)),
    onSuccess: (r) => {
      toast({ title: `Unit ${r.unit_number} on hold`, description: r.hold_until ? `Until ${dateIN(r.hold_until, true)}` : undefined });
      setMode('view');
      refresh();
    },
    onError: (e: Error) => {
      setHoldError(e.message);
      onError('Could not hold unit')(e);
      refresh();
    },
  });
  const release = useMutation({
    mutationFn: () => builderApi.release(companyId, unitId!),
    onSuccess: () => {
      toast({ title: 'Hold released', description: `Unit ${u?.unit_number} is available again` });
      refresh();
    },
    onError: onError('Could not release'),
  });
  const setStatus = useMutation({
    mutationFn: (status: 'blocked' | 'available') => builderApi.updateUnit(companyId, unitId!, { status }),
    onSuccess: (r) => {
      toast({ title: r.status === 'blocked' ? 'Unit blocked' : 'Unit unblocked', description: `Unit ${r.unit_number}` });
      refresh();
    },
    onError: onError('Could not change status'),
  });
  const save = useMutation({
    mutationFn: () =>
      builderApi.updateUnit(companyId, unitId!, {
        configuration: form.configuration.trim() || null,
        super_area: form.super_area || null,
        carpet_area: form.carpet_area || null,
        facing: form.facing.trim() || null,
        base_rate: form.base_rate || null,
        plc: form.plc || null,
      }),
    onSuccess: () => {
      toast({ title: 'Unit updated' });
      setMode('view');
      refresh();
    },
    onError: onError('Could not save unit'),
  });

  const startEdit = (x: Unit) => {
    setForm({
      configuration: x.configuration ?? '',
      super_area: x.super_area ? String(Number(x.super_area)) : '',
      carpet_area: x.carpet_area ? String(Number(x.carpet_area)) : '',
      facing: x.facing ?? '',
      base_rate: x.base_rate ? String(Number(x.base_rate)) : '',
      plc: x.plc ? String(Number(x.plc)) : '',
    });
    setMode('edit');
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const busy = hold.isPending || release.isPending || setStatus.isPending || save.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            Unit {u?.unit_number ?? '…'}
            {u ? <StatusBadge tone={UNIT_TONE[u.status]}>{UNIT_STATUS[u.status]}</StatusBadge> : null}
          </SheetTitle>
          <SheetDescription>{u ? `${u.Tower?.name ?? 'Tower'} · Floor ${u.floor}` : 'Loading…'}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {q.error ? <ErrorRow error={q.error as Error} onRetry={() => q.refetch()} /> : null}
          {q.isLoading ? <div className="h-40 animate-pulse rounded-xl bg-slate-100" /> : null}

          {u && mode === 'view' ? (
            <>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 py-1">
                <Row label="Configuration" value={u.configuration} />
                <Row label="Super area" value={u.super_area ? `${Number(u.super_area)} sq ft` : null} />
                <Row label="Carpet area" value={u.carpet_area ? `${Number(u.carpet_area)} sq ft` : null} />
                <Row label="Facing" value={u.facing} />
                <Row label="Base rate" value={u.base_rate ? `${inr(u.base_rate)}/sq ft` : null} />
                <Row label="PLC" value={u.plc ? inr(u.plc) : null} />
                <Row label="Indicative price" value={u.indicative_price ? inr(u.indicative_price) : null} />
              </div>

              {u.status === 'hold' ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <div className="font-semibold">On hold</div>
                  <div>For: {u.HoldCustomer?.name ?? '—'}</div>
                  <div>By: {u.HoldBy?.name ?? '—'}</div>
                  <div>Until: {dateIN(u.hold_until, true)}</div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {u.status === 'available' ? (
                  <Button size="sm" onClick={() => setMode('hold')} disabled={busy}>
                    <Lock /> Hold
                  </Button>
                ) : null}
                {u.status === 'hold' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={async () => {
                      if (await confirm({ title: `Release unit ${u.unit_number}?`, description: `The hold for ${u.HoldCustomer?.name ?? 'this lead'} ends now and the unit becomes available.`, confirmText: 'Release' }))
                        release.mutate();
                    }}
                  >
                    <Unlock /> Release hold
                  </Button>
                ) : null}
                {u.status === 'available' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={async () => {
                      if (await confirm({ title: `Block unit ${u.unit_number}?`, description: 'Blocked units cannot be held or booked until unblocked.', confirmText: 'Block', destructive: true }))
                        setStatus.mutate('blocked');
                    }}
                  >
                    <Ban /> Block
                  </Button>
                ) : null}
                {u.status === 'blocked' ? (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus.mutate('available')}>
                    <Unlock /> Unblock
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" disabled={busy} onClick={() => startEdit(u)}>
                  <Pencil /> Edit details
                </Button>
              </div>
              {u.status === 'booked' || u.status === 'sold' ? (
                <p className="text-xs text-slate-500">Booked and sold units can't be held or blocked. Cancel the booking to free the unit.</p>
              ) : null}
            </>
          ) : null}

          {u && mode === 'hold' ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setHoldError('');
                if (customer) hold.mutate();
              }}
            >
              <Field label="Hold for lead">
                <CustomerPicker companyId={companyId} value={customer} onChange={setCustomer} />
              </Field>
              <Field label="Hold for">
                <Select value={hours} onValueChange={setHours}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOLD_HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {hoursLabel(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {holdError ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{holdError}</p> : null}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setMode('view')}>
                  <X /> Cancel
                </Button>
                <Button type="submit" disabled={!customer || hold.isPending}>
                  {hold.isPending ? 'Holding…' : 'Hold unit'}
                </Button>
              </div>
            </form>
          ) : null}

          {u && mode === 'edit' ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="Configuration">
                  <Input value={form.configuration} onChange={set('configuration')} placeholder="3 BHK" />
                </Field>
                <Field label="Facing">
                  <Input value={form.facing} onChange={set('facing')} placeholder="East" />
                </Field>
                <Field label="Super area (sq ft)">
                  <Input type="number" min="0" value={form.super_area} onChange={set('super_area')} />
                </Field>
                <Field label="Carpet area (sq ft)">
                  <Input type="number" min="0" value={form.carpet_area} onChange={set('carpet_area')} />
                </Field>
                <Field label="Base rate (₹/sq ft)">
                  <Input type="number" min="0" value={form.base_rate} onChange={set('base_rate')} />
                </Field>
                <Field label="PLC (₹)">
                  <Input type="number" min="0" value={form.plc} onChange={set('plc')} />
                </Field>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setMode('view')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
