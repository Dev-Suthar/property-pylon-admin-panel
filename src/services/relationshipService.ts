import { apiClient, handleApiError } from '@/lib/api';

export interface SuggestedCustomer {
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    type?: string;
    status?: string;
    area?: string;
    city?: string;
  };
  match_score?: number;
  notes?: string;
  added_at?: string;
}

export interface SuggestedCustomersResponse {
  data: SuggestedCustomer[];
  customers: SuggestedCustomer[];
  total?: number;
}

export const relationshipService = {
  async getPropertySuggestedCustomers(propertyId: string, params?: {
    include_suggested?: string;
  }): Promise<SuggestedCustomersResponse> {
    try {
      const response = await apiClient.get<SuggestedCustomersResponse>(
        `/admin/properties/${propertyId}/suggested-customers`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

