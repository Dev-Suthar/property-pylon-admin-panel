import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient, handleApiError } from '@/lib/api';
import { companyService } from '@/services/companyService';

type Suspension = { suspended_at?: string | null; suspended_reason?: string | null };
const post = async (url: string, body?: unknown) => {
  try {
    return (await apiClient.post(url, body)).data;
  } catch (e) {
    throw new Error(handleApiError(e));
  }
};

/**
 * Suspend / reactivate a company. Suspended: users can't sign in or use the
 * app (they see the reason); website and portal leads keep arriving.
 */
export function AccountStatus({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const q = useQuery({ queryKey: ['company', companyId], queryFn: () => companyService.getById(companyId) });
  const c = q.data as (typeof q.data & Suspension) | undefined;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const done = (title: string) => {
    qc.invalidateQueries({ queryKey: ['company', companyId] });
    toast({ title });
  };
  const suspend = useMutation({
    mutationFn: () => post(`/admin/companies/${companyId}/suspend`, { reason }),
    onSuccess: () => { setOpen(false); setReason(''); done('Company suspended'); },
    onError: (e: Error) => toast({ title: 'Could not suspend', description: e.message, variant: 'destructive' }),
  });
  const reactivate = useMutation({
    mutationFn: () => post(`/admin/companies/${companyId}/reactivate`),
    onSuccess: () => done('Company reactivated'),
    onError: (e: Error) => toast({ title: 'Could not reactivate', description: e.message, variant: 'destructive' }),
  });

  if (!c) return null;
  const suspended = Boolean(c.suspended_at);

  return (
    <>
      <div className={suspended ? 'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3' : 'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3'}>
        <div className="flex items-start gap-3">
          {suspended ? <Ban className="mt-0.5 h-5 w-5 text-red-600" /> : <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />}
          <div>
            <div className={suspended ? 'font-semibold text-red-700' : 'font-semibold text-slate-900'}>
              {suspended ? `Suspended since ${new Date(c.suspended_at!).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Account active'}
            </div>
            <div className="text-sm text-slate-600">
              {suspended ? `Reason shown to users: “${c.suspended_reason}”` : 'Users can sign in and use the app.'}
            </div>
          </div>
        </div>
        {suspended ? (
          <Button
            disabled={reactivate.isPending}
            onClick={async () => {
              if (await confirm({ title: 'Reactivate this company?', description: 'Everyone in the company can sign in again right away.', confirmText: 'Reactivate' })) reactivate.mutate();
            }}
          >
            Reactivate
          </Button>
        ) : (
          <Button variant="outline" className="text-red-600" onClick={() => setOpen(true)}>Suspend…</Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {c.name}?</DialogTitle>
            <DialogDescription>
              Everyone in this company is signed out of the app and can’t sign in until you reactivate it. Leads from the website and portals are still saved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="suspend-reason">Reason (shown to the company’s users)</Label>
            <Textarea id="suspend-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Subscription payment overdue — call 98xxxxxx to restore access" maxLength={500} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={reason.trim().length < 3 || suspend.isPending} onClick={() => suspend.mutate()}>
              {suspend.isPending ? 'Suspending…' : 'Suspend company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
