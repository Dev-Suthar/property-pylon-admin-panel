import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarCheck, Clock, Flame, Home, UserPlus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { companyService } from '@/services/companyService';
import { workspaceService } from '@/services/workspaceService';
import { PlanCard } from './PlanCard';
import { AccountStatus } from './AccountStatus';

const Stat = ({ label, value, icon: Icon, to }: { label: string; value?: number; icon: typeof Users; to?: string }) => {
  const body = (
    <Card className="h-full transition-colors hover:border-slate-300">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{value ?? '—'}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

const STAGE_LABEL: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified', site_visit: 'Site visit',
  negotiation: 'Negotiation', booked: 'Booked', lost: 'Lost',
};

/** Company at a glance: today's work, leads by stage, team. */
export default function Overview({ companyId }: { companyId: string }) {
  const stats = useQuery({ queryKey: ['ws-stats', companyId], queryFn: () => workspaceService.stats(companyId) });
  const company = useQuery({ queryKey: ['company', companyId], queryFn: () => companyService.getById(companyId) });
  const s = stats.data;
  const users = (company.data as { users?: { id: string; name: string; role: string; is_active: boolean }[] } | undefined)?.users ?? [];

  if (stats.error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {(stats.error as Error).message}</span>
        <Button size="sm" variant="outline" onClick={() => stats.refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AccountStatus companyId={companyId} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Follow-ups due" value={s?.today?.follow_ups_due} icon={Clock} to={`/c/${companyId}/followups`} />
        <Stat label="Overdue" value={s?.today?.overdue} icon={AlertCircle} to={`/c/${companyId}/followups`} />
        <Stat label="Visits today" value={s?.today?.visits_today} icon={CalendarCheck} to={`/c/${companyId}/visits`} />
        <Stat label="New leads today" value={s?.today?.new_leads} icon={UserPlus} />
        <Stat label="Hot leads" value={s?.today?.hot_leads} icon={Flame} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Leads" value={s?.total_customers} icon={Users} />
        <Stat label="Active listings" value={s?.active_properties} icon={Home} to={`/c/${companyId}/pipeline`} />
        <Stat label="Deals closed this month" value={s?.deals_closed_this_month} icon={CalendarCheck} to={`/c/${companyId}/deals`} />
      </div>

      <PlanCard companyId={companyId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Leads by stage</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(STAGE_LABEL).map((k) => {
              const n = s?.leads_by_stage?.[k] ?? 0;
              const total = Math.max(1, s?.total_customers ?? 1);
              return (
                <div key={k} className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">{STAGE_LABEL[k]}</span><span className="font-semibold text-slate-900">{n}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${(n / total) * 100}%` }} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Team ({users.length})</CardTitle></CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {users.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No team members</p> : users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5">
                <span className="font-medium text-slate-900">{u.name}</span>
                <span className="flex items-center gap-2">
                  <StatusBadge>{u.role === 'admin' ? 'owner' : u.role}</StatusBadge>
                  {!u.is_active ? <StatusBadge tone="danger">Inactive</StatusBadge> : null}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
