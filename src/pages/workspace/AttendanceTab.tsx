import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { workspaceService } from '@/services/workspaceService';
import { Empty, Section } from './shared';

const t = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—');

export default function AttendanceTab({ companyId }: { companyId: string }) {
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400e3).toISOString().slice(0, 10));
  const { data = [], isLoading } = useQuery({ queryKey: ['ws-attendance', companyId, from], queryFn: () => workspaceService.attendance(companyId, { from }) });
  return (
    <Section
      title="Attendance"
      description="GPS check-in / check-out from the broker app (device GPS only, no paid map APIs)."
      actions={<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />}
    >
      {isLoading ? <Empty text="Loading…" /> : data.length === 0 ? <Empty text="No check-ins in this period" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Team member</TableHead><TableHead>In</TableHead><TableHead>Out</TableHead><TableHead>Hours</TableHead><TableHead>Location</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell className="font-medium">{r.User?.name ?? '—'}</TableCell>
                <TableCell>{t(r.check_in_at)}</TableCell>
                <TableCell>{t(r.check_out_at)}</TableCell>
                <TableCell>{r.hours ?? '—'}</TableCell>
                <TableCell>
                  {r.check_in_lat != null ? (
                    <a className="text-blue-600 underline" href={`https://maps.google.com/?q=${r.check_in_lat},${r.check_in_lng}`} target="_blank" rel="noreferrer">
                      View map
                    </a>
                  ) : 'No GPS'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}
