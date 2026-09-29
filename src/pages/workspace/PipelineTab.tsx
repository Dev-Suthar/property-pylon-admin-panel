import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { inr, PipelineColumn, workspaceService } from '@/services/workspaceService';
import { CloseDealDialog, copy, Empty, Section } from './shared';

const STAGES: Record<PipelineColumn['status'], { label: string; tone: string }> = {
  OPEN: { label: 'Open', tone: 'bg-emerald-500' },
  DISCUSSION: { label: 'Discussion', tone: 'bg-blue-500' },
  DEALING: { label: 'Dealing', tone: 'bg-amber-500' },
  CLOSED: { label: 'Closed', tone: 'bg-slate-400' },
};

export default function PipelineTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [closing, setClosing] = useState<{ id: string; title: string } | null>(null);
  const { data: columns = [], isLoading } = useQuery({ queryKey: ['ws-pipeline', companyId], queryFn: () => workspaceService.pipeline(companyId) });

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => workspaceService.propertyStatus(companyId, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ws-pipeline'] }),
    onError: (e: Error) => toast({ title: 'Could not move', description: e.message, variant: 'destructive' }),
  });

  const share = async (id: string, what: 'link' | 'whatsapp' | 'brochure') => {
    try {
      const link = await workspaceService.share(companyId, id);
      if (what === 'brochure') window.open(link.brochure_url, '_blank');
      else if (what === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(link.whatsapp_text)}`, '_blank');
      else toast({ title: (await copy(link.share_url)) ? 'Public link copied' : link.share_url });
    } catch (e) {
      toast({ title: 'Share failed', description: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <Section title="Pipeline" description="Every property by stage. Move cards, close deals, or share a public listing link.">
      {isLoading ? (
        <Empty text="Loading…" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((col) => (
            <div key={col.status} className="rounded-xl bg-slate-50 p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STAGES[col.status].tone}`} />
                <span className="text-sm font-semibold text-slate-700">{STAGES[col.status].label}</span>
                <span className="ml-auto text-xs text-slate-500">{col.count}</span>
              </div>
              <div className="space-y-2">
                {col.items.length === 0 ? <p className="py-6 text-center text-xs text-slate-400">Empty</p> : null}
                {col.items.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-2">
                    {item.image ? <img src={item.image} alt="" className="h-14 w-14 rounded object-cover" /> : <div className="h-14 w-14 rounded bg-slate-100" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{[item.bhk, item.city].filter(Boolean).join(' · ')}</p>
                      <p className="text-xs font-semibold text-slate-700">
                        {inr(item.property_purpose === 'for_rent' ? item.monthly_rent || item.price : item.price)}
                        {item.property_purpose === 'for_rent' ? '/mo' : ''}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {col.status !== 'CLOSED'
                          ? (['OPEN', 'DISCUSSION', 'DEALING'] as const)
                              .filter((s) => s !== col.status)
                              .map((s) => (
                                <DropdownMenuItem key={s} onClick={() => move.mutate({ id: item.id, status: s })}>
                                  Move to {STAGES[s].label}
                                </DropdownMenuItem>
                              ))
                          : null}
                        {col.status !== 'CLOSED' ? <DropdownMenuItem onClick={() => setClosing({ id: item.id, title: item.title })}>Close deal…</DropdownMenuItem> : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => share(item.id, 'link')}>Copy public link</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => share(item.id, 'whatsapp')}>Share on WhatsApp</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => share(item.id, 'brochure')}>Open brochure (PDF)</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <CloseDealDialog companyId={companyId} property={closing} open={!!closing} onOpenChange={(o) => !o && setClosing(null)} />
    </Section>
  );
}
