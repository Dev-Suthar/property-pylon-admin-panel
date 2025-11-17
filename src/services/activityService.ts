import { apiClient, handleApiError } from '@/lib/api';

export interface Activity {
  id: string;
  company_id?: string;
  property_id?: string;
  customer_id?: string;
  type?: 'call' | 'visit' | 'whatsapp' | 'note';
  activity_type?: string; // For Activity page compatibility
  entity_type?: string; // For Activity page compatibility
  entity_id?: string; // For Activity page compatibility
  description: string;
  date?: string;
  created_by?: string;
  user_id?: string; // For Activity page compatibility
  user_name?: string; // For Activity page compatibility
  created_at: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ActivitiesResponse {
  data?: Activity[];
  activities?: Activity[]; // For compatibility
  total: number;
  page: number;
  limit: number;
}

export const activityService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    activity_type?: string;
    entity_type?: string;
    company_id?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ActivitiesResponse> {
    try {
      const response = await apiClient.get<ActivitiesResponse>('/admin/activities', { params });
      return response.data;
    } catch (error) {
      console.warn('Admin activities endpoint not available, using mock data');
      throw new Error(handleApiError(error));
    }
  },

  async getPropertyActivities(propertyId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<ActivitiesResponse> {
    try {
      const response = await apiClient.get<ActivitiesResponse>(`/admin/properties/${propertyId}/activities`, { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
