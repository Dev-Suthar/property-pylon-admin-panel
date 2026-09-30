import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Column, DataTable } from '@/components/admin/DataTable';
import { FormSheet } from '@/components/admin/FormSheet';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { MessageTemplate, TEMPLATE_PLACEHOLDERS, templatesApi } from '@/services/companyApi';
import { Field, Section } from '../workspace/shared';

/**
 * Categories are free text on the server (templateController `pick`, blank →
 * "general"); these are the ones its starter set uses plus "general".
 */
const CATEGORIES: [string, string][] = [
  ['intro', 'Introduction'],
  ['listing', 'Share listing'],
  ['visit', 'Site visit'],
  ['follow_up', 'Follow-up'],
  ['call', 'Missed call'],
  ['general', 'General'],
];
const categoryLabel = (c?: string) => CATEGORIES.find(([v]) => v === c)?.[1] ?? (c ? c.replace(/_/g, ' ') : 'General');

const SAMPLE: Record<string, string> = {
  '{name}': 'Rahul',
  '{property}': '3 BHK at Shela',
  '{project}': 'Skyline Residency',
  '{link}': 'https://dreamtobuy.com/p/xyz',
  '{agent}': 'Priya',
  '{date}': 'tomorrow 5 pm',
};
const preview = (body: string) => body.replace(/\{(name|property|project|link|agent|date)\}/g, (m) => SAMPLE[m] ?? '');

type Form = { name: string; category: string; body: string; is_active: boolean };
const EMPTY: Form = { name: '', category: 'follow_up', body: '', is_active: true };

export default function TemplatesModule({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const key = ['templates', companyId];
  const list = useQuery({ queryKey: key, queryFn: () => templatesApi.list(companyId) });
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const fail = (title: string) => (e: Error) => toast({ title, description: e.message, variant: 'destructive' });

  const save = useMutation({
    mutationFn: () => {
      const input = { name: form.name.trim(), category: form.category, body: form.body.trim(), is_active: form.is_active };
      return editing ? templatesApi.update(companyId, editing.id, input) : templatesApi.create(companyId, input);
    },
    onSuccess: () => { refresh(); setOpen(false); toast({ title: editing ? 'Template updated' : 'Template created' }); },
    onError: fail('Could not save template'),
  });
  const toggle = useMutation({
    mutationFn: (t: MessageTemplate) => templatesApi.update(companyId, t.id, { is_active: !t.is_active }),
    onSuccess: (r) => { refresh(); toast({ title: r.is_active ? 'Template turned on' : 'Template turned off', description: r.name }); },
    onError: fail('Could not update template'),
  });
  const remove = useMutation({
    mutationFn: (t: MessageTemplate) => templatesApi.remove(companyId, t.id),
    onSuccess: () => { refresh(); toast({ title: 'Template deleted' }); },
    onError: fail('Could not delete template'),
  });

  const startCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (t: MessageTemplate) => {
    setEditing(t);
    setForm({ name: t.name, category: t.category || 'general', body: t.body, is_active: t.is_active });
    setOpen(true);
  };
  const askDelete = async (t: MessageTemplate) => {
    if (await confirm({ title: `Delete “${t.name}”?`, description: 'Agents will no longer see this template in the app. This cannot be undone.', confirmText: 'Delete', destructive: true })) {
      remove.mutate(t);
    }
  };

  const insert = (ph: string) => {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? form.body.length;
    const end = el?.selectionEnd ?? form.body.length;
    const body = form.body.slice(0, start) + ph + form.body.slice(end);
    setForm((f) => ({ ...f, body }));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + ph.length, start + ph.length);
    });
  };

  const categoryOptions = CATEGORIES.some(([v]) => v === form.category) ? CATEGORIES : [...CATEGORIES, [form.category, categoryLabel(form.category)] as [string, string]];

  const columns: Column<MessageTemplate>[] = [
    { key: 'name', header: 'Name', cell: (t) => <span className="font-medium text-slate-900">{t.name}</span>, csv: (t) => t.name },
    { key: 'category', header: 'Category', cell: (t) => <StatusBadge>{categoryLabel(t.category)}</StatusBadge>, csv: (t) => t.category },
    {
      key: 'body',
      header: 'Message',
      cell: (t) => <p className="line-clamp-2 min-w-[14rem] max-w-md text-sm text-slate-600">{t.body}</p>,
      csv: (t) => t.body,
    },
    {
      key: 'active',
      header: 'Active',
      cell: (t) => (
        <label className="flex items-center gap-2 text-sm text-slate-600" onClick={(e) => e.stopPropagation()}>
          <Switch checked={t.is_active} onCheckedChange={() => toggle.mutate(t)} disabled={toggle.isPending} aria-label={`${t.name} active`} />
          {t.is_active ? 'On' : 'Off'}
        </label>
      ),
      csv: (t) => (t.is_active ? 'yes' : 'no'),
    },
    {
      key: 'actions',
      header: '',
      cell: (t) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => startEdit(t)} aria-label={`Edit ${t.name}`}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => askDelete(t)} aria-label={`Delete ${t.name}`}><Trash2 className="h-4 w-4 text-red-600" /></Button>
        </div>
      ),
      csv: () => '',
      className: 'w-24',
    },
  ];

  return (
    <Section
      title="WhatsApp templates"
      description="Messages agents send from the app. Placeholders are filled with the lead’s details."
      actions={<Button onClick={startCreate}><Plus className="h-4 w-4" /> New template</Button>}
    >
      <DataTable
        columns={columns}
        rows={list.data ?? []}
        rowKey={(t) => t.id}
        loading={list.isLoading}
        error={list.error as Error | null}
        onRetry={() => list.refetch()}
        empty="No templates yet"
        onRowClick={startEdit}
        csvName="templates"
      />
      <FormSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit template' : 'New template'}
        description="Tap a placeholder to insert it where the cursor is."
        onSubmit={() => {
          if (!form.name.trim() || !form.body.trim()) {
            toast({ title: 'Name and message are required', variant: 'destructive' });
            return;
          }
          save.mutate();
        }}
        saving={save.isPending}
        submitText={editing ? 'Save changes' : 'Create template'}
        wide
      >
        <Field label="Name">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Site visit reminder" required />
        </Field>
        <Field label="Category">
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categoryOptions.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Message">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Insert placeholder">
            {TEMPLATE_PLACEHOLDERS.map((ph) => (
              <button
                key={ph}
                type="button"
                onClick={() => insert(ph)}
                className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-xs text-blue-700 hover:bg-blue-100"
                aria-label={`Insert ${ph}`}
              >
                {ph}
              </button>
            ))}
          </div>
          <Textarea
            ref={bodyRef}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={7}
            placeholder="Hi {name}, sharing {property} with you: {link}"
            required
          />
        </Field>
        <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
          Active (visible to agents)
          <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
        </label>
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-900">Preview</p>
          <div className="whitespace-pre-wrap break-words rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-slate-900">
            {form.body.trim() ? preview(form.body) : <span className="text-slate-500">Your message will appear here</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500">Sample values: Rahul, 3 BHK at Shela, a listing link, agent Priya, tomorrow 5 pm.</p>
        </div>
      </FormSheet>
    </Section>
  );
}
