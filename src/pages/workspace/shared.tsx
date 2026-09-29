import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { rows, workspaceService } from '@/services/workspaceService';

export const Section = ({ title, description, actions, children }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
    <div className="p-2 sm:p-4">{children}</div>
  </div>
);

export const Empty = ({ text }: { text: string }) => <p className="py-10 text-center text-sm text-slate-500">{text}</p>;

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {children}
  </div>
);

/** Customer picker for a company (search as you type). */
export const CustomerPicker = ({ companyId, value, onChange }: { companyId: string; value: string; onChange: (id: string) => void }) => {
  const { data } = useQuery({ queryKey: ['ws-customers', companyId], queryFn: () => workspaceService.customers(companyId), enabled: !!companyId });
  const list = rows<{ id: string; name: string; phone?: string }>(data);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select customer" />
      </SelectTrigger>
      <SelectContent>
        {list.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name} {c.phone ? `· ${c.phone}` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const PropertyPicker = ({ companyId, value, onChange }: { companyId: string; value: string; onChange: (id: string) => void }) => {
  const { data } = useQuery({ queryKey: ['ws-properties', companyId], queryFn: () => workspaceService.properties(companyId), enabled: !!companyId });
  const list = rows<{ id: string; title: string }>(data);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select property" />
      </SelectTrigger>
      <SelectContent>
        {list.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

/** Close a sale or rent deal (same flow as the broker app, incl. co-broking split). */
export const CloseDealDialog = ({
  companyId,
  property,
  open,
  onOpenChange,
}: {
  companyId: string;
  property: { id: string; title: string } | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    deal_type: 'sale',
    customer_id: '',
    final_amount: '',
    rent_amount: '',
    security_deposit: '',
    agreement_start_date: new Date().toISOString().slice(0, 10),
    agreement_duration_months: '11',
    commission_amount: '',
    partner_id: '',
    partner_commission_pct: '',
    received: false,
  });
  useEffect(() => {
    if (open) setForm((f) => ({ ...f, customer_id: '', final_amount: '', rent_amount: '', commission_amount: '', partner_id: '', partner_commission_pct: '', received: false }));
  }, [open]);
  const { data: partners = [] } = useQuery({ queryKey: ['ws-partners', companyId], queryFn: () => workspaceService.partners(companyId), enabled: open });
  const set = (k: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      workspaceService.closeDeal(companyId, property!.id, {
        deal_type: form.deal_type,
        customer_id: form.customer_id,
        ...(form.deal_type === 'sale'
          ? { final_amount: Number(form.final_amount) }
          : {
              rent_amount: Number(form.rent_amount),
              security_deposit: form.security_deposit ? Number(form.security_deposit) : undefined,
              agreement_start_date: form.agreement_start_date,
              agreement_duration_months: Number(form.agreement_duration_months) || 11,
            }),
        commission_amount: form.commission_amount ? Number(form.commission_amount) : undefined,
        partner_id: form.partner_id || undefined,
        partner_commission_pct: form.partner_id && form.partner_commission_pct ? Number(form.partner_commission_pct) : undefined,
        commission_status: form.received ? 'received' : 'pending',
      }),
    onSuccess: () => {
      toast({ title: 'Deal closed', description: property?.title });
      ['ws-pipeline', 'ws-deals', 'ws-rentals', 'properties'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: 'Could not close deal', description: e.message, variant: 'destructive' }),
  });

  const valid = form.customer_id && (form.deal_type === 'sale' ? Number(form.final_amount) > 0 : Number(form.rent_amount) > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Close deal</DialogTitle>
          <DialogDescription>{property?.title}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deal type">
              <Select value={form.deal_type} onValueChange={set('deal_type')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={form.deal_type === 'sale' ? 'Buyer' : 'Tenant'}>
              <CustomerPicker companyId={companyId} value={form.customer_id} onChange={set('customer_id')} />
            </Field>
          </div>
          {form.deal_type === 'sale' ? (
            <Field label="Final amount (₹)">
              <Input type="number" value={form.final_amount} onChange={(e) => set('final_amount')(e.target.value)} />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monthly rent (₹)"><Input type="number" value={form.rent_amount} onChange={(e) => set('rent_amount')(e.target.value)} /></Field>
              <Field label="Deposit (₹)"><Input type="number" value={form.security_deposit} onChange={(e) => set('security_deposit')(e.target.value)} /></Field>
              <Field label="Agreement start"><Input type="date" value={form.agreement_start_date} onChange={(e) => set('agreement_start_date')(e.target.value)} /></Field>
              <Field label="Duration (months)"><Input type="number" value={form.agreement_duration_months} onChange={(e) => set('agreement_duration_months')(e.target.value)} /></Field>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your commission (₹)"><Input type="number" value={form.commission_amount} onChange={(e) => set('commission_amount')(e.target.value)} /></Field>
            <Field label="Co-broking partner">
              <Select
                value={form.partner_id || 'none'}
                onValueChange={(v) => {
                  const p = partners.find((x) => x.id === v);
                  setForm((f) => ({ ...f, partner_id: v === 'none' ? '' : v, partner_commission_pct: p?.default_commission_pct != null ? String(Number(p.default_commission_pct)) : f.partner_commission_pct }));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No partner</SelectItem>
                  {partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {form.partner_id ? (
            <Field label="Partner's share (%)"><Input type="number" value={form.partner_commission_pct} onChange={(e) => set('partner_commission_pct')(e.target.value)} /></Field>
          ) : null}
          <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
            Commission already received
            <Switch checked={form.received} onCheckedChange={(v) => set('received')(v)} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Closing…' : 'Close deal'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
