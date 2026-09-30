import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { builderApi, UNIT_STATUS, type Unit } from '@/services/companyApi';
import { cn } from '@/lib/utils';
import { Empty } from '@/pages/workspace/shared';
import { ErrorRow, qk, TONE_TILE, UNIT_ABBR, UNIT_ORDER, UNIT_TONE } from './shared';

export function UnitLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {UNIT_ORDER.map((s) => (
        <span key={s} className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium', TONE_TILE[UNIT_TONE[s]])}>
          <span className="font-bold">{UNIT_ABBR[s]}</span> = {UNIT_STATUS[s]}
        </span>
      ))}
    </div>
  );
}

/** Floors top-down, one tile per unit: number + status abbreviation + tone. */
export function UnitGrid({ companyId, projectId, towerId, onPick }: { companyId: string; projectId: string; towerId: string; onPick: (u: Unit) => void }) {
  const q = useQuery({ queryKey: qk.units(companyId, projectId, towerId), queryFn: () => builderApi.units(companyId, projectId, towerId) });
  const floors = useMemo(() => {
    const m = new Map<number, Unit[]>();
    (q.data ?? []).forEach((u) => m.set(u.floor, [...(m.get(u.floor) ?? []), u]));
    return [...m.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([floor, units]) => ({ floor, units: units.sort((a, b) => a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true })) }));
  }, [q.data]);

  if (q.error) return <ErrorRow error={q.error as Error} onRetry={() => q.refetch()} />;
  if (q.isLoading) return <div className="h-48 animate-pulse rounded-xl bg-slate-100" />;
  if (!floors.length) return <Empty text="No units in this tower yet. Use “Generate units”." />;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-block min-w-full space-y-1.5">
        {floors.map(({ floor, units }) => (
          <div key={floor} className="flex items-center gap-1.5">
            <div className="w-12 shrink-0 text-right text-xs font-medium text-slate-500">{floor === 0 ? 'G' : `F${floor}`}</div>
            {units.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onPick(u)}
                title={`${u.unit_number} · ${UNIT_STATUS[u.status]}${u.configuration ? ` · ${u.configuration}` : ''}`}
                aria-label={`Unit ${u.unit_number}, ${UNIT_STATUS[u.status]}`}
                className={cn(
                  'flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-md border text-xs leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                  TONE_TILE[UNIT_TONE[u.status]],
                )}
              >
                <span className="font-semibold">{u.unit_number}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">{UNIT_ABBR[u.status]}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
