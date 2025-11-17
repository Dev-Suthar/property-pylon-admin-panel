import { apiClient, handleApiError } from '@/lib/api';

export interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  start_date: string;
  end_date?: string;
  price: number;
  billing_cycle: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSubscriptionData {
  company_id: string;
  plan_id: string;
  billing_cycle: string;
}

export interface UpdateSubscriptionData {
  status?: string;
  plan_id?: string;
  billing_cycle?: string;
}

export const subscriptionService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    company_id?: string;
  }): Promise<SubscriptionsResponse> {
    try {
      const response = await apiClient.get<SubscriptionsResponse>('/admin/subscriptions', { params });
      return response.data;
    } catch (error) {
      console.warn('Admin subscriptions endpoint not available, using mock data');
      throw new Error(handleApiError(error));
    }
  },

  async getById(id: string): Promise<Subscription> {
    try {
      const response = await apiClient.get<Subscription>(`/admin/subscriptions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async create(data: CreateSubscriptionData): Promise<Subscription> {
    try {
      const response = await apiClient.post<Subscription>('/admin/subscriptions', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async update(id: string, data: UpdateSubscriptionData): Promise<Subscription> {
    try {
      const response = await apiClient.put<Subscription>(`/admin/subscriptions/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async cancel(id: string): Promise<void> {
    try {
      await apiClient.post(`/admin/subscriptions/${id}/cancel`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

