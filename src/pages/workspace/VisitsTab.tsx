import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { rows, Visit, workspaceService } from '@/services/workspaceService';
import { CustomerPicker, Empty, Field, PropertyPicker, Section } from './shared';

const STATUS_TONE: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-600',
  no_show: 'bg-red-100 text-red-700',
};

export default function VisitsTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ property_id: '', customer_id: '', date: new Date().toISOString().slice(0, 10), time: '11:00', priority: 'medium', notes: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['ws-visits', companyId, status],
    queryFn: () => workspaceService.visits(companyId, { status: status === 'all' ? undefined : status }),
  });
  const visits = rows<Visit>(data);
  const refresh = () => qc.invalidateQueries({ queryKey: ['ws-visits'] });
  const fail = (e: Error) => toast({ title: 'Request failed', description: e.message, variant: 'destructive' });

  const create = useMutation({
    mutationFn: () => workspaceService.createVisit(companyId, { ...form, notes: form.notes || undefined }),
    onSuccess: () => { refresh(); setOpen(false); toast({ title: 'Visit scheduled' }); },
    onError: fail,
  });
  const setVisitStatus = useMutation({ mutationFn: ({ id, s }: { id: string; s: Visit['status'] }) => workspaceService.visitStatus(companyId, id, s), onSuccess: refresh, onError: fail });
  const remove = useMutation({ mutationFn: (id: string) => workspaceService.deleteVisit(companyId, id), onSuccess: refresh, onError: fail });

  return (
    <Section
      title="Site visits"
      description="Schedule, reschedule and update visits for this agency."
      actions={
        <>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['all', 'scheduled', 'completed', 'cancelled', 'no_show'].map((s) => <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : s.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Schedule visit</Button>
        </>
      }
    >
      {isLoading ? <Empty text="Loading…" /> : visits.length === 0 ? <Empty text="No visits" /> : (
        <Table>
          <TableHeader>
            <TableRow><TableHead>When</TableHead><TableHead>Property</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow>
          </TableHeader>
          <TableBody>
            {visits.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="whitespace-nowrap">{v.date} · {String(v.time).slice(0, 5)}</TableCell>
                <TableCell>{v.Property?.title ?? v.property?.title ?? v.property_title ?? '—'}</TableCell>
                <TableCell>{v.Customer?.name ?? v.customer?.name ?? v.customer_name ?? '—'}</TableCell>
                <TableCell>
                  <Select value={v.status} onValueChange={(s) => setVisitStatus.mutate({ id: v.id, s: s as Visit['status'] })}>
                    <SelectTrigger className={`h-8 w-36 border-0 ${STATUS_TONE[v.status] ?? ''}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['scheduled', 'completed', 'cancelled', 'no_show'].map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => confirm('Delete this visit?') && remove.mutate(v.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule visit</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Field label="Property"><PropertyPicker companyId={companyId} value={form.property_id} onChange={(v) => setForm((f) => ({ ...f, property_id: v }))} /></Field>
            <Field label="Customer"><CustomerPicker companyId={companyId} value={form.customer_id} onChange={(v) => setForm((f) => ({ ...f, customer_id: v }))} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
              <Field label="Time"><Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></Field>
              <Field label="Priority">
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['low', 'medium', 'high'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
          </div>
          <DialogFooter>
            <Button disabled={!form.property_id || !form.customer_id || create.isPending} onClick={() => create.mutate()}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
