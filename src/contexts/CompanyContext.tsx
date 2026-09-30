import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { companyService } from '@/services/companyService';

const LAST_KEY = 'admin-last-company';

/** Companies an admin can open in the workspace (the internal "System" tenant is hidden). */
export function useCompanies() {
  const q = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: () => companyService.getAll({ limit: 200 }),
  });
  const companies = (q.data?.companies ?? []).filter((c) => c.name !== 'System');
  return { ...q, companies };
}

/** Company currently open in /c/:companyId/…, with its details. */
export function useCurrentCompany() {
  const { companyId = '' } = useParams();
  const detail = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getById(companyId),
    enabled: !!companyId,
  });
  return { companyId, company: detail.data, ...detail };
}

export const rememberCompany = (id: string) => {
  try {
    localStorage.setItem(LAST_KEY, id);
  } catch {
    // storage blocked: fall back to the first company next time
  }
};

export const lastCompany = () => {
  try {
    return localStorage.getItem(LAST_KEY) || '';
  } catch {
    return '';
  }
};
