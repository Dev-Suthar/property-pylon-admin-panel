import { apiClient, handleApiError } from '@/lib/api';

export interface AppVersion {
  id: string;
  platform: 'android' | 'ios';
  min_supported_version: string;
  min_supported_build: number;
  latest_version: string;
  latest_build: number;
  store_url: string;
  force_message_title: string;
  force_message_body: string;
  optional_message_title: string;
  optional_message_body: string;
  is_active: boolean;
  rollout_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface AppVersionsResponse {
  app_versions: AppVersion[];
}

export interface CreateAppVersionData {
  platform: 'android' | 'ios';
  min_supported_version: string;
  min_supported_build: number;
  latest_version: string;
  latest_build: number;
  store_url: string;
  force_message_title?: string;
  force_message_body?: string;
  optional_message_title?: string;
  optional_message_body?: string;
  is_active?: boolean;
  rollout_percentage?: number;
}

export interface UpdateAppVersionData extends Partial<CreateAppVersionData> {}

export const appVersionService = {
  async getAppVersions(params?: {
    platform?: 'android' | 'ios';
    is_active?: boolean;
  }): Promise<AppVersion[]> {
    try {
      const response = await apiClient.get<AppVersionsResponse>('/admin/app-versions', { params });
      return response.data.app_versions;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getAppVersionById(id: string): Promise<AppVersion> {
    try {
      const response = await apiClient.get<{ app_version: AppVersion }>(`/admin/app-versions/${id}`);
      return response.data.app_version;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async createAppVersion(data: CreateAppVersionData): Promise<AppVersion> {
    try {
      const response = await apiClient.post<{ app_version: AppVersion }>('/admin/app-versions', data);
      return response.data.app_version;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async updateAppVersion(id: string, data: UpdateAppVersionData): Promise<AppVersion> {
    try {
      const response = await apiClient.put<{ app_version: AppVersion }>(`/admin/app-versions/${id}`, data);
      return response.data.app_version;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async deleteAppVersion(id: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/admin/app-versions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

