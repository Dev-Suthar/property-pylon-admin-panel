import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge, Tone } from '@/components/admin/StatusBadge';
import { useCompanies } from '@/contexts/CompanyContext';
import { AuditLog as Row, auditService } from '@/services/auditService';

const METHOD_TONE: Record<string, Tone> = { POST: 'success', PUT: 'accent', PATCH: 'accent', DELETE: 'danger' };
const ALL = '__all';

/** Every change made by a platform admin, newest first. */
export function AuditLog() {
  const { companies } = useCompanies();
  const [page, setPage] = useState(1);
  const [company, setCompany] = useState(ALL);
  const [method, setMethod] = useState(ALL);
  const [entity, setEntity] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const limit = 25;

  const q = useQuery({
    queryKey: ['audit', page, company, method, entity],
    queryFn: () =>
      auditService.list({
        page,
        limit,
        company_id: company === ALL ? undefined : company,
        method: method === ALL ? undefined : method,
        entity: entity || undefined,
      }),
  });

  const columns: Column<Row>[] = [
    { key: 'when', header: 'When', cell: (r) => new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), csv: (r) => r.created_at },
    { key: 'who', header: 'Admin', cell: (r) => (
      <div>
        <div className="font-medium text-slate-900">{r.actor_name ?? '—'}</div>
        {r.impersonating_user_id ? <div className="text-xs text-slate-500">while viewing as a user</div> : null}
      </div>
    ), csv: (r) => r.actor_name },
    { key: 'action', header: 'Action', cell: (r) => <StatusBadge tone={METHOD_TONE[r.method] ?? 'neutral'}>{r.method}</StatusBadge>, csv: (r) => r.method },
    { key: 'entity', header: 'What', cell: (r) => <span className="font-mono text-xs">{r.entity ?? '—'}</span>, csv: (r) => r.entity },
    { key: 'company', header: 'Company', cell: (r) => r.company_name ?? '—', csv: (r) => r.company_name },
    { key: 'result', header: 'Result', cell: (r) => (
      <StatusBadge tone={r.status_code && r.status_code < 400 ? 'success' : 'danger'}>{r.status_code ?? '—'}</StatusBadge>
    ), csv: (r) => r.status_code },
  ];

  const rows = q.data?.logs ?? [];
  const selected = rows.find((r) => r.id === open);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Every change a platform admin makes, on any company. Passwords and tokens are never stored." />
      <Card>
        <CardContent className="p-4">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            loading={q.isLoading}
            error={q.error as Error | null}
            onRetry={() => q.refetch()}
            empty="No admin changes recorded yet"
            onRowClick={(r) => setOpen(open === r.id ? null : r.id)}
            page={page}
            pageSize={limit}
            total={q.data?.total}
            onPageChange={setPage}
            csvName="audit-log"
            toolbar={
              <>
                <Select value={company} onValueChange={(v) => { setCompany(v); setPage(1); }}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="All companies" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All companies</SelectItem>
                    {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={method} onValueChange={(v) => { setMethod(v); setPage(1); }}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All actions</SelectItem>
                    {['POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input className="w-48" placeholder="What (e.g. team)" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} />
              </>
            }
          />
        </CardContent>
      </Card>
      {selected ? (
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <div className="font-mono text-xs text-slate-500">{selected.method} {selected.path}</div>
            <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-800">{JSON.stringify(selected.summary ?? {}, null, 2)}</pre>
            <div className="text-xs text-slate-500">IP {selected.ip ?? '—'}</div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
