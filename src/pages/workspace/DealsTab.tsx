import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Deal, inr, workspaceService } from '@/services/workspaceService';
import { Empty, Field, Section } from './shared';

const TONE = { pending: 'bg-amber-100 text-amber-800', received: 'bg-emerald-100 text-emerald-800', waived: 'bg-slate-100 text-slate-700' };

export default function DealsTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState({ commission_amount: '', commission_status: 'pending', partner_id: 'none', partner_commission_pct: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['ws-deals', companyId, status],
    queryFn: () => workspaceService.deals(companyId, { commission_status: status === 'all' ? undefined : status }),
  });
  const { data: partners = [] } = useQuery({ queryKey: ['ws-partners', companyId], queryFn: () => workspaceService.partners(companyId), enabled: !!editing });

  useEffect(() => {
    if (!editing) return;
    setForm({
      commission_amount: editing.commission_amount ? String(Number(editing.commission_amount)) : '',
      commission_status: editing.commission_status,
      partner_id: editing.partner_id ?? 'none',
      partner_commission_pct: editing.partner_commission_pct ? String(Number(editing.partner_commission_pct)) : '',
    });
  }, [editing]);

  const save = useMutation({
    mutationFn: () =>
      workspaceService.updateDeal(companyId, editing!.id, {
        commission_amount: form.commission_amount ? Number(form.commission_amount) : null,
        commission_status: form.commission_status,
        partner_id: form.partner_id === 'none' ? null : form.partner_id,
        partner_commission_pct: form.partner_id !== 'none' && form.partner_commission_pct ? Number(form.partner_commission_pct) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ws-deals'] });
      qc.invalidateQueries({ queryKey: ['ws-partners'] });
      setEditing(null);
      toast({ title: 'Deal updated' });
    },
    onError: (e: Error) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });

  const s = data?.summary;
  const deals = data?.data ?? [];

  return (
    <Section
      title="Deals & commissions"
      description="Track commission received vs pending, and co-broking splits."
      actions={
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All deals</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="waived">Waived</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          ['Gross commission', s?.gross, 'text-slate-900'],
          ['Received (net)', s?.received, 'text-emerald-700'],
          ['Pending (net)', s?.pending, 'text-amber-700'],
          ['Partner share', s?.partner_share, 'text-slate-700'],
        ].map(([label, value, tone]) => (
          <div key={label as string} className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label as string}</p>
            <p className={`mt-1 text-xl font-bold ${tone}`}>{inr(value as number)}</p>
          </div>
        ))}
      </div>
      {isLoading ? <Empty text="Loading…" /> : deals.length === 0 ? <Empty text="No deals yet" /> : (
        <Table>
          <TableHeader>
            <TableRow><TableHead>Date</TableHead><TableHead>Property</TableHead><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Partner</TableHead><TableHead>Net commission</TableHead><TableHead>Status</TableHead><TableHead>Closed by</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {deals.map((d) => (
              <TableRow key={d.id} className="cursor-pointer" onClick={() => setEditing(d)}>
                <TableCell className="whitespace-nowrap">{d.deal_date}</TableCell>
                <TableCell>{d.Property?.title ?? '—'}</TableCell>
                <TableCell>{d.Customer?.name ?? '—'}</TableCell>
                <TableCell className="capitalize">{d.deal_type}</TableCell>
                <TableCell>{inr(d.final_amount)}{d.deal_type === 'rent' ? '/mo' : ''}</TableCell>
                <TableCell>{d.Partner ? `${d.Partner.name} (${inr(d.partner_commission_amount)})` : '—'}</TableCell>
                <TableCell className="font-semibold">{inr(d.net_commission)}</TableCell>
                <TableCell><Badge className={TONE[d.commission_status]}>{d.commission_status}</Badge></TableCell>
                <TableCell>{d.Closer?.name ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.Property?.title}</DialogTitle>
            <DialogDescription>{editing?.deal_type === 'rent' ? 'Rent' : 'Sale'} · {editing?.Customer?.name} · {editing?.deal_date}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Commission (₹)"><Input type="number" value={form.commission_amount} onChange={(e) => setForm((f) => ({ ...f, commission_amount: e.target.value }))} /></Field>
              <Field label="Status">
                <Select value={form.commission_status} onValueChange={(v) => setForm((f) => ({ ...f, commission_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['pending', 'received', 'waived'].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Co-broking partner">
                <Select value={form.partner_id} onValueChange={(v) => setForm((f) => ({ ...f, partner_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No partner</SelectItem>
                    {partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Partner share (%)"><Input type="number" disabled={form.partner_id === 'none'} value={form.partner_commission_pct} onChange={(e) => setForm((f) => ({ ...f, partner_commission_pct: e.target.value }))} /></Field>
            </div>
          </div>
          <DialogFooter><Button disabled={save.isPending} onClick={() => save.mutate()}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
