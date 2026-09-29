import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, FileText, ImagePlus, MessageCircle, Sparkles, Trash2, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { rows, workspaceService } from '@/services/workspaceService';
import { CloseDealDialog, copy, CustomerPicker } from '@/pages/workspace/shared';

interface Props {
  property: { id: string; title: string; company_id: string; status?: string };
  media: Array<{ id: string; url: string; thumbnail_url?: string; type: string }>;
  notes: Array<{ id: string; content: string; created_at?: string; creator?: { name?: string } }>;
}

/**
 * Admin actions on a property — parity with the broker app: pipeline status,
 * close deal, public share link / brochure, media upload (compressed +
 * watermarked server-side), suggested buyers and notes.
 */
export function PropertyManagePanel({ property, media, notes }: Props) {
  const cid = property.company_id;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [closing, setClosing] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'video' | 'floor_plan'>('image');
  const [progress, setProgress] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [addCustomer, setAddCustomer] = useState('');

  const refresh = () => {
    ['property-details', 'property-notes', 'property-suggested-customers', 'properties', 'ws-pipeline'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };
  const fail = (e: Error) => toast({ title: 'Request failed', description: e.message, variant: 'destructive' });

  const suggestions = useQuery({ queryKey: ['property-suggested-customers', property.id, 'manage'], queryFn: () => workspaceService.suggestedCustomers(cid, property.id) });
  const suggested = rows<any>(suggestions.data).map((r) => r.customer ?? r.Customer ?? r);

  const status = useMutation({ mutationFn: (s: string) => workspaceService.propertyStatus(cid, property.id, s), onSuccess: () => { refresh(); toast({ title: 'Status updated' }); }, onError: fail });
  const deleteMedia = useMutation({ mutationFn: (id: string) => workspaceService.deletePropertyMedia(cid, property.id, id), onSuccess: refresh, onError: fail });
  const addNote = useMutation({ mutationFn: () => workspaceService.addPropertyNote(cid, property.id, note.trim()), onSuccess: () => { setNote(''); refresh(); }, onError: fail });
  const deleteNote = useMutation({ mutationFn: (id: string) => workspaceService.deletePropertyNote(cid, property.id, id), onSuccess: refresh, onError: fail });
  const autoSuggest = useMutation({ mutationFn: () => workspaceService.autoSuggestCustomers(cid, property.id), onSuccess: () => { refresh(); suggestions.refetch(); toast({ title: 'Matching buyers suggested' }); }, onError: fail });
  const addSuggestion = useMutation({ mutationFn: (id: string) => workspaceService.addSuggestedCustomers(cid, property.id, [id]), onSuccess: () => { setAddCustomer(''); suggestions.refetch(); }, onError: fail });
  const removeSuggestion = useMutation({ mutationFn: (id: string) => workspaceService.removeSuggestedCustomer(cid, property.id, id), onSuccess: () => suggestions.refetch(), onError: fail });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      for (const [i, file] of Array.from(files).entries()) {
        setProgress(0);
        await workspaceService.uploadPropertyMedia(cid, property.id, file, uploadType, (p) => setProgress(p));
        toast({ title: `Uploaded ${i + 1}/${files.length}`, description: 'Compressed and watermarked' });
      }
      refresh();
    } catch (e) {
      fail(e as Error);
    } finally {
      setProgress(null);
    }
  };

  const share = async (what: 'link' | 'whatsapp' | 'brochure') => {
    try {
      const link = await workspaceService.share(cid, property.id);
      if (what === 'brochure') window.open(link.brochure_url, '_blank');
      else if (what === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(link.whatsapp_text)}`, '_blank');
      else toast({ title: (await copy(link.share_url)) ? 'Public link copied' : link.share_url });
    } catch (e) {
      fail(e as Error);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Manage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={property.status} onValueChange={(s) => status.mutate(s)} disabled={property.status === 'CLOSED'}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {['OPEN', 'DISCUSSION', 'DEALING'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              {property.status === 'CLOSED' ? <SelectItem value="CLOSED">CLOSED</SelectItem> : null}
            </SelectContent>
          </Select>
          {property.status !== 'CLOSED' ? <Button size="sm" onClick={() => setClosing(true)}>Close deal</Button> : null}
          <Button size="sm" variant="outline" onClick={() => share('link')}><Copy className="mr-1 h-4 w-4" /> Public link</Button>
          <Button size="sm" variant="outline" onClick={() => share('whatsapp')}><MessageCircle className="mr-1 h-4 w-4" /> WhatsApp</Button>
          <Button size="sm" variant="outline" onClick={() => share('brochure')}><FileText className="mr-1 h-4 w-4" /> Brochure</Button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Media</p>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={uploadType} onValueChange={(v) => setUploadType(v as typeof uploadType)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Photos</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="floor_plan">Floor plan</SelectItem>
              </SelectContent>
            </Select>
            <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
              <ImagePlus className="mr-1 h-4 w-4" />
              {progress === null ? 'Upload' : progress < 100 ? `Uploading ${progress}%` : 'Compressing…'}
              <input
                type="file"
                multiple={uploadType === 'image'}
                accept={uploadType === 'video' ? 'video/*' : 'image/*'}
                className="hidden"
                disabled={progress !== null}
                onChange={(e) => {
                  upload(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {media.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {media.map((m) => (
                <div key={m.id} className="group relative">
                  {m.type === 'video' ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded bg-slate-800 text-xs text-white">{m.thumbnail_url && m.thumbnail_url !== m.url ? <img src={m.thumbnail_url} className="h-16 w-16 rounded object-cover" alt="" /> : 'Video'}</div>
                  ) : (
                    <img src={m.thumbnail_url || m.url} alt="" className="h-16 w-16 rounded object-cover" />
                  )}
                  <button
                    className="absolute -right-1 -top-1 hidden rounded-full bg-red-600 p-0.5 text-white group-hover:block"
                    onClick={() => confirm('Delete this file?') && deleteMedia.mutate(m.id)}
                    aria-label="Delete media"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Suggested buyers ({suggested.length})</p>
            <Button size="sm" variant="ghost" onClick={() => autoSuggest.mutate()} disabled={autoSuggest.isPending}><Sparkles className="mr-1 h-4 w-4" /> Auto-match</Button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><CustomerPicker companyId={cid} value={addCustomer} onChange={setAddCustomer} /></div>
            <Button size="sm" variant="outline" disabled={!addCustomer} onClick={() => addSuggestion.mutate(addCustomer)}><UserPlus className="h-4 w-4" /></Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggested.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs">
                {c.name}
                <button onClick={() => removeSuggestion.mutate(c.id)} aria-label={`Remove ${c.name}`}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Notes</p>
          <div className="flex gap-2">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" className="min-h-[40px]" />
            <Button size="sm" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()}>Add</Button>
          </div>
          <div className="mt-2 space-y-1">
            {notes.slice(0, 5).map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-2 rounded bg-slate-50 px-3 py-2 text-sm">
                <span>{n.content}</span>
                <button onClick={() => deleteNote.mutate(n.id)} aria-label="Delete note"><Trash2 className="h-4 w-4 text-red-500" /></button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CloseDealDialog companyId={cid} property={closing ? property : null} open={closing} onOpenChange={setClosing} />
    </Card>
  );
}
