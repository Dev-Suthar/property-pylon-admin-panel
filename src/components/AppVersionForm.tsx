import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { appVersionService, AppVersion, CreateAppVersionData } from '@/services/appVersionService';
import { useToast } from '@/hooks/use-toast';

interface AppVersionFormProps {
  appVersion?: AppVersion;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AppVersionForm({ appVersion, onSuccess, onCancel }: AppVersionFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateAppVersionData>({
    platform: appVersion?.platform || 'android',
    min_supported_version: appVersion?.min_supported_version || '',
    min_supported_build: appVersion?.min_supported_build || 0,
    latest_version: appVersion?.latest_version || '',
    latest_build: appVersion?.latest_build || 0,
    store_url: appVersion?.store_url || '',
    force_message_title: appVersion?.force_message_title || 'Update Required',
    force_message_body: appVersion?.force_message_body || 'A new version of the app is available. You must update to continue using the app.',
    optional_message_title: appVersion?.optional_message_title || 'New Version Available',
    optional_message_body: appVersion?.optional_message_body || 'We have added new features and performance improvements. Update now for the best experience.',
    is_active: appVersion?.is_active !== undefined ? appVersion.is_active : true,
    rollout_percentage: appVersion?.rollout_percentage || 100,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.platform) {
      newErrors.platform = 'Platform is required';
    }

    if (!formData.min_supported_version) {
      newErrors.min_supported_version = 'Min supported version is required';
    }

    if (formData.min_supported_build === undefined || formData.min_supported_build < 0) {
      newErrors.min_supported_build = 'Min supported build must be a non-negative number';
    }

    if (!formData.latest_version) {
      newErrors.latest_version = 'Latest version is required';
    }

    if (formData.latest_build === undefined || formData.latest_build < 0) {
      newErrors.latest_build = 'Latest build must be a non-negative number';
    }

    if (formData.min_supported_build > formData.latest_build) {
      newErrors.min_supported_build = 'Min supported build must be less than or equal to latest build';
    }

    if (!formData.store_url) {
      newErrors.store_url = 'Store URL is required';
    } else {
      // Basic URL validation
      try {
        new URL(formData.store_url);
      } catch {
        newErrors.store_url = 'Store URL must be a valid URL';
      }
    }

    if (!formData.force_message_title) {
      newErrors.force_message_title = 'Force message title is required';
    }

    if (!formData.force_message_body) {
      newErrors.force_message_body = 'Force message body is required';
    }

    if (!formData.optional_message_title) {
      newErrors.optional_message_title = 'Optional message title is required';
    }

    if (!formData.optional_message_body) {
      newErrors.optional_message_body = 'Optional message body is required';
    }

    if (formData.rollout_percentage !== undefined && (formData.rollout_percentage < 0 || formData.rollout_percentage > 100)) {
      newErrors.rollout_percentage = 'Rollout percentage must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAppVersionData) => appVersionService.createAppVersion(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'App version configuration created successfully',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create app version configuration',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateAppVersionData>) => {
      if (!appVersion) throw new Error('App version not found');
      return appVersionService.updateAppVersion(appVersion.id, data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'App version configuration updated successfully',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update app version configuration',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (appVersion) {
        updateMutation.mutate(formData);
      } else {
        createMutation.mutate(formData);
      }
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Platform */}
      <div className="space-y-2">
        <Label htmlFor="platform">Platform *</Label>
        <Select
          value={formData.platform}
          onValueChange={(value: 'android' | 'ios') =>
            setFormData({ ...formData, platform: value })
          }
          disabled={!!appVersion}
        >
          <SelectTrigger id="platform">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="android">Android</SelectItem>
            <SelectItem value="ios">iOS</SelectItem>
          </SelectContent>
        </Select>
        {errors.platform && (
          <p className="text-sm text-destructive">{errors.platform}</p>
        )}
      </div>

      {/* Min Supported Version */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_supported_version">Min Supported Version *</Label>
          <Input
            id="min_supported_version"
            value={formData.min_supported_version}
            onChange={(e) =>
              setFormData({ ...formData, min_supported_version: e.target.value })
            }
            placeholder="e.g., 1.2.0"
          />
          {errors.min_supported_version && (
            <p className="text-sm text-destructive">{errors.min_supported_version}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_supported_build">Min Supported Build Number *</Label>
          <Input
            id="min_supported_build"
            type="number"
            min="0"
            value={formData.min_supported_build}
            onChange={(e) =>
              setFormData({ ...formData, min_supported_build: parseInt(e.target.value) || 0 })
            }
            placeholder="e.g., 120"
          />
          {errors.min_supported_build && (
            <p className="text-sm text-destructive">{errors.min_supported_build}</p>
          )}
        </div>
      </div>

      {/* Latest Version */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latest_version">Latest Version *</Label>
          <Input
            id="latest_version"
            value={formData.latest_version}
            onChange={(e) =>
              setFormData({ ...formData, latest_version: e.target.value })
            }
            placeholder="e.g., 1.5.0"
          />
          {errors.latest_version && (
            <p className="text-sm text-destructive">{errors.latest_version}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="latest_build">Latest Build Number *</Label>
          <Input
            id="latest_build"
            type="number"
            min="0"
            value={formData.latest_build}
            onChange={(e) =>
              setFormData({ ...formData, latest_build: parseInt(e.target.value) || 0 })
            }
            placeholder="e.g., 150"
          />
          {errors.latest_build && (
            <p className="text-sm text-destructive">{errors.latest_build}</p>
          )}
        </div>
      </div>

      {/* Store URL */}
      <div className="space-y-2">
        <Label htmlFor="store_url">Store URL *</Label>
        <Input
          id="store_url"
          value={formData.store_url}
          onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
          placeholder={
            formData.platform === 'android'
              ? 'https://play.google.com/store/apps/details?id=com.yourapp'
              : 'https://apps.apple.com/app/id123456789'
          }
        />
        {errors.store_url && (
          <p className="text-sm text-destructive">{errors.store_url}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formData.platform === 'android'
            ? 'Play Store URL format: https://play.google.com/store/apps/details?id=com.yourapp'
            : 'App Store URL format: https://apps.apple.com/app/id<APP_ID>'}
        </p>
      </div>

      {/* Force Update Message */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Force Update Message</h3>
        <div className="space-y-2">
          <Label htmlFor="force_message_title">Title *</Label>
          <Input
            id="force_message_title"
            value={formData.force_message_title}
            onChange={(e) =>
              setFormData({ ...formData, force_message_title: e.target.value })
            }
            placeholder="Update Required"
          />
          {errors.force_message_title && (
            <p className="text-sm text-destructive">{errors.force_message_title}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="force_message_body">Body *</Label>
          <Textarea
            id="force_message_body"
            value={formData.force_message_body}
            onChange={(e) =>
              setFormData({ ...formData, force_message_body: e.target.value })
            }
            rows={4}
            placeholder="A new version of the app is available. You must update to continue using the app."
          />
          {errors.force_message_body && (
            <p className="text-sm text-destructive">{errors.force_message_body}</p>
          )}
        </div>
      </div>

      {/* Optional Update Message */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Optional Update Message</h3>
        <div className="space-y-2">
          <Label htmlFor="optional_message_title">Title *</Label>
          <Input
            id="optional_message_title"
            value={formData.optional_message_title}
            onChange={(e) =>
              setFormData({ ...formData, optional_message_title: e.target.value })
            }
            placeholder="New Version Available"
          />
          {errors.optional_message_title && (
            <p className="text-sm text-destructive">{errors.optional_message_title}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="optional_message_body">Body *</Label>
          <Textarea
            id="optional_message_body"
            value={formData.optional_message_body}
            onChange={(e) =>
              setFormData({ ...formData, optional_message_body: e.target.value })
            }
            rows={4}
            placeholder="We have added new features and performance improvements. Update now for the best experience."
          />
          {errors.optional_message_body && (
            <p className="text-sm text-destructive">{errors.optional_message_body}</p>
          )}
        </div>
      </div>

      {/* Advanced Options */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Advanced Options</h3>
        <div className="space-y-2">
          <Label htmlFor="rollout_percentage">Rollout Percentage (0-100)</Label>
          <Input
            id="rollout_percentage"
            type="number"
            min="0"
            max="100"
            value={formData.rollout_percentage || 100}
            onChange={(e) =>
              setFormData({
                ...formData,
                rollout_percentage: parseInt(e.target.value) || 100,
              })
            }
            placeholder="100"
          />
          {errors.rollout_percentage && (
            <p className="text-sm text-destructive">{errors.rollout_percentage}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Percentage of users to show optional update (0-100). Default: 100 (all users)
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is_active">Active</Label>
            <p className="text-sm text-muted-foreground">
              Only one active configuration per platform is allowed
            </p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </div>

      {/* Validation Error Alert */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the errors above before submitting
          </AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : appVersion ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

