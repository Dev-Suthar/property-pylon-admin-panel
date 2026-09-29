import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { workspaceService } from '@/services/workspaceService';
import { copy, Section } from './shared';

type ImportResult = Awaited<ReturnType<typeof workspaceService.importCsv>>;

export default function LeadsTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [entity, setEntity] = useState<'customers' | 'properties'>('customers');
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const hook = useQuery({ queryKey: ['ws-webhook', companyId], queryFn: () => workspaceService.leadWebhook(companyId) });
  const rotate = useMutation({
    mutationFn: () => workspaceService.rotateLeadWebhook(companyId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ws-webhook'] }); toast({ title: 'New webhook URL generated', description: 'Update it in your forms / Facebook integration.' }); },
  });
  const run = useMutation({
    mutationFn: (dryRun: boolean) => workspaceService.importCsv(companyId, entity, csv, dryRun),
    onSuccess: (r) => {
      setResult(r);
      if (!r.dry_run) {
        qc.invalidateQueries({ queryKey: ['ws-customers'] });
        qc.invalidateQueries({ queryKey: ['ws-properties'] });
        toast({ title: `Imported ${r.created} ${entity}`, description: `${r.skipped} duplicates skipped, ${r.failed} rows failed.` });
      }
    },
    onError: (e: Error) => toast({ title: 'Import failed', description: e.message, variant: 'destructive' }),
  });
  const download = (kind: 'export' | 'template', what: string) =>
    workspaceService.downloadCsv(companyId, kind, what).catch((e: Error) => toast({ title: 'Download failed', description: e.message, variant: 'destructive' }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="Free lead capture" description="Post website forms, Zapier/Make or Facebook Lead Ads to this URL. Each lead becomes a hot buyer and the team is notified — no paid integrations.">
        <div className="space-y-3 p-2">
          <div className="flex gap-2">
            <Input readOnly value={hook.data?.url ?? 'Loading…'} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={async () => hook.data && toast({ title: (await copy(hook.data.url)) ? 'Copied' : hook.data.url })}><Copy className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" title="Generate a new URL" onClick={() => confirm('The old URL will stop working. Continue?') && rotate.mutate()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-slate-500">POST JSON (or Facebook <code>field_data</code>):</p>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(hook.data?.example ?? {}, null, 2)}</pre>
          <p className="text-xs text-slate-500">Buyers can also enquire from every shared listing page — those arrive with source “Website”.</p>
        </div>
      </Section>

      <Section title="Import & export (CSV)" description="Bulk-load existing data. Rows are validated like the app; duplicates are skipped.">
        <div className="space-y-4 p-2">
          <div className="flex flex-wrap gap-2">
            {['customers', 'properties', 'deals'].map((e) => (
              <Button key={e} variant="outline" size="sm" onClick={() => download('export', e)}><Download className="mr-1 h-4 w-4" /> Export {e}</Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={entity} onValueChange={(v) => { setEntity(v as typeof entity); setResult(null); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="properties">Properties</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => download('template', entity)}>Download template</Button>
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-6 text-sm text-slate-600 hover:border-blue-400">
            <Upload className="h-4 w-4" />
            {fileName || 'Choose a CSV file'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                setCsv(await file.text());
                setResult(null);
              }}
            />
          </label>
          <div className="flex gap-2">
            <Button variant="outline" disabled={!csv || run.isPending} onClick={() => run.mutate(true)}>Check file</Button>
            <Button disabled={!csv || run.isPending} onClick={() => run.mutate(false)}>Import</Button>
          </div>
          {result ? (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium">
                {result.dry_run ? 'Check: ' : 'Imported: '}
                {result.created} {result.dry_run ? 'ready' : 'created'} · {result.skipped} duplicates · {result.failed} failed (of {result.total})
              </p>
              {result.errors.slice(0, 8).map((e) => (
                <p key={e.row} className="text-xs text-red-600">Row {e.row}: {e.errors.join('; ')}</p>
              ))}
            </div>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
