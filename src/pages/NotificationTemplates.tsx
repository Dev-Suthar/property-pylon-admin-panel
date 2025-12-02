import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  notificationService,
  NotificationTemplate,
} from '@/services/notificationService';
import { companyService } from '@/services/companyService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<NotificationTemplate | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    description: '',
    type: 'system',
    title: '',
    body: '',
    variables: '',
    is_global: false,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getAll({ limit: 100 }),
  });

  const companies = companiesData?.companies || [];

  const {
    data: templates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notification-templates', selectedCompanyId],
    queryFn: () =>
      notificationService.getTemplates({
        company_id:
          selectedCompanyId !== 'all' ? selectedCompanyId : undefined,
      }),
  });

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormState({
      name: '',
      description: '',
      type: 'system',
      title: '',
      body: '',
      variables: '',
      is_global: selectedCompanyId === 'all',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormState({
      name: template.name,
      description: template.description || '',
      type: template.type,
      title: template.title,
      body: template.body,
      variables: (template.variables || []).join(', '),
      is_global: template.is_global,
    });
    setIsDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => notificationService.createTemplate(payload),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ['notification-templates'],
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create template',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) =>
      notificationService.updateTemplate(payload.id, payload.data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template updated successfully',
      });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      queryClient.invalidateQueries({
        queryKey: ['notification-templates'],
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update template',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteTemplate(id),
    onSuccess: () => {
      toast({
        title: 'Deleted',
        description: 'Template deleted successfully',
      });
      queryClient.invalidateQueries({
        queryKey: ['notification-templates'],
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete template',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const variables = formState.variables
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const basePayload = {
      name: formState.name,
      description: formState.description || undefined,
      type: formState.type,
      title: formState.title,
      body: formState.body,
      variables,
      is_global: formState.is_global,
      company_id:
        formState.is_global || selectedCompanyId === 'all'
          ? undefined
          : selectedCompanyId,
    };

    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        data: basePayload,
      });
    } else {
      createMutation.mutate(basePayload);
    }
  };

  const filteredTemplates: NotificationTemplate[] = useMemo(() => {
    if (!templates) return [];
    if (selectedCompanyId === 'all') return templates;
    return templates.filter(
      (t) => t.is_global || t.company_id === selectedCompanyId,
    );
  }, [templates, selectedCompanyId]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Notification Templates
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Manage reusable notification templates for different companies.
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid gap-2 w-full max-w-sm">
            <Label>Scope</Label>
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
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

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load templates: {error.message}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Global templates are available to all companies. Company templates
            override or extend global ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
                />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No templates found
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.name}
                        {template.description && (
                          <div className="text-xs text-slate-500">
                            {template.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {template.is_global ? (
                          <Badge variant="secondary">Global</Badge>
                        ) : (
                          <Badge variant="default">Company</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {template.variables && template.variables.length > 0 ? (
                          template.variables.join(', ')
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-md truncate">
                        <div className="font-semibold">{template.title}</div>
                        <div className="text-xs text-slate-500">
                          {template.body}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {isSuperAdmin ? (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(template)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-600"
                              onClick={() => deleteMutation.mutate(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">View only</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Use <code>{'{{variable}}'}</code> syntax in the body to define
              placeholders.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formState.description}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, description: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formState.type}
                onValueChange={(value) =>
                  setFormState((s) => ({ ...s, type: value }))
                }
              >
                <SelectTrigger id="type">
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formState.title}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, title: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Body</Label>
              <textarea
                id="body"
                className="min-h-[120px] rounded-lg border border-slate-200 p-2 text-sm"
                value={formState.body}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, body: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="variables">Variables</Label>
              <Input
                id="variables"
                placeholder="user_name, property_title"
                value={formState.variables}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, variables: e.target.value }))
                }
              />
              <p className="text-xs text-slate-500">
                Comma-separated list. You can use them in the body as{' '}
                <code>{'{{user_name}}'}</code>.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="is_global"
                  type="checkbox"
                  checked={formState.is_global}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      is_global: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <Label htmlFor="is_global">Global template</Label>
              </div>
              <p className="text-xs text-slate-500">
                Global templates are available to all companies.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTemplate
                  ? updateMutation.isPending
                    ? 'Updating...'
                    : 'Update Template'
                  : createMutation.isPending
                  ? 'Creating...'
                  : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


