import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Subscription, subscriptionService } from '@/services/subscriptionService';

const ALL = '__all';
const dateIN = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—');

/** Which company is on which plan. Managing a subscription happens on the company's Overview. */
export function CompanySubscriptions() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('active');
  const limit = 20;
  const q = useQuery({
    queryKey: ['subscriptions', page, status],
    queryFn: () => subscriptionService.getAll({ page, limit, status: status === ALL ? undefined : status }),
  });
  const soon = (d?: string) => !!d && new Date(d).getTime() - Date.now() < 7 * 86400e3;

  const columns: Column<Subscription>[] = [
    { key: 'company', header: 'Company', cell: (s) => <span className="font-medium text-slate-900">{s.Company?.name ?? '—'}</span>, csv: (s) => s.Company?.name },
    { key: 'plan', header: 'Plan', cell: (s) => s.plan_name, csv: (s) => s.plan_name },
    { key: 'price', header: 'Price', cell: (s) => `₹${Number(s.price).toLocaleString('en-IN')}/${s.billing_cycle === 'yearly' ? 'yr' : 'mo'}`, csv: (s) => s.price },
    { key: 'start', header: 'Started', cell: (s) => dateIN(s.start_date), csv: (s) => s.start_date },
    {
      key: 'renew',
      header: 'Renews',
      cell: (s) => <span className={s.status === 'active' && soon(s.renewal_date) ? 'font-semibold text-amber-600' : ''}>{dateIN(s.renewal_date)}{s.status === 'active' && soon(s.renewal_date) ? ' · soon' : ''}</span>,
      csv: (s) => s.renewal_date,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => <StatusBadge tone={s.status === 'active' ? 'success' : s.status === 'cancelled' ? 'danger' : 'neutral'}>{s.status}</StatusBadge>,
      csv: (s) => s.status,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Company subscriptions</CardTitle>
        <CardDescription>Open a company to assign or change its plan, extend renewal, cancel, or override modules and limits.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          rows={q.data?.subscriptions ?? []}
          rowKey={(s) => s.id}
          loading={q.isLoading}
          error={q.error as Error | null}
          onRetry={() => q.refetch()}
          empty="No subscriptions"
          onRowClick={(s) => navigate(`/c/${s.company_id}/overview`)}
          page={page}
          pageSize={limit}
          total={q.data?.total}
          onPageChange={setPage}
          csvName="subscriptions"
          toolbar={
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-40" aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value={ALL}>All</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </CardContent>
    </Card>
  );
}
