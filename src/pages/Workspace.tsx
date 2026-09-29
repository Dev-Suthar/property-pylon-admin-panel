import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { companyService } from '@/services/companyService';
import PipelineTab from './workspace/PipelineTab';
import VisitsTab from './workspace/VisitsTab';
import TasksTab from './workspace/TasksTab';
import DealsTab from './workspace/DealsTab';
import PartnersTab from './workspace/PartnersTab';
import RentalsTab from './workspace/RentalsTab';
import AttendanceTab from './workspace/AttendanceTab';
import InsightsTab from './workspace/InsightsTab';
import LeadsTab from './workspace/LeadsTab';

const TABS = [
  ['pipeline', 'Pipeline', PipelineTab],
  ['visits', 'Visits', VisitsTab],
  ['followups', 'Follow-ups', TasksTab],
  ['deals', 'Deals & commission', DealsTab],
  ['partners', 'Partners', PartnersTab],
  ['rentals', 'Rentals', RentalsTab],
  ['attendance', 'Attendance', AttendanceTab],
  ['insights', 'Insights', InsightsTab],
  ['leads', 'Leads & import', LeadsTab],
] as const;

/**
 * Everything an agency does in the broker app, operable by a platform admin
 * for any company (support, onboarding, bulk imports).
 */
export default function Workspace() {
  const [params, setParams] = useSearchParams();
  const companyId = params.get('company') || '';
  const tab = params.get('tab') || 'pipeline';
  const { data } = useQuery({ queryKey: ['companies', 'workspace'], queryFn: () => companyService.getAll({ limit: 100 }) });
  const companies = (data?.companies ?? []).filter((c) => c.name !== 'System');

  useEffect(() => {
    if (!companyId && companies.length) setParams({ company: companies[0].id, tab }, { replace: true });
  }, [companyId, companies, tab, setParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Agency workspace</h1>
          <p className="mt-1 text-slate-600">Run any agency exactly like the broker app: pipeline, visits, follow-ups, deals, partners and more.</p>
        </div>
        <Select value={companyId} onValueChange={(id) => setParams({ company: id, tab })}>
          <SelectTrigger className="w-72"><SelectValue placeholder="Select a company" /></SelectTrigger>
          <SelectContent>
            {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {companyId ? (
        <Tabs value={tab} onValueChange={(t) => setParams({ company: companyId, tab: t })}>
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            {TABS.map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}
          </TabsList>
          {TABS.map(([value, , Component]) => (
            <TabsContent key={value} value={value} className="mt-6">
              {tab === value ? <Component companyId={companyId} /> : null}
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </div>
  );
}
