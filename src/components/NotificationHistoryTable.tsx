import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useQuery } from '@tanstack/react-query';
import { notificationService, NotificationHistoryItem } from '@/services/notificationService';
import { Search, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface NotificationHistoryTableProps {
  companyId: string;
}

export function NotificationHistoryTable({ companyId }: NotificationHistoryTableProps) {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['notification-history', companyId, page, typeFilter, readFilter, startDate, endDate],
    queryFn: () =>
      notificationService.getNotificationHistory(companyId, {
        page,
        limit,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        read: readFilter !== 'all' ? readFilter === 'true' : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
    enabled: !!companyId,
  });

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'default';
      case 'system':
        return 'secondary';
      case 'property':
        return 'outline';
      case 'customer':
        return 'outline';
      case 'visit':
        return 'outline';
      case 'deal':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Notification History</CardTitle>
        <CardDescription>
          View all notifications sent to company users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="visit">Visit</SelectItem>
                  <SelectItem value="deal">Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="read-filter">Status</Label>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="false">Unread</SelectItem>
                  <SelectItem value="true">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-slate-500">
              Error loading notification history
            </div>
          ) : !data || data.notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No notifications found
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.notifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <Badge variant={getTypeBadgeVariant(notification.type)}>
                            {notification.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{notification.title}</TableCell>
                        <TableCell className="max-w-md truncate">{notification.message}</TableCell>
                        <TableCell>
                          {notification.User ? (
                            <div>
                              <div className="font-medium">{notification.User.name}</div>
                              <div className="text-xs text-slate-500">{notification.User.email}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={notification.read ? 'secondary' : 'default'}>
                            {notification.read ? 'Read' : 'Unread'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDate(notification.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.total > limit && (
                <div className="flex justify-center pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {[...Array(Math.ceil(data.total / limit))].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === Math.ceil(data.total / limit) ||
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
                          onClick={() => setPage((p) => Math.min(Math.ceil(data.total / limit), p + 1))}
                          className={
                            page === Math.ceil(data.total / limit)
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

