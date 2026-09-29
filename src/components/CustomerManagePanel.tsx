import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { sourceLabel, workspaceService } from '@/services/workspaceService';

interface Props {
  customer: { id: string; name: string; company_id: string; source?: string | null; source_detail?: string | null };
  notes: Array<{ id: string; content: string }>;
}

const tomorrow10 = () => {
  const d = new Date(Date.now() + 86400e3);
  d.setHours(10, 0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/** Lead source, follow-ups and note clean-up for a customer (broker-app parity). */
export function CustomerManagePanel({ customer, notes }: Props) {
  const cid = customer.company_id;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState(`Follow up with ${customer.name}`);
  const [due, setDue] = useState(tomorrow10());
  const fail = (e: Error) => toast({ title: 'Request failed', description: e.message, variant: 'destructive' });

  const tasks = useQuery({
    queryKey: ['ws-tasks', cid, 'customer', customer.id],
    queryFn: () => workspaceService.tasks(cid, { status: 'open' }).then((r) => r.data.filter((t) => t.Customer?.id === customer.id)),
  });
  const addTask = useMutation({
    mutationFn: () => workspaceService.createTask(cid, { title, due_at: new Date(due).toISOString(), customer_id: customer.id } as any),
    onSuccess: () => { tasks.refetch(); qc.invalidateQueries({ queryKey: ['ws-tasks'] }); toast({ title: 'Follow-up scheduled' }); },
    onError: fail,
  });
  const done = useMutation({ mutationFn: (id: string) => workspaceService.updateTask(cid, id, { status: 'done' }), onSuccess: () => tasks.refetch(), onError: fail });
  const deleteNote = useMutation({
    mutationFn: (id: string) => workspaceService.deleteCustomerNote(cid, customer.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer-notes'] }),
    onError: fail,
  });

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3"><CardTitle className="text-base">Manage</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>
          <span className="text-slate-500">Lead source: </span>
          <span className="font-medium">{sourceLabel(customer.source)}</span>
          {customer.source_detail ? <span className="text-slate-500"> · {customer.source_detail}</span> : null}
        </p>
        <div>
          <p className="mb-2 font-medium text-slate-700">Follow-ups</p>
          <div className="flex flex-wrap gap-2">
            <Input className="min-w-[200px] flex-1" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input type="datetime-local" className="w-52" value={due} onChange={(e) => setDue(e.target.value)} />
            <Button size="sm" disabled={title.trim().length < 2 || addTask.isPending} onClick={() => addTask.mutate()}><CalendarPlus className="mr-1 h-4 w-4" /> Add</Button>
          </div>
          <div className="mt-2 space-y-1">
            {(tasks.data ?? []).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2">
                <span>{t.title} · {new Date(t.due_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <Button size="sm" variant="ghost" onClick={() => done.mutate(t.id)}>Done</Button>
              </div>
            ))}
          </div>
        </div>
        {notes.length ? (
          <div>
            <p className="mb-2 font-medium text-slate-700">Delete notes</p>
            {notes.slice(0, 5).map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-2 rounded bg-slate-50 px-3 py-2">
                <span className="line-clamp-2">{n.content}</span>
                <button onClick={() => confirm('Delete this note?') && deleteNote.mutate(n.id)} aria-label="Delete note"><Trash2 className="h-4 w-4 text-red-500" /></button>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
