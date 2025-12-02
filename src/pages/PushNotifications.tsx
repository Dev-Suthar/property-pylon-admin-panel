import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Bell } from 'lucide-react';
import { NotificationStatsCards } from '@/components/NotificationStatsCards';
import { SendNotificationForm } from '@/components/SendNotificationForm';
import { NotificationHistoryTable } from '@/components/NotificationHistoryTable';
import { NotificationSchedulesTable } from '@/components/NotificationSchedulesTable';
import { FCMTokenManagement } from '@/components/FCMTokenManagement';
import { notificationService } from '@/services/notificationService';
import { companyService } from '@/services/companyService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function PushNotifications() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Fetch companies
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getAll({ limit: 100 }),
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['notification-stats', selectedCompanyId],
    queryFn: () => notificationService.getStats(selectedCompanyId || undefined),
  });

  // Fetch upcoming reminders
  const { data: upcomingReminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['upcoming-reminders', selectedCompanyId],
    queryFn: () => notificationService.getUpcomingReminders(selectedCompanyId || undefined),
    enabled: !!selectedCompanyId,
  });

  const companies = companiesData?.companies || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Push Notifications
        </h1>
        <p className="text-slate-600 mt-2 text-lg">
          Manage push notifications and FCM tokens for companies
        </p>
      </div>

      {/* Company Filter */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid gap-2 w-full max-w-sm">
            <Label htmlFor="company-filter">Filter by Company</Label>
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
              disabled={companiesLoading}
            >
              <SelectTrigger id="company-filter">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {statsError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading notification statistics: {statsError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && <NotificationStatsCards stats={stats} isLoading={statsLoading} />}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="tokens">FCM Tokens</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Upcoming Visit Reminders</CardTitle>
              <CardDescription>
                Visits scheduled in the next 48 hours that will receive reminder notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCompanyId ? (
                <div className="p-6 text-center text-slate-500">
                  Please select a company to view upcoming reminders
                </div>
              ) : remindersLoading ? (
                <div className="space-y-4 p-6">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
                    />
                  ))}
                </div>
              ) : !upcomingReminders || upcomingReminders.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No upcoming reminders found
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Reminder Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingReminders.map((reminder) => (
                        <TableRow key={reminder.visit_id}>
                          <TableCell className="font-medium">
                            {reminder.property_title}
                          </TableCell>
                          <TableCell>{reminder.customer_name}</TableCell>
                          <TableCell>
                            <div>
                              <div>{format(new Date(reminder.date), 'MMM dd, yyyy')}</div>
                              <div className="text-xs text-slate-500">{reminder.time}</div>
                            </div>
                          </TableCell>
                          <TableCell>{reminder.assigned_user_name}</TableCell>
                          <TableCell>
                            <Badge variant={reminder.reminder_sent ? 'default' : 'secondary'}>
                              {reminder.reminder_sent ? 'Sent' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          {!selectedCompanyId ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="p-6 text-center text-slate-500">
                  Please select a company to send notifications
                </div>
              </CardContent>
            </Card>
          ) : (
            <SendNotificationForm
              companyId={selectedCompanyId}
              onSuccess={() => {
                // Optionally refresh stats
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {!selectedCompanyId ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="p-6 text-center text-slate-500">
                  Please select a company to view notification history
                </div>
              </CardContent>
            </Card>
          ) : (
            <NotificationHistoryTable companyId={selectedCompanyId} />
          )}
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          {!selectedCompanyId ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="p-6 text-center text-slate-500">
                  Please select a company to view FCM tokens
                </div>
              </CardContent>
            </Card>
          ) : (
            <FCMTokenManagement companyId={selectedCompanyId} />
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          {!selectedCompanyId ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="p-6 text-center text-slate-500">
                  Please select a company to view scheduled notifications
                </div>
              </CardContent>
            </Card>
          ) : (
            <NotificationSchedulesTable companyId={selectedCompanyId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

