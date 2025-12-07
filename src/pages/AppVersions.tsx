import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, MoreVertical, AlertCircle, Smartphone } from 'lucide-react';
import { appVersionService, AppVersion } from '@/services/appVersionService';
import { useToast } from '@/hooks/use-toast';
import { AppVersionForm } from '@/components/AppVersionForm';
import { format } from 'date-fns';

// Skeleton loader component
const TableSkeleton = () => (
  <div className="space-y-4 p-6">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="h-16 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
      />
    ))}
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-8 shadow-lg">
      <Smartphone className="h-16 w-16 text-blue-600" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-900">
      No app version configurations found
    </h3>
    <p className="mb-6 text-center text-sm text-slate-500 max-w-sm">
      Get started by creating your first app version configuration. Click the button above to add
      a new configuration.
    </p>
  </div>
);

export function AppVersions() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAppVersion, setSelectedAppVersion] = useState<AppVersion | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appVersionToDelete, setAppVersionToDelete] = useState<AppVersion | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch app versions
  const { data, isLoading, error } = useQuery({
    queryKey: ['app-versions'],
    queryFn: () => appVersionService.getAppVersions(),
  });

  const appVersions = data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => appVersionService.deleteAppVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-versions'] });
      toast({
        title: 'Success',
        description: 'App version configuration deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setAppVersionToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete app version configuration',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (appVersion: AppVersion) => {
    setSelectedAppVersion(appVersion);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (appVersion: AppVersion) => {
    setAppVersionToDelete(appVersion);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (appVersionToDelete) {
      deleteMutation.mutate(appVersionToDelete.id);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['app-versions'] });
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedAppVersion(null);
    queryClient.invalidateQueries({ queryKey: ['app-versions'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Versions</h1>
          <p className="text-muted-foreground">
            Manage app version configurations for Android and iOS platforms
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add App Version
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create App Version Configuration</DialogTitle>
              <DialogDescription>
                Configure version rules for Android or iOS platform
              </DialogDescription>
            </DialogHeader>
            <AppVersionForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading app versions: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        {isLoading ? (
          <TableSkeleton />
        ) : appVersions.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Min Supported Version</TableHead>
                <TableHead>Latest Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appVersions.map((appVersion) => (
                <TableRow key={appVersion.id}>
                  <TableCell>
                    <Badge variant={appVersion.platform === 'android' ? 'default' : 'secondary'}>
                      {appVersion.platform.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{appVersion.min_supported_version}</span>
                      <span className="text-xs text-muted-foreground">
                        Build: {appVersion.min_supported_build}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{appVersion.latest_version}</span>
                      <span className="text-xs text-muted-foreground">
                        Build: {appVersion.latest_build}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={appVersion.is_active ? 'default' : 'secondary'}>
                      {appVersion.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(appVersion.updated_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(appVersion)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(appVersion)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit App Version Configuration</DialogTitle>
            <DialogDescription>
              Update version rules for {selectedAppVersion?.platform.toUpperCase()} platform
            </DialogDescription>
          </DialogHeader>
          {selectedAppVersion && (
            <AppVersionForm
              appVersion={selectedAppVersion}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedAppVersion(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete App Version Configuration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the app version configuration for{' '}
              <strong>{appVersionToDelete?.platform.toUpperCase()}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setAppVersionToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

