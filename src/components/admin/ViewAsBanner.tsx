import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { endViewAs, useViewAs } from '@/lib/viewAs';

const ROLE: Record<string, string> = { owner: 'Owner', admin: 'Owner', manager: 'Manager', agent: 'Agent', telecaller: 'Telecaller' };

/** Always-visible strip while a read-only view-as session is on. */
export function ViewAsBanner() {
  const v = useViewAs();
  const qc = useQueryClient();
  // Refetch everything when a session starts or ends so screens switch identity.
  useEffect(() => {
    qc.invalidateQueries();
  }, [v?.token, qc]);
  if (!v) return null;
  const mins = Math.max(0, Math.round((new Date(v.expires_at).getTime() - Date.now()) / 60000));
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 sm:px-6">
      <span className="flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          Viewing as <strong>{v.user.name}</strong> ({ROLE[v.user.role] ?? v.user.role}) — read-only · ends in {mins} min
        </span>
      </span>
      <span className="flex gap-2">
        <Button asChild size="sm" variant="outline"><Link to={`/c/${v.user.company_id}/leads`}>Open their leads</Link></Button>
        <Button size="sm" onClick={endViewAs}>Exit view</Button>
      </span>
    </div>
  );
}
