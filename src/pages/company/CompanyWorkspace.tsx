import { useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MODULE_INFO, entitlementService } from '@/services/entitlementService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { rememberCompany, useCompanies, useCurrentCompany } from '@/contexts/CompanyContext';
import { cn } from '@/lib/utils';
import { COMPANY_MODULES, MODULE_GROUPS, findModule } from './modules';

/**
 * /c/:companyId/:module — one agency, every module of the broker app.
 * Left rail = modules; header = company switcher and status.
 */
export default function CompanyWorkspace() {
  const { companyId = '', module = 'overview' } = useParams();
  const navigate = useNavigate();
  const { companies } = useCompanies();
  const { company, isError } = useCurrentCompany();
  const active = findModule(module);
  const qc = useQueryClient();
  const { toast } = useToast();
  const ent = useQuery({ queryKey: ['entitlements', companyId], queryFn: () => entitlementService.get(companyId), enabled: !!companyId });
  const isOff = (m?: { requires?: keyof typeof MODULE_INFO }) => Boolean(m?.requires && ent.data && !ent.data.modules[m.requires]);
  const enable = useMutation({
    mutationFn: (key: keyof typeof MODULE_INFO) => entitlementService.update(companyId, { modules: { [key]: true } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entitlements', companyId] });
      toast({ title: 'Module switched on for this company' });
    },
    onError: (e: Error) => toast({ title: 'Could not switch on', description: e.message, variant: 'destructive' }),
  });

  useEffect(() => {
    if (companyId) rememberCompany(companyId);
  }, [companyId]);

  if (!active) return <Navigate to={`/c/${companyId}/overview`} replace />;
  const Component = active.Component;

  return (
    <div className="flex min-h-full flex-col gap-6 lg:flex-row">
      <aside className="shrink-0 lg:w-56">
        <div className="space-y-4 lg:sticky lg:top-0">
          <Select value={companyId} onValueChange={(id) => navigate(`/c/${id}/${module}`)}>
            <SelectTrigger aria-label="Company">
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <nav className="flex gap-4 overflow-x-auto pb-2 lg:block lg:space-y-4 lg:overflow-visible lg:pb-0">
            {MODULE_GROUPS.map((g) => (
              <div key={g} className="shrink-0">
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{g}</div>
                <div className="flex gap-1 lg:block lg:space-y-0.5">
                  {COMPANY_MODULES.filter((m) => m.group === g).map((m) => (
                    <Link
                      key={m.key}
                      to={`/c/${companyId}/${m.key}`}
                      className={cn(
                        'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        m.key === module ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      )}
                    >
                      <m.icon className="h-4 w-4 shrink-0" />
                      {m.label}
                      {isOff(m) ? <Lock className="ml-auto h-3.5 w-3.5 opacity-70" aria-label="Not in plan" /> : null}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <section className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Building2 className="h-5 w-5 text-slate-600" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">{active.label}</div>
            <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
              {company?.name ?? (isError ? 'Company not found' : 'Loading…')}
            </h1>
          </div>
          {company ? (
            (company as { suspended_at?: string | null }).suspended_at ? (
              <StatusBadge tone="danger">Suspended</StatusBadge>
            ) : (
              <StatusBadge tone={company.is_active ? 'success' : 'danger'}>{company.is_active ? 'Active' : 'Inactive'}</StatusBadge>
            )
          ) : null}
        </div>
        {companyId && isOff(active) ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <Lock className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{MODULE_INFO[active.requires!].label} is not in this company’s plan</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              The app hides it and the API refuses it. Change the plan on the Overview page, or switch it on for this company only.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={() => enable.mutate(active.requires!)} disabled={enable.isPending}>Switch on for this company</Button>
              <Button variant="outline" asChild><Link to={`/c/${companyId}/overview`}>Plan & limits</Link></Button>
            </div>
          </div>
        ) : companyId ? (
          <Component key={companyId} companyId={companyId} />
        ) : null}
      </section>
    </div>
  );
}
