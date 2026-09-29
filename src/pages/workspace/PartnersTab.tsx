import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { inr, Partner, workspaceService } from '@/services/workspaceService';
import { Empty, Field, Section } from './shared';

const EMPTY = { name: '', firm_name: '', phone: '', email: '', rera_number: '', default_commission_pct: '', notes: '' };

export default function PartnersTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partner | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const { data: partners = [], isLoading } = useQuery({ queryKey: ['ws-partners', companyId], queryFn: () => workspaceService.partners(companyId) });

  useEffect(() => {
    if (!open) return;
    setForm(editing ? { ...EMPTY, ...Object.fromEntries(Object.entries(editing).map(([k, v]) => [k, v == null ? '' : String(k === 'default_commission_pct' ? Number(v) : v)])) } as typeof EMPTY : EMPTY);
  }, [open, editing]);

  const fail = (e: Error) => toast({ title: 'Request failed', description: e.message, variant: 'destructive' });
  const save = useMutation({
    mutationFn: () =>
      workspaceService.savePartner(
        companyId,
        { ...form, default_commission_pct: form.default_commission_pct ? Number(form.default_commission_pct) : null } as Partial<Partner>,
        editing?.id
      ),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ws-partners'] }); setOpen(false); toast({ title: 'Partner saved' }); },
    onError: fail,
  });
  const remove = useMutation({ mutationFn: (id: string) => workspaceService.deletePartner(companyId, id), onSuccess: () => qc.invalidateQueries({ queryKey: ['ws-partners'] }), onError: fail });
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Section
      title="Channel partners"
      description="Co-brokers this agency shares deals with."
      actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" /> Add partner</Button>}
    >
      {isLoading ? <Empty text="Loading…" /> : partners.length === 0 ? <Empty text="No partners yet" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Firm</TableHead><TableHead>Phone</TableHead><TableHead>RERA</TableHead><TableHead>Default share</TableHead><TableHead>Deals</TableHead><TableHead>Commission shared</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
          <TableBody>
            {partners.map((p) => (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => { setEditing(p); setOpen(true); }}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.firm_name || '—'}</TableCell>
                <TableCell>{p.phone || '—'}</TableCell>
                <TableCell>{p.rera_number || '—'}</TableCell>
                <TableCell>{p.default_commission_pct != null ? `${Number(p.default_commission_pct)}%` : '—'}</TableCell>
                <TableCell>{p.deals ?? 0}</TableCell>
                <TableCell>{inr(p.commission_shared)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${p.name}?`)) remove.mutate(p.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit partner' : 'Add partner'}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name *"><Input value={form.name} onChange={set('name')} /></Field>
              <Field label="Firm"><Input value={form.firm_name} onChange={set('firm_name')} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={set('phone')} /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
              <Field label="RERA number"><Input value={form.rera_number} onChange={set('rera_number')} /></Field>
              <Field label="Default share (%)"><Input type="number" value={form.default_commission_pct} onChange={set('default_commission_pct')} /></Field>
            </div>
            <Field label="Notes"><Textarea value={form.notes} onChange={set('notes')} /></Field>
          </div>
          <DialogFooter><Button disabled={form.name.trim().length < 2 || save.isPending} onClick={() => save.mutate()}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
