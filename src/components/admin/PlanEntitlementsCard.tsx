import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Blocks } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { LIMIT_INFO, LIMIT_KEYS, MODULE_INFO, MODULE_KEYS } from '@/services/entitlementService';
import { SubscriptionPlan, subscriptionPlanService } from '@/services/subscriptionPlanService';

/** Modules and limits a plan includes. Enforced by the server for every subscribed company. */
export function PlanEntitlementsCard({ plan }: { plan: SubscriptionPlan }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const initModules = () => Object.fromEntries(MODULE_KEYS.map((k) => [k, plan.modules?.[k] !== false]));
  const initLimits = () => Object.fromEntries(LIMIT_KEYS.map((k) => [k, plan.limits?.[k] == null ? '' : String(plan.limits[k])]));
  const [modules, setModules] = useState<Record<string, boolean>>(initModules);
  const [limits, setLimits] = useState<Record<string, string>>(initLimits);

  useEffect(() => {
    setModules(initModules());
    setLimits(initLimits());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id, plan.updated_at]);

  const save = useMutation({
    mutationFn: () =>
      subscriptionPlanService.update(plan.id, {
        modules,
        limits: Object.fromEntries(LIMIT_KEYS.map((k) => [k, limits[k] === '' ? null : Math.max(0, parseInt(limits[k], 10) || 0)])),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription-plans'] });
      qc.invalidateQueries({ queryKey: ['plan-details', plan.id] });
      qc.invalidateQueries({ queryKey: ['entitlements'] });
      toast({ title: 'Plan updated', description: 'Every company on this plan gets the change right away.' });
    },
    onError: (e: Error) => toast({ title: 'Could not save plan', description: e.message, variant: 'destructive' }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Blocks className="h-5 w-5" /> Modules & limits</CardTitle>
        <CardDescription>Enforced by the server for every company on this plan. Override per company from its workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {MODULE_KEYS.map((k) => (
            <label key={k} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <span>
                <span className="block text-sm font-semibold text-slate-900">{MODULE_INFO[k].label}</span>
                <span className="block text-xs text-slate-500">{MODULE_INFO[k].hint}</span>
              </span>
              <Switch checked={modules[k]} onCheckedChange={(v) => setModules({ ...modules, [k]: v })} aria-label={MODULE_INFO[k].label} />
            </label>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {LIMIT_KEYS.map((k) => (
            <div key={k} className="space-y-1.5">
              <Label htmlFor={`limit-${k}`}>{LIMIT_INFO[k]}</Label>
              <Input
                id={`limit-${k}`}
                type="number"
                min={0}
                placeholder="Unlimited"
                value={limits[k]}
                onChange={(e) => setLimits({ ...limits, [k]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">Leave a limit empty for unlimited. Existing records over a new limit are kept; only new ones are blocked.</p>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save modules & limits'}</Button>
      </CardContent>
    </Card>
  );
}
