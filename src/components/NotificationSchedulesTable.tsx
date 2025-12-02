import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  notificationService,
  NotificationSchedule,
} from '@/services/notificationService';
import { format } from 'date-fns';
import { AlertCircle, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationSchedulesTableProps {
  companyId: string;
}

export function NotificationSchedulesTable({
  companyId,
}: NotificationSchedulesTableProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const limit = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notification-schedules', companyId, page, statusFilter],
    queryFn: () =>
      notificationService.getSchedules({
        company_id: companyId,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit,
      }),
    enabled: !!companyId,
  });

  const cancelMutation = useMutation({
    mutationFn: (scheduleId: string) =>
      notificationService.cancelSchedule(scheduleId),
    onSuccess: () => {
      toast({
        title: 'Cancelled',
        description: 'Scheduled notification cancelled successfully',
      });
      queryClient.invalidateQueries({
        queryKey: ['notification-schedules', companyId],
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to cancel schedule',
        variant: 'destructive',
      });
    },
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    try {
      return format(new Date(value), 'MMM dd, yyyy HH:mm');
    } catch {
      return value;
    }
  };

  const getStatusBadgeVariant = (status: NotificationSchedule['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'cancelled':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Scheduled Notifications</CardTitle>
        <CardDescription>
          View and manage scheduled push notifications for this company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4 text-slate-500" />
              <span>
                Schedules are processed automatically every minute by the
                backend worker.
              </span>
            </div>
            <div className="grid gap-2 w-full md:w-56">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load schedules: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
                />
              ))}
            </div>
          ) : !data || data.schedules.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No scheduled notifications found
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.schedules.map((schedule) => {
                      const payload = schedule.payload;
                      return (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">
                            {payload.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payload.type || 'system'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {payload.target_users === 'all' && 'All users'}
                            {payload.target_users === 'specific' && 'Specific users'}
                            {payload.target_users === 'role' &&
                              `Role: ${payload.role}`}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {formatDateTime(schedule.scheduled_for)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(schedule.status)}
                            >
                              {schedule.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {schedule.creator ? (
                              <>
                                <div>{schedule.creator.name}</div>
                                <div className="text-xs text-slate-500">
                                  {schedule.creator.email}
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {formatDateTime(schedule.sent_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            {schedule.status === 'pending' && isSuperAdmin ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  cancelMutation.mutate(schedule.id)
                                }
                                disabled={cancelMutation.isPending}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Cancel
                              </Button>
                            ) : schedule.status === 'failed' ? (
                              <span className="text-xs text-red-500 max-w-xs inline-block">
                                {schedule.error || 'Failed'}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                -
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            page === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= page - 1 && pageNum <= page + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setPage(pageNum)}
                                isActive={page === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return (
                            <PaginationItem key={pageNum}>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          className={
                            page === totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


