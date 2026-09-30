import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, FileText, Info, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { bookingsApi, builderApi, dateIN, DEMAND_STATUS, inr, PAYMENT_MODES, type Booking } from '@/services/companyApi';
import { DEMAND_TONE, ErrorRow, qk } from './builder/shared';

const ALL = 'all';
const modeLabel = (m?: string | null) => PAYMENT_MODES.find((x) => x.value === m)?.label ?? m ?? '—';
const outstandingOf = (b: Booking) => b.outstanding ?? Number(b.total_value) - Number(b.paid_total || 0);
const BookingStatus = ({ s }: { s: Booking['status'] }) => <StatusBadge tone={s === 'confirmed' ? 'success' : 'danger'}>{s === 'confirmed' ? 'Confirmed' : 'Cancelled'}</StatusBadge>;

const H = ({ children }: { children: React.ReactNode }) => <h4 className="mb-2 text-sm font-semibold text-slate-900">{children}</h4>;

const DocLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50">
    <FileText className="h-4 w-4" /> {children} <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
  </a>
);

function CancelDialog({ companyId, booking, open, onOpenChange }: { companyId: string; booking: Booking; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) setReason('');
  }, [open]);
  const m = useMutation({
    mutationFn: () => bookingsApi.cancel(companyId, booking.id, reason.trim()),
    onSuccess: () => {
      toast({ title: 'Booking cancelled', description: `${booking.booking_number} · unit is available again` });
      ['bookings', 'booking', 'collections', 'units', 'project', 'projects', 'unit'].forEach((k) => qc.invalidateQueries({ queryKey: [companyId, k] }));
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: 'Could not cancel booking', description: e.message, variant: 'destructive' }),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel booking {booking.booking_number}?</DialogTitle>
          <DialogDescription>Unpaid demands are cancelled and unit {booking.Unit?.unit_number} goes back to available. This can't be undone.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">Reason (required)</Label>
          <Textarea id="cancel-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Customer withdrew, loan rejected…" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Keep booking</Button>
          <Button variant="destructive" disabled={reason.trim().length < 2 || m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? 'Cancelling…' : 'Cancel booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookingSheet({ companyId, bookingId, onClose }: { companyId: string; bookingId: string | null; onClose: () => void }) {
  const open = !!bookingId;
  const q = useQuery({ queryKey: qk.booking(companyId, bookingId ?? ''), queryFn: () => bookingsApi.get(companyId, bookingId!), enabled: open });
  // Signed links expire after ~15 min: fetch fresh whenever the sheet opens.
  const docs = useQuery({
    queryKey: [companyId, 'booking-docs', bookingId],
    queryFn: () => bookingsApi.documents(companyId, bookingId!),
    enabled: open,
    staleTime: 10 * 60e3,
    gcTime: 0,
  });
  const [cancelling, setCancelling] = useState(false);
  const b = q.data;
  const sheet = b?.cost_sheet ?? {};
  const planName = (b as (Booking & { PaymentPlan?: { name: string } }) | undefined)?.PaymentPlan?.name ?? sheet.plan?.name;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {b?.booking_number ?? 'Booking'} {b ? <BookingStatus s={b.status} /> : null}
          </SheetTitle>
          <SheetDescription>{b ? `Booked ${dateIN(b.booking_date)}${b.Creator?.name ? ` by ${b.Creator.name}` : ''}` : 'Loading…'}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-6">
          {q.error ? <ErrorRow error={q.error as Error} onRetry={() => q.refetch()} /> : null}
          {q.isLoading ? <div className="h-60 animate-pulse rounded-xl bg-slate-100" /> : null}
          {b ? (
            <>
              {b.status === 'cancelled' && b.cancel_reason ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Cancelled: {b.cancel_reason}</div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Customer</div>
                  <div className="font-semibold text-slate-900">{b.Customer?.name ?? '—'}</div>
                  <div className="text-sm text-slate-600">{b.Customer?.phone}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Unit</div>
                  <div className="font-semibold text-slate-900">{b.Unit?.unit_number ?? '—'}</div>
                  <div className="text-sm text-slate-600">
                    {[b.Project?.name, b.Unit?.Tower?.name, b.Unit ? `Floor ${b.Unit.floor}` : null, b.Unit?.configuration].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Payment plan</div>
                  <div className="font-semibold text-slate-900">{planName ?? '—'}</div>
                  <div className="text-sm text-slate-600">Paid {inr(b.paid_total)} · Due {inr(outstandingOf(b))}</div>
                </div>
              </div>

              <div>
                <H>Cost sheet</H>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 py-1 text-sm">
                  {(sheet.lines ?? []).map((l, i) => (
                    <div key={i} className="flex justify-between gap-3 py-1.5">
                      <span className="text-slate-600">{l.label}</span>
                      <span className="text-slate-900">{inr(l.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3 py-1.5 font-medium">
                    <span className="text-slate-700">Agreement value</span>
                    <span className="text-slate-900">{inr(sheet.agreement_value ?? b.agreement_value)}</span>
                  </div>
                  <div className="flex justify-between gap-3 py-1.5">
                    <span className="text-slate-600">GST{sheet.gst_pct != null ? ` (${sheet.gst_pct}%)` : ''}</span>
                    <span className="text-slate-900">{inr(sheet.gst)}</span>
                  </div>
                  <div className="flex justify-between gap-3 py-2 text-base font-semibold">
                    <span className="text-slate-900">Total</span>
                    <span className="text-slate-900">{inr(sheet.total ?? b.total_value)}</span>
                  </div>
                </div>
              </div>

              <div>
                <H>Demand schedule</H>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Milestone</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(b.Demands ?? []).length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="py-6 text-center text-slate-500">No demands</TableCell></TableRow>
                      ) : (
                        b.Demands!.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell>{d.seq}</TableCell>
                            <TableCell className="min-w-[8rem]">{d.milestone}</TableCell>
                            <TableCell className="text-right">{Number(d.pct)}%</TableCell>
                            <TableCell className="text-right">{inr(d.amount)}</TableCell>
                            <TableCell className="text-right">{inr(d.paid_amount)}</TableCell>
                            <TableCell className="whitespace-nowrap">{dateIN(d.due_date)}</TableCell>
                            <TableCell><StatusBadge tone={DEMAND_TONE[d.status]}>{DEMAND_STATUS[d.status] ?? d.status}</StatusBadge></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {b.status === 'confirmed' ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Raise demands and record payments in <Link className="text-blue-700 hover:underline" to={`/c/${companyId}/collections`}>Collections</Link>.
                  </p>
                ) : null}
              </div>

              <div>
                <H>Payments</H>
                {(b.Payments ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No payments recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {b.Payments!.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="whitespace-nowrap font-medium">{p.receipt_number}</TableCell>
                            <TableCell className="whitespace-nowrap">{dateIN(p.paid_at)}</TableCell>
                            <TableCell>{modeLabel(p.mode)}</TableCell>
                            <TableCell>{p.reference || '—'}</TableCell>
                            <TableCell className="text-right">{inr(p.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <H>Documents</H>
                  <Button size="icon" variant="ghost" aria-label="Refresh document links" disabled={docs.isFetching} onClick={() => docs.refetch()}>
                    <RefreshCw className={docs.isFetching ? 'animate-spin' : undefined} />
                  </Button>
                </div>
                {docs.error ? <ErrorRow error={docs.error as Error} onRetry={() => docs.refetch()} /> : null}
                {docs.isLoading ? <div className="h-10 animate-pulse rounded-lg bg-slate-100" /> : null}
                {docs.data ? (
                  <div className="flex flex-wrap gap-2">
                    <DocLink href={docs.data.cost_sheet}>Cost sheet</DocLink>
                    <DocLink href={docs.data.allotment_letter}>Allotment letter</DocLink>
                    {docs.data.demands.map((d) => (
                      <DocLink key={d.id} href={d.url}>Demand letter #{d.seq}</DocLink>
                    ))}
                    {docs.data.receipts.map((r) => (
                      <DocLink key={r.id} href={r.url}>Receipt {r.receipt_number}</DocLink>
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">Links are signed and valid for about 15 minutes. Refresh if one has expired.</p>
              </div>

              {b.status === 'confirmed' ? (
                <div className="border-t border-slate-200 pt-4">
                  <Button variant="destructive" onClick={() => setCancelling(true)}>
                    <XCircle /> Cancel booking
                  </Button>
                  <CancelDialog companyId={companyId} booking={b} open={cancelling} onOpenChange={setCancelling} />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Company bookings: table + detail sheet (`?booking=<id>`). New bookings are made in the app. */
export default function BookingsModule({ companyId }: { companyId: string }) {
  const [params, setParams] = useSearchParams();
  const bookingId = params.get('booking');
  const [status, setStatus] = useState(ALL);
  const [project, setProject] = useState(ALL);
  const filters = { status: status === ALL ? undefined : status, project_id: project === ALL ? undefined : project };
  const q = useQuery({ queryKey: qk.bookings(companyId, filters), queryFn: () => bookingsApi.list(companyId, filters) });
  const projects = useQuery({ queryKey: qk.projects(companyId), queryFn: () => builderApi.projects(companyId) });

  const setBooking = (id: string | null) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('booking', id);
      else next.delete('booking');
      return next;
    });

  const columns: Column<Booking>[] = [
    { key: 'no', header: 'Booking no', cell: (b) => <span className="font-medium text-slate-900">{b.booking_number}</span>, csv: (b) => b.booking_number },
    { key: 'date', header: 'Date', cell: (b) => <span className="whitespace-nowrap">{dateIN(b.booking_date)}</span>, csv: (b) => b.booking_date },
    { key: 'project', header: 'Project', cell: (b) => b.Project?.name ?? '—' },
    { key: 'unit', header: 'Tower / unit', cell: (b) => [b.Unit?.Tower?.name, b.Unit?.unit_number].filter(Boolean).join(' · ') || '—' },
    {
      key: 'customer',
      header: 'Customer',
      cell: (b) => (
        <div>
          <div className="font-medium text-slate-900">{b.Customer?.name ?? '—'}</div>
          <div className="text-xs text-slate-500">{b.Customer?.phone}</div>
        </div>
      ),
      csv: (b) => `${b.Customer?.name ?? ''} ${b.Customer?.phone ?? ''}`.trim(),
    },
    { key: 'total', header: 'Total value', cell: (b) => inr(b.total_value), csv: (b) => Number(b.total_value), className: 'text-right whitespace-nowrap' },
    { key: 'paid', header: 'Paid', cell: (b) => inr(b.paid_total), csv: (b) => Number(b.paid_total || 0), className: 'text-right whitespace-nowrap' },
    { key: 'due', header: 'Outstanding', cell: (b) => (b.status === 'cancelled' ? '—' : inr(outstandingOf(b))), csv: (b) => (b.status === 'cancelled' ? 0 : outstandingOf(b)), className: 'text-right whitespace-nowrap' },
    { key: 'status', header: 'Status', cell: (b) => <BookingStatus s={b.status} />, csv: (b) => b.status },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>New bookings are created in the Property Pylon app (6-step booking wizard). Here you can review bookings, open documents and cancel.</span>
      </div>
      <DataTable
        columns={columns}
        rows={q.data ?? []}
        rowKey={(b) => b.id}
        loading={q.isLoading}
        error={q.error as Error | null}
        onRetry={() => q.refetch()}
        empty="No bookings yet"
        onRowClick={(b) => setBooking(b.id)}
        csvName="bookings"
        toolbar={
          <>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger className="w-52" aria-label="Filter by project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All projects</SelectItem>
                {(projects.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />
      <BookingSheet companyId={companyId} bookingId={bookingId} onClose={() => setBooking(null)} />
    </div>
  );
}
