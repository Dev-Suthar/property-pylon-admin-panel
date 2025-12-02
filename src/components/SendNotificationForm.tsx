import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertCircle, CheckCircle, Link2, Clock } from 'lucide-react';
import { notificationService, SendCustomNotificationData, DeepLinkPayload, NotificationTemplate } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { useAuth } from '@/contexts/AuthContext';

interface SendNotificationFormProps {
  companyId?: string;
  onSuccess?: () => void;
}

export function SendNotificationForm({ companyId, onSuccess }: SendNotificationFormProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [targetUsers, setTargetUsers] = useState<'all' | 'specific' | 'role'>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notificationType, setNotificationType] = useState<'system' | 'reminder' | 'property' | 'customer' | 'visit' | 'deal'>('system');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [sendLater, setSendLater] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [attachDeepLink, setAttachDeepLink] = useState(false);
  const [deepLinkScreen, setDeepLinkScreen] = useState<DeepLinkPayload['screen']>('dashboard');
  const [deepLinkPropertyId, setDeepLinkPropertyId] = useState('');
  const [deepLinkCustomerId, setDeepLinkCustomerId] = useState('');
  const [deepLinkVisitId, setDeepLinkVisitId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | 'none'>('none');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Fetch companies if no companyId provided
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getAll({ limit: 100 }),
    enabled: !companyId,
  });

  // Fetch users for the selected company
  const { data: usersData } = useQuery({
    queryKey: ['company-users', companyId],
    queryFn: () => companyService.getUsers(companyId!),
    enabled: !!companyId && (targetUsers === 'specific' || targetUsers === 'role'),
  });

  // Fetch templates for this company (global + company-specific)
  const { data: templates } = useQuery({
    queryKey: ['notification-templates', companyId],
    queryFn: () =>
      notificationService.getTemplates({
        company_id: companyId,
      }),
    enabled: !!companyId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim() || !body.trim()) {
      toast({
        title: 'Error',
        description: 'Title and body are required',
        variant: 'destructive',
      });
      return;
    }

    if (targetUsers === 'specific' && selectedUserIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one user',
        variant: 'destructive',
      });
      return;
    }

    if (targetUsers === 'role' && !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a role',
        variant: 'destructive',
      });
      return;
    }

    if (sendLater && !scheduledFor) {
      toast({
        title: 'Error',
        description: 'Please select a scheduled date and time',
        variant: 'destructive',
      });
      return;
    }

    // Basic deep link validation on client
    let deepLink: DeepLinkPayload | undefined;
    if (attachDeepLink) {
      if (!deepLinkScreen) {
        toast({
          title: 'Error',
          description: 'Please select a deep link target screen',
          variant: 'destructive',
        });
        return;
      }

      if (deepLinkScreen === 'propertyDetails' && !deepLinkPropertyId.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a Property ID for the deep link',
          variant: 'destructive',
        });
        return;
      }
      if (deepLinkScreen === 'customerDetails' && !deepLinkCustomerId.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a Customer ID for the deep link',
          variant: 'destructive',
        });
        return;
      }
      if (deepLinkScreen === 'visitDetails' && !deepLinkVisitId.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a Visit ID for the deep link',
          variant: 'destructive',
        });
        return;
      }

      deepLink = {
        screen: deepLinkScreen,
      };
      if (deepLinkPropertyId.trim()) deepLink.property_id = deepLinkPropertyId.trim();
      if (deepLinkCustomerId.trim()) deepLink.customer_id = deepLinkCustomerId.trim();
      if (deepLinkVisitId.trim()) deepLink.visit_id = deepLinkVisitId.trim();
    }

    setIsSending(true);

    try {
      const data: SendCustomNotificationData = {
        company_id: companyId,
        title: title.trim(),
        body: body.trim(),
        type: notificationType,
        target_users: targetUsers,
        ...(targetUsers === 'specific' && { user_ids: selectedUserIds }),
        ...(targetUsers === 'role' && { role: selectedRole }),
        ...(deepLink ? { deep_link: deepLink } : {}),
        ...(selectedTemplateId !== 'none'
          ? { template_id: selectedTemplateId, variables: templateVariables }
          : {}),
      };
      let description = '';

      if (sendLater && scheduledFor) {
        await notificationService.createSchedule({
          ...data,
          scheduled_for: scheduledFor,
        });
        description = 'Notification scheduled successfully';
      } else {
        const result = await notificationService.sendCustomNotification(data);
        description = `Notification sent to ${result.stats.users_notified} users (${result.stats.total_sent} successful, ${result.stats.total_failed} failed)`;
      }

      toast({
        title: 'Success',
        description,
      });

      // Reset form
      setTitle('');
      setBody('');
      setSelectedUserIds([]);
      setSelectedRole('');
      setTargetUsers('all');
      setSendLater(false);
      setScheduledFor('');
      setAttachDeepLink(false);
      setDeepLinkScreen('dashboard');
      setDeepLinkPropertyId('');
      setDeepLinkCustomerId('');
      setDeepLinkVisitId('');
      setSelectedTemplateId('none');
      setTemplateVariables({});

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notification',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Send Custom Notification</CardTitle>
        <CardDescription>
          Send push notifications to company users. All users with registered FCM tokens will receive the notification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Notification message"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-slate-500">{body.length}/1000 characters</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Notification Type</Label>
              <Select value={notificationType} onValueChange={(value: any) => setNotificationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="target">Target Users</Label>
              <Select value={targetUsers} onValueChange={(value: any) => setTargetUsers(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Company Users</SelectItem>
                  <SelectItem value="specific">Specific Users</SelectItem>
                  <SelectItem value="role">Users by Role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetUsers === 'specific' && usersData && (
              <div className="grid gap-2">
                <Label>Select Users</Label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {usersData.map((user) => (
                    <label key={user.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds([...selectedUserIds, user.id]);
                          } else {
                            setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm">{user.name} ({user.email})</span>
                    </label>
                  ))}
                </div>
                {selectedUserIds.length > 0 && (
                  <p className="text-xs text-slate-500">{selectedUserIds.length} user(s) selected</p>
                )}
              </div>
            )}

            {targetUsers === 'role' && usersData && (
              <div className="grid gap-2">
                <Label htmlFor="role">Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(usersData.map(u => u.role).filter(Boolean))).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Template selection */}
            <div className="border-t border-slate-200 pt-4 mt-2 space-y-3">
              <div className="grid gap-2">
                <Label>Use Template (optional)</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={(value: string) => {
                    setSelectedTemplateId(value);
                    const tpl =
                      value !== 'none'
                        ? (templates || []).find((t) => t.id === value)
                        : undefined;
                    if (tpl) {
                      setTitle(tpl.title);
                      setBody(tpl.body);
                      const initialVars: Record<string, string> = {};
                      (tpl.variables || []).forEach((v) => {
                        initialVars[v] = '';
                      });
                      setTemplateVariables(initialVars);
                    } else {
                      setTemplateVariables({});
                    }
                  }}
                  disabled={!templates || templates.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {(templates || []).map((tpl: NotificationTemplate) => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.name} {tpl.is_global ? '(Global)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplateId !== 'none' && (
                  <p className="text-xs text-slate-500">
                    Template variables will override placeholders in the body
                    like <code>{'{{user_name}}'}</code>.
                  </p>
                )}
              </div>

              {selectedTemplateId !== 'none' &&
                Object.keys(templateVariables).length > 0 && (
                  <div className="grid gap-3 pl-1">
                    {Object.keys(templateVariables).map((key) => (
                      <div key={key} className="grid gap-1">
                        <Label className="text-xs">
                          {key} variable value
                        </Label>
                        <Input
                          value={templateVariables[key]}
                          onChange={(e) =>
                            setTemplateVariables((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={`Value for {{${key}}}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Send later (schedule) section - Super admin only */}
            {isSuperAdmin && (
              <div className="border-t border-slate-200 pt-4 mt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <div>
                      <Label className="cursor-pointer">Send later (schedule)</Label>
                      <p className="text-xs text-slate-500">
                        Schedule this notification to be sent automatically at a future date and time.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendLater(!sendLater)}
                    className="inline-flex h-6 w-11 items-center rounded-full border border-slate-300 bg-slate-100 transition-all duration-200"
                    aria-pressed={sendLater}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                        sendLater ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {sendLater && (
                  <div className="grid gap-2 pl-7">
                    <Label htmlFor="scheduled-for">Scheduled Date &amp; Time</Label>
                    <Input
                      id="scheduled-for"
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-slate-500">
                      The backend worker checks for due schedules every minute and will send this notification around the selected time.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Deep link section */}
            <div className="border-t border-slate-200 pt-4 mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-slate-500" />
                  <div>
                    <Label className="cursor-pointer">Attach deep link (optional)</Label>
                    <p className="text-xs text-slate-500">
                      When user taps the notification, the mobile app will navigate to the selected screen.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachDeepLink(!attachDeepLink)}
                  className="inline-flex h-6 w-11 items-center rounded-full border border-slate-300 bg-slate-100 transition-all duration-200"
                  aria-pressed={attachDeepLink}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                      attachDeepLink ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {attachDeepLink && (
                <div className="grid gap-3 pl-7">
                  <div className="grid gap-2">
                    <Label>Target Screen</Label>
                    <Select
                      value={deepLinkScreen}
                      onValueChange={(value: any) => setDeepLinkScreen(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="propertyDetails">Property Details</SelectItem>
                        <SelectItem value="customerDetails">Customer Details</SelectItem>
                        <SelectItem value="visitDetails">Visit Details</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(deepLinkScreen === 'propertyDetails' || deepLinkScreen === 'dashboard') && (
                    <div className="grid gap-2">
                      <Label htmlFor="deep-link-property">Property ID (optional for Dashboard, required for Property)</Label>
                      <Input
                        id="deep-link-property"
                        placeholder="e.g. property UUID"
                        value={deepLinkPropertyId}
                        onChange={(e) => setDeepLinkPropertyId(e.target.value)}
                      />
                    </div>
                  )}

                  {(deepLinkScreen === 'customerDetails' || deepLinkScreen === 'dashboard') && (
                    <div className="grid gap-2">
                      <Label htmlFor="deep-link-customer">Customer ID (optional for Dashboard, required for Customer)</Label>
                      <Input
                        id="deep-link-customer"
                        placeholder="e.g. customer UUID"
                        value={deepLinkCustomerId}
                        onChange={(e) => setDeepLinkCustomerId(e.target.value)}
                      />
                    </div>
                  )}

                  {(deepLinkScreen === 'visitDetails' || deepLinkScreen === 'dashboard') && (
                    <div className="grid gap-2">
                      <Label htmlFor="deep-link-visit">Visit ID (optional for Dashboard, required for Visit)</Label>
                      <Input
                        id="deep-link-visit"
                        placeholder="e.g. visit UUID"
                        value={deepLinkVisitId}
                        onChange={(e) => setDeepLinkVisitId(e.target.value)}
                      />
                    </div>
                  )}

                  <p className="text-xs text-slate-500">
                    The mobile apps should read the <code>deep_link</code> field from the notification payload
                    and navigate to the corresponding screen.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={isSending || !companyId}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

