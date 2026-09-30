import { AlertCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /**
   * Plain value for CSV export (defaults to the cell text when it is a
   * string/number). `false` leaves the column out; columns keyed `select`
   * or `actions` are always left out.
   */
  csv?: ((row: T) => string | number | null | undefined) | false;
  className?: string;
}

/** Table with loading, error, empty, optional paging and CSV export. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  empty = 'Nothing here yet',
  onRowClick,
  page,
  pageSize,
  total,
  onPageChange,
  csvName,
  toolbar,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  empty?: string;
  onRowClick?: (row: T) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (p: number) => void;
  csvName?: string;
  toolbar?: React.ReactNode;
}) {
  const pages = page && pageSize && total != null ? Math.max(1, Math.ceil(total / pageSize)) : 0;

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const cols = columns.filter((c) => c.csv !== false && c.key !== 'select' && c.key !== 'actions');
    const head = cols.map((c) => esc(typeof c.header === 'string' ? c.header : c.key)).join(',');
    const body = rows.map((r) =>
      cols
        .map((c) => {
          if (c.csv) return esc(c.csv(r));
          const v = c.cell(r);
          return esc(typeof v === 'string' || typeof v === 'number' ? v : '');
        })
        .join(','),
    );
    const blob = new Blob([[head, ...body].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${csvName}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-3">
      {toolbar || csvName ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          {csvName ? (
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
              <Download /> Export CSV
            </Button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error.message}
          </span>
          {onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`s${i}`}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-slate-500">
                  {error ? 'Could not load data' : empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn(onRowClick && 'cursor-pointer')}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.cell(r)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && onPageChange ? (
        <div className="flex items-center justify-end gap-3 text-sm text-slate-600">
          <span>
            Page {page} of {pages} · {total} total
          </span>
          <Button size="icon" variant="outline" disabled={page! <= 1} onClick={() => onPageChange(page! - 1)} aria-label="Previous page">
            <ChevronLeft />
          </Button>
          <Button size="icon" variant="outline" disabled={page! >= pages} onClick={() => onPageChange(page! + 1)} aria-label="Next page">
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
