import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { inr, rows, workspaceService } from '@/services/workspaceService';
import { Empty, Section } from './shared';

export default function RentalsTab({ companyId }: { companyId: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['ws-rentals', companyId], queryFn: () => workspaceService.rentals(companyId) });
  const list = rows<any>(data).sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0));
  return (
    <Section title="Rental agreements" description="Active agreements, soonest renewal first.">
      {isLoading ? <Empty text="Loading…" /> : list.length === 0 ? <Empty text="No active rental agreements" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Property</TableHead><TableHead>Tenant</TableHead><TableHead>Rent</TableHead><TableHead>Period</TableHead><TableHead>Renewal</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map((a) => {
              const days = a.daysRemaining;
              const tone = days < 0 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700';
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.Property?.title ?? '—'}</TableCell>
                  <TableCell>{a.Tenant?.name ?? '—'}{a.Tenant?.phone ? ` · ${a.Tenant.phone}` : ''}</TableCell>
                  <TableCell>{inr(a.rent_amount)}/mo</TableCell>
                  <TableCell className="whitespace-nowrap">{a.start_date} → {a.end_date}</TableCell>
                  <TableCell><Badge className={tone}>{days < 0 ? `Expired ${-days}d ago` : `${days} days left`}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}
