import { Navigate, useSearchParams } from 'react-router-dom';
import { lastCompany, useCompanies } from '@/contexts/CompanyContext';
import { LEGACY_TABS } from './company/modules';

/**
 * /workspace → /c/:companyId/:module. Keeps old ?company=&tab= links
 * working and reopens the last company the admin used.
 */
export default function Workspace() {
  const [params] = useSearchParams();
  const { companies, isLoading, error } = useCompanies();
  const tab = params.get('tab') || 'overview';
  const wanted = params.get('company') || lastCompany();
  const id = companies.find((c) => c.id === wanted)?.id ?? companies[0]?.id;

  if (isLoading) return <p className="py-10 text-center text-slate-500">Loading companies…</p>;
  if (error) return <p className="py-10 text-center text-red-600">{(error as Error).message}</p>;
  if (!id) return <p className="py-10 text-center text-slate-500">No companies yet. Create one under Companies.</p>;
  return <Navigate to={`/c/${id}/${LEGACY_TABS[tab] ?? tab}`} replace />;
}
