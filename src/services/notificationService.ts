import { apiClient, handleApiError } from '@/lib/api';

export interface NotificationStats {
  total_users: number;
  users_with_tokens: number;
  upcoming_reminders: number;
  reminders_sent_today: number;
}

export interface UpcomingReminder {
  visit_id: string;
  property_title: string;
  customer_name: string;
  date: string;
  time: string;
  assigned_to: string;
  assigned_user_name: string;
  reminder_sent: boolean;
  status: string;
}

export interface NotificationHistoryItem {
  id: string;
  company_id: string;
  user_id: string;
  type: 'property' | 'visit' | 'customer' | 'deal' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  action: Record<string, any>;
  created_at: string;
  User?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NotificationHistoryResponse {
  notifications: NotificationHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface UserWithToken {
  id: string;
  name: string;
  email: string;
  phone?: string;
  fcm_token_preview?: string;
  is_active: boolean;
  updated_at: string;
  Role?: {
    id: string;
    name: string;
  };
}

export interface UsersWithTokensResponse {
  users: UserWithToken[];
  total: number;
  page: number;
  limit: number;
}

export interface DeepLinkPayload {
  screen: 'propertyDetails' | 'customerDetails' | 'visitDetails' | 'dashboard' | 'custom';
  property_id?: string;
  customer_id?: string;
  visit_id?: string;
  extra?: Record<string, string>;
}

export interface SendCustomNotificationData {
  company_id: string;
  title: string;
  body: string;
  type?: 'property' | 'visit' | 'customer' | 'deal' | 'reminder' | 'system';
  target_users: 'all' | 'specific' | 'role';
  user_ids?: string[];
  role?: string;
  deep_link?: DeepLinkPayload;
  template_id?: string;
  variables?: Record<string, string>;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  stats: {
    total_targeted: number;
    total_sent: number;
    total_failed: number;
    users_notified: number;
  };
}

export interface SendTestNotificationData {
  company_id: string;
  user_id: string;
}

export interface NotificationSchedulePayload extends SendCustomNotificationData {
  scheduled_for: string;
}

export interface NotificationSchedule {
  id: string;
  company_id: string;
  created_by: string;
  payload: SendCustomNotificationData;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  error?: string | null;
  created_at: string;
  updated_at: string;
  sent_at?: string | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NotificationScheduleResponse {
  schedules: NotificationSchedule[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationTemplate {
  id: string;
  company_id: string | null;
  name: string;
  description?: string | null;
  type: NotificationHistoryItem['type'];
  title: string;
  body: string;
  variables: string[];
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export const notificationService = {
  async getStats(companyId?: string): Promise<NotificationStats> {
    try {
      const params = companyId ? { company_id: companyId } : {};
      const response = await apiClient.get<NotificationStats>('/admin/push-notifications/stats', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getUpcomingReminders(companyId?: string): Promise<UpcomingReminder[]> {
    try {
      const params = companyId ? { company_id: companyId } : {};
      const response = await apiClient.get<UpcomingReminder[]>('/admin/push-notifications/upcoming-reminders', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getNotificationHistory(
    companyId: string,
    filters?: {
      page?: number;
      limit?: number;
      type?: string;
      read?: boolean;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<NotificationHistoryResponse> {
    try {
      const params = {
        company_id: companyId,
        ...filters,
      };
      const response = await apiClient.get<NotificationHistoryResponse>('/admin/push-notifications/history', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getUsersWithTokens(
    companyId: string,
    filters?: {
      page?: number;
      limit?: number;
      has_token?: boolean;
    }
  ): Promise<UsersWithTokensResponse> {
    try {
      const params = filters || {};
      const response = await apiClient.get<UsersWithTokensResponse>(
        `/admin/push-notifications/users/${companyId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async sendCustomNotification(data: SendCustomNotificationData): Promise<SendNotificationResponse> {
    try {
      const response = await apiClient.post<SendNotificationResponse>('/admin/push-notifications/send', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async sendTestNotification(data: SendTestNotificationData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/admin/push-notifications/test', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async createSchedule(data: NotificationSchedulePayload): Promise<NotificationSchedule> {
    try {
      const response = await apiClient.post<NotificationSchedule>('/admin/push-notifications/schedules', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getSchedules(params?: {
    company_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationScheduleResponse> {
    try {
      const response = await apiClient.get<NotificationScheduleResponse>(
        '/admin/push-notifications/schedules',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async cancelSchedule(id: string): Promise<{ success: boolean; schedule: NotificationSchedule }> {
    try {
      const response = await apiClient.delete<{ success: boolean; schedule: NotificationSchedule }>(
        `/admin/push-notifications/schedules/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getTemplates(params?: { company_id?: string }): Promise<NotificationTemplate[]> {
    try {
      const response = await apiClient.get<NotificationTemplate[]>(
        '/admin/notification-templates',
        { params },
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async createTemplate(data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const response = await apiClient.post<NotificationTemplate>(
        '/admin/notification-templates',
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async updateTemplate(
    id: string,
    data: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    try {
      const response = await apiClient.put<NotificationTemplate>(
        `/admin/notification-templates/${id}`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `/admin/notification-templates/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

