import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { inr, sourceLabel, workspaceService } from '@/services/workspaceService';
import { Empty, Section } from './shared';

const fromFor = (range: string) => {
  if (range === 'all') return undefined;
  const d = new Date();
  if (range === 'month') d.setDate(1);
  else d.setDate(d.getDate() - Number(range));
  return d.toISOString().slice(0, 10);
};

export default function InsightsTab({ companyId }: { companyId: string }) {
  const [range, setRange] = useState('month');
  const from = useMemo(() => fromFor(range), [range]);
  const sources = useQuery({ queryKey: ['ws-sources', companyId, from], queryFn: () => workspaceService.leadSources(companyId, from) });
  const board = useQuery({ queryKey: ['ws-leaderboard', companyId, from], queryFn: () => workspaceService.leaderboard(companyId, from) });
  const rows = sources.data?.data ?? [];
  const max = Math.max(1, ...rows.map((r) => r.leads));

  const picker = (
    <Select value={range} onValueChange={setRange}>
      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="month">This month</SelectItem>
        <SelectItem value="90">Last 90 days</SelectItem>
        <SelectItem value="all">All time</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="Team leaderboard" description="Deals, net commission, visits and follow-ups per member." actions={picker}>
        {board.isLoading ? <Empty text="Loading…" /> : (
          <Table>
            <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Member</TableHead><TableHead>Deals</TableHead><TableHead>Commission</TableHead><TableHead>Visits</TableHead><TableHead>Follow-ups</TableHead></TableRow></TableHeader>
            <TableBody>
              {(board.data ?? []).map((u, i) => (
                <TableRow key={u.user_id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{u.name}<span className="ml-2 text-xs text-slate-400">{u.role}</span></TableCell>
                  <TableCell>{u.deals_closed}</TableCell>
                  <TableCell>{inr(u.commission)}</TableCell>
                  <TableCell>{u.visits_completed}</TableCell>
                  <TableCell>{u.tasks_done}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
      <Section title="Lead sources" description={`${sources.data?.total_leads ?? 0} leads · conversion = became a closed deal`}>
        {sources.isLoading ? <Empty text="Loading…" /> : rows.length === 0 ? <Empty text="No leads in this period" /> : (
          <div className="space-y-4 p-2">
            {rows.map((r) => (
              <div key={r.source}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-800">{sourceLabel(r.source)}</span>
                  <span className="text-slate-500">{r.leads} leads · {r.converted} won · {r.conversion_rate}%</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded bg-slate-100">
                  <div className="absolute inset-y-0 left-0 bg-blue-200" style={{ width: `${(r.leads / max) * 100}%` }} />
                  <div className="absolute inset-y-0 left-0 bg-emerald-500" style={{ width: `${(r.converted / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
