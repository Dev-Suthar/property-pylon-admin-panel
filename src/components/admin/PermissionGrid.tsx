import { Check, Lock, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyRole, Matrix, Overrides, SCOPE_LABEL, Scope } from '@/services/permissionService';

const ROLE_LABEL: Record<CompanyRole, string> = { owner: 'Owner', manager: 'Manager', agent: 'Agent', telecaller: 'Telecaller' };

/**
 * Role × permission grid. Cells: default on (✓) / default off (—) /
 * granted (+) / revoked (×) / protected (lock). With `onToggle`, clicking a
 * cell flips it away from or back to the default.
 */
export function PermissionGrid({
  matrix,
  overrides = {},
  scopes,
  onToggle,
}: {
  matrix: Matrix;
  overrides?: Overrides;
  scopes?: Record<CompanyRole, Scope>;
  onToggle?: (role: CompanyRole, perm: string) => void;
}) {
  const groups = [...new Set(matrix.permissions.map((p) => p.group))];

  const cell = (role: CompanyRole, perm: string) => {
    const base = matrix.matrix[role].includes(perm);
    const locked = (matrix.protected[role] || []).includes(perm);
    const granted = overrides[role]?.grant.includes(perm);
    const revoked = overrides[role]?.revoke.includes(perm);
    const on = (base && !revoked) || granted;
    const state = locked ? 'locked' : granted ? 'granted' : revoked ? 'revoked' : base ? 'on' : 'off';
    const Icon = { locked: Lock, granted: Plus, revoked: X, on: Check, off: Minus }[state];
    const label = { locked: 'Always on for owners', granted: 'Granted for this company', revoked: 'Removed for this company', on: 'On (default)', off: 'Off (default)' }[state];
    return (
      <button
        type="button"
        disabled={!onToggle || locked}
        onClick={() => onToggle?.(role, perm)}
        title={label}
        aria-label={`${ROLE_LABEL[role]}: ${label}`}
        className={cn(
          'mx-auto flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
          state === 'granted' && 'border-emerald-300 bg-emerald-50 text-emerald-700',
          state === 'revoked' && 'border-red-300 bg-red-50 text-red-700',
          state === 'on' && 'border-slate-200 bg-slate-100 text-slate-900',
          state === 'off' && 'border-transparent text-slate-400',
          state === 'locked' && 'border-slate-200 bg-slate-100 text-slate-500',
          onToggle && !locked && 'hover:border-slate-400',
          !on && state !== 'revoked' && 'opacity-80',
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th className="text-left">Permission</th>
            {matrix.roles.map((r) => (
              <th key={r} className="w-28 text-center">
                <div>{ROLE_LABEL[r]}</div>
                {scopes ? <div className="mt-0.5 text-[10px] font-normal normal-case tracking-normal text-slate-500">{SCOPE_LABEL[scopes[r]]}</div> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => [
            <tr key={`g-${g}`} className="!bg-transparent !shadow-none hover:!transform-none">
              <td colSpan={matrix.roles.length + 1} className="!pb-1 !pt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">{g}</td>
            </tr>,
            ...matrix.permissions
              .filter((p) => p.group === g)
              .map((p) => (
                <tr key={p.key}>
                  <td>
                    <div className="font-medium text-slate-900">{p.label}</div>
                    <div className="font-mono text-[11px] text-slate-500">{p.key}</div>
                  </td>
                  {matrix.roles.map((r) => (
                    <td key={r} className="text-center">{cell(r, p.key)}</td>
                  ))}
                </tr>
              )),
          ])}
        </tbody>
      </table>
    </div>
  );
}

export const PermissionLegend = () => (
  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
    <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> On by default</span>
    <span className="flex items-center gap-1"><Minus className="h-3.5 w-3.5" /> Off by default</span>
    <span className="flex items-center gap-1 text-emerald-700"><Plus className="h-3.5 w-3.5" /> Granted here</span>
    <span className="flex items-center gap-1 text-red-700"><X className="h-3.5 w-3.5" /> Removed here</span>
    <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Owners always keep</span>
  </div>
);
