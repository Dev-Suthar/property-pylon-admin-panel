import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { IndianRupee, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { FormSheet } from '@/components/admin/FormSheet';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Field } from '@/pages/workspace/shared';
import { bookingsApi, dateIN, DEMAND_STATUS, inr, PAYMENT_MODES, type Demand } from '@/services/companyApi';
import { DEMAND_TONE, qk } from './builder/shared';

type Tab = 'overdue' | 'due' | 'upcoming' | 'paid';
const TABS: { value: Tab; label: string }[] = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'due', label: 'Due' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'paid', label: 'Paid' },
];
const istToday = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const plus15 = () => new Date(Date.now() + 5.5 * 3600e3 + 15 * 86400e3).toISOString().slice(0, 10);
const outstandingOf = (d: Demand) => d.outstanding ?? Number(d.amount) - Number(d.paid_amount);
const label = (d: Demand | null) => (d ? `${d.Booking?.booking_number ?? ''} · ${d.milestone}` : '');

function RaiseSheet({ companyId, demand, onClose, onDone }: { companyId: string; demand: Demand | null; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [due, setDue] = useState('');
  useEffect(() => {
    if (demand) setDue(plus15());
  }, [demand]);
  const m = useMutation({
    mutationFn: () => bookingsApi.raise(companyId, demand!.id, due || undefined),
    onSuccess: (d) => {
      toast({ title: 'Demand raised', description: `${label(demand)} · due ${dateIN(d.due_date)}` });
      onDone();
      onClose();
    },
    onError: (e: Error) => toast({ title: 'Could not raise demand', description: e.message, variant: 'destructive' }),
  });
  return (
    <FormSheet open={!!demand} onOpenChange={(o) => !o && onClose()} title="Raise demand" description={label(demand)} onSubmit={() => m.mutate()} saving={m.isPending} submitText="Raise demand">
      <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <div className="text-slate-500">Amount</div>
        <div className="font-semibold text-slate-900">{inr(demand?.amount)}</div>
      </div>
      <Field label="Due date (optional — defaults to 15 days)">
        <Input type="date" value={due} min={istToday()} onChange={(e) => setDue(e.target.value)} />
      </Field>
    </FormSheet>
  );
}

function PaySheet({ companyId, demand, onClose, onDone }: { companyId: string; demand: Demand | null; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ amount: '', mode: 'bank_transfer', reference: '', paid_at: '' });
  const [error, setError] = useState('');
  useEffect(() => {
    if (demand) {
      setF({ amount: String(Math.round(outstandingOf(demand) * 100) / 100), mode: 'bank_transfer', reference: '', paid_at: istToday() });
      setError('');
    }
  }, [demand]);
  const m = useMutation({
    mutationFn: () => bookingsApi.pay(companyId, demand!.id, { amount: Number(f.amount), mode: f.mode, reference: f.reference.trim() || undefined, paid_at: f.paid_at || undefined }),
    onSuccess: (p) => {
      toast({ title: `Payment recorded · receipt ${p.receipt_number}`, description: `${inr(p.amount)} for ${label(demand)}` });
      onDone();
      onClose();
    },
    onError: (e: Error) => {
      setError(e.message);
      toast({ title: 'Could not record payment', description: e.message, variant: 'destructive' });
    },
  });
  const submit = () => {
    setError('');
    if (!(Number(f.amount) > 0)) return setError('Enter an amount above 0');
    m.mutate();
  };
  return (
    <FormSheet open={!!demand} onOpenChange={(o) => !o && onClose()} title="Record payment" description={label(demand)} onSubmit={submit} saving={m.isPending} submitText="Record payment">
      <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Demand</span><span className="text-slate-900">{inr(demand?.amount)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Paid so far</span><span className="text-slate-900">{inr(demand?.paid_amount)}</span></div>
        <div className="flex justify-between font-semibold"><span className="text-slate-700">Outstanding</span><span className="text-slate-900">{demand ? inr(outstandingOf(demand)) : '—'}</span></div>
      </div>
      <Field label="Amount (₹)">
        <Input type="number" min="0" step="0.01" value={f.amount} onChange={(e) => setF((x) => ({ ...x, amount: e.target.value }))} required />
      </Field>
      <Field label="Mode">
        <Select value={f.mode} onValueChange={(v) => setF((x) => ({ ...x, mode: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAYMENT_MODES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Reference (UTR / cheque no.)">
        <Input value={f.reference} maxLength={80} onChange={(e) => setF((x) => ({ ...x, reference: e.target.value }))} />
      </Field>
      <Field label="Paid on">
        <Input type="date" value={f.paid_at} max={istToday()} onChange={(e) => setF((x) => ({ ...x, paid_at: e.target.value }))} />
      </Field>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </FormSheet>
  );
}

/** Demands across all bookings: overdue / due / upcoming / paid, with raise + record payment. */
export default function CollectionsModule({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('due');
  const [raising, setRaising] = useState<Demand | null>(null);
  const [paying, setPaying] = useState<Demand | null>(null);
  const q = useQuery({ queryKey: qk.collections(companyId, tab), queryFn: () => bookingsApi.collections(companyId, tab) });
  const totals = q.data?.totals;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: [companyId, 'collections'] });
    qc.invalidateQueries({ queryKey: [companyId, 'bookings'] });
    qc.invalidateQueries({ queryKey: [companyId, 'booking'] });
    qc.invalidateQueries({ queryKey: [companyId, 'booking-docs'] });
  };

  const columns: Column<Demand>[] = [
    {
      key: 'no',
      header: 'Booking',
      cell: (d) =>
        d.Booking ? (
          <Link className="whitespace-nowrap font-medium text-blue-700 hover:underline" to={`/c/${companyId}/bookings?booking=${d.Booking.id}`}>
            {d.Booking.booking_number}
          </Link>
        ) : '—',
      csv: (d) => d.Booking?.booking_number,
    },
    {
      key: 'cust',
      header: 'Customer',
      cell: (d) => (
        <div>
          <div className="font-medium text-slate-900">{d.Booking?.Customer?.name ?? '—'}</div>
          <div className="text-xs text-slate-500">{d.Booking?.Customer?.phone}</div>
        </div>
      ),
      csv: (d) => d.Booking?.Customer?.name,
    },
    { key: 'unit', header: 'Project / unit', cell: (d) => [d.Booking?.Project?.name, d.Booking?.Unit?.unit_number].filter(Boolean).join(' · ') || '—' },
    { key: 'ms', header: 'Milestone', cell: (d) => `${d.seq}. ${d.milestone}` },
    { key: 'amt', header: 'Amount', cell: (d) => inr(d.amount), csv: (d) => Number(d.amount), className: 'text-right whitespace-nowrap' },
    { key: 'paid', header: 'Paid', cell: (d) => inr(d.paid_amount), csv: (d) => Number(d.paid_amount), className: 'text-right whitespace-nowrap' },
    { key: 'out', header: 'Outstanding', cell: (d) => inr(outstandingOf(d)), csv: (d) => outstandingOf(d), className: 'text-right whitespace-nowrap' },
    { key: 'due', header: 'Due date', cell: (d) => <span className="whitespace-nowrap">{dateIN(d.due_date)}</span>, csv: (d) => d.due_date ?? '' },
    { key: 'st', header: 'Status', cell: (d) => <StatusBadge tone={DEMAND_TONE[d.status]}>{DEMAND_STATUS[d.status] ?? d.status}</StatusBadge>, csv: (d) => DEMAND_STATUS[d.status] },
    {
      key: 'act',
      header: '',
      cell: (d) =>
        d.status === 'pending' ? (
          <Button size="sm" variant="outline" onClick={() => setRaising(d)}>
            <Send /> Raise
          </Button>
        ) : ['raised', 'partially_paid', 'overdue'].includes(d.status) ? (
          <Button size="sm" onClick={() => setPaying(d)}>
            <IndianRupee /> Record payment
          </Button>
        ) : null,
      csv: () => '',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Outstanding (raised demands)</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{totals ? inr(totals.outstanding) : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-slate-500">Overdue</div>
            <div className="mt-1 text-2xl font-bold text-red-700">{totals ? inr(totals.overdue) : '—'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      <DataTable
        columns={columns}
        rows={q.data?.data ?? []}
        rowKey={(d) => d.id}
        loading={q.isLoading}
        error={q.error as Error | null}
        onRetry={() => q.refetch()}
        empty={tab === 'overdue' ? 'Nothing overdue' : tab === 'upcoming' ? 'No demands waiting to be raised' : tab === 'paid' ? 'No paid demands yet' : 'No demands due'}
        csvName={`collections-${tab}`}
      />

      <RaiseSheet companyId={companyId} demand={raising} onClose={() => setRaising(null)} onDone={refresh} />
      <PaySheet companyId={companyId} demand={paying} onClose={() => setPaying(null)} onDone={refresh} />
    </div>
  );
}
