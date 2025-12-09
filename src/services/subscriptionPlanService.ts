import { apiClient, handleApiError } from '@/lib/api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features?: string[];
  popular?: boolean;
  max_properties?: number;
  max_customers?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSubscriptionPlanData {
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features?: string[];
  popular?: boolean;
  max_properties?: number;
  max_customers?: number;
  is_active?: boolean;
}

export interface UpdateSubscriptionPlanData {
  name?: string;
  price?: number;
  period?: 'monthly' | 'yearly';
  features?: string[];
  popular?: boolean;
  max_properties?: number;
  max_customers?: number;
  is_active?: boolean;
}

export const subscriptionPlanService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<SubscriptionPlansResponse> {
    try {
      const response = await apiClient.get<SubscriptionPlansResponse>('/admin/subscription-plans', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getById(id: string): Promise<SubscriptionPlan> {
    try {
      const response = await apiClient.get<SubscriptionPlan>(`/admin/subscription-plans/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async create(data: CreateSubscriptionPlanData): Promise<SubscriptionPlan> {
    try {
      const response = await apiClient.post<SubscriptionPlan>('/admin/subscription-plans', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async update(id: string, data: UpdateSubscriptionPlanData): Promise<SubscriptionPlan> {
    try {
      const response = await apiClient.put<SubscriptionPlan>(`/admin/subscription-plans/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/subscription-plans/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

