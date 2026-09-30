import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGrid, PermissionLegend } from '@/components/admin/PermissionGrid';
import { permissionService } from '@/services/permissionService';

/** The default role matrix every company starts from (defined in the backend's config/permissions.js). */
export function Permissions() {
  const q = useQuery({ queryKey: ['permission-matrix'], queryFn: permissionService.matrix, staleTime: Infinity });
  const scopes = q.data ? Object.fromEntries(q.data.roles.map((r) => [r, q.data!.effective[r].scope])) : undefined;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="The default matrix for every company. To change it for one company, open the company workspace → Team → Roles & permissions."
      />
      <Card>
        <CardContent className="space-y-4 p-4">
          <PermissionLegend />
          {q.error ? <p className="text-sm text-red-600">{(q.error as Error).message}</p> : null}
          {q.data ? <PermissionGrid matrix={q.data} scopes={scopes as never} /> : <div className="h-64 animate-pulse rounded-lg bg-slate-100" />}
        </CardContent>
      </Card>
    </div>
  );
}
