import { apiClient, handleApiError } from '@/lib/api';

export type CompanyRole = 'owner' | 'manager' | 'agent' | 'telecaller';
export type Scope = 'all' | 'team' | 'self';
export interface PermissionDef {
  key: string;
  group: string;
  label: string;
}
export interface Matrix {
  roles: CompanyRole[];
  permissions: PermissionDef[];
  matrix: Record<CompanyRole, string[]>;
  protected: Partial<Record<CompanyRole, string[]>>;
  effective: Record<CompanyRole, { permissions: string[]; scope: Scope }>;
}
export type Overrides = Partial<Record<CompanyRole, { grant: string[]; revoke: string[] }>>;
export interface CompanyPermissions {
  overrides: Overrides;
  effective: Record<CompanyRole, { permissions: string[]; scope: Scope }>;
}

export const SCOPE_LABEL: Record<Scope, string> = { all: 'Whole company', team: 'Own team', self: 'Own records' };

const call = async <T>(fn: () => Promise<{ data: T }>) => {
  try {
    return (await fn()).data;
  } catch (e) {
    throw new Error(handleApiError(e));
  }
};

export const permissionService = {
  matrix: () => call<Matrix>(() => apiClient.get('/admin/permissions/matrix')),
  company: (companyId: string) => call<CompanyPermissions>(() => apiClient.get(`/admin/companies/${companyId}/permission-overrides`)),
  save: (companyId: string, overrides: Overrides) =>
    call<CompanyPermissions>(() => apiClient.put(`/admin/companies/${companyId}/permission-overrides`, { overrides })),
};
