import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Task, workspaceService } from '@/services/workspaceService';
import { CustomerPicker, Empty, Field, Section } from './shared';

const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function TasksTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState('open');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'follow_up', due_at: toLocalInput(new Date(Date.now() + 86400e3)), customer_id: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['ws-tasks', companyId, filter],
    queryFn: () => workspaceService.tasks(companyId, filter === 'overdue' ? { due: 'overdue' } : { status: filter }),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['ws-tasks'] });
  const fail = (e: Error) => toast({ title: 'Request failed', description: e.message, variant: 'destructive' });

  const create = useMutation({
    mutationFn: () =>
      workspaceService.createTask(companyId, {
        title: form.title,
        type: form.type,
        due_at: new Date(form.due_at).toISOString(),
        customer_id: form.customer_id || undefined,
        description: form.description || undefined,
      }),
    onSuccess: () => { refresh(); setOpen(false); toast({ title: 'Follow-up scheduled' }); },
    onError: fail,
  });
  const toggle = useMutation({
    mutationFn: (t: Task) => workspaceService.updateTask(companyId, t.id, { status: t.status === 'done' ? 'open' : 'done' }),
    onSuccess: refresh,
    onError: fail,
  });
  const remove = useMutation({ mutationFn: (id: string) => workspaceService.deleteTask(companyId, id), onSuccess: refresh, onError: fail });

  const tasks = data?.data ?? [];

  return (
    <Section
      title="Follow-ups"
      description={`Reminders are pushed to the assignee when due.${data?.overdue ? ` ${data.overdue} overdue.` : ''}`}
      actions={
        <>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> New follow-up</Button>
        </>
      }
    >
      {isLoading ? <Empty text="Loading…" /> : tasks.length === 0 ? <Empty text="No follow-ups" /> : (
        <Table>
          <TableHeader>
            <TableRow><TableHead className="w-10" /><TableHead>Task</TableHead><TableHead>Customer</TableHead><TableHead>Due</TableHead><TableHead>Assignee</TableHead><TableHead className="w-12" /></TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => {
              const late = t.status === 'open' && new Date(t.due_at) < new Date();
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <button onClick={() => toggle.mutate(t)} aria-label="Toggle done">
                      {t.status === 'done' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className={`h-5 w-5 ${late ? 'text-red-500' : 'text-slate-400'}`} />}
                    </button>
                  </TableCell>
                  <TableCell className={t.status === 'done' ? 'text-slate-400 line-through' : 'font-medium'}>{t.title}</TableCell>
                  <TableCell>{t.Customer?.name ?? '—'}</TableCell>
                  <TableCell className={late ? 'text-red-600' : ''}>{new Date(t.due_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                  <TableCell>{t.Assignee?.name ?? '—'}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => remove.mutate(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New follow-up</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Field label="Title"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Call back about 3 BHK in Bopal" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['follow_up', 'call', 'meeting', 'documents', 'payment', 'other'].map((t) => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Due"><Input type="datetime-local" value={form.due_at} onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))} /></Field>
            </div>
            <Field label="Customer (optional)"><CustomerPicker companyId={companyId} value={form.customer_id} onChange={(v) => setForm((f) => ({ ...f, customer_id: v }))} /></Field>
            <Field label="Notes"><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          </div>
          <DialogFooter><Button disabled={form.title.trim().length < 2 || create.isPending} onClick={() => create.mutate()}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
