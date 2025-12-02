import { apiClient, handleApiError } from '@/lib/api';
import { NotesResponse, Note } from './noteService';
import { ActivitiesResponse } from './activityService';

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  preferred_property_types?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  status: string;
  type?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_property_types?: string[];
  notes?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export const customerService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    company_id?: string;
    type?: string;
    is_hot_lead?: boolean | string;
    budget_min?: number;
    budget_max?: number;
  }): Promise<CustomersResponse> {
    try {
      const response = await apiClient.get<CustomersResponse>('/admin/customers', { params });
      return response.data;
    } catch (error) {
      console.warn('Admin customers endpoint not available, using mock data');
      throw new Error(handleApiError(error));
    }
  },

  async getById(id: string): Promise<Customer> {
    try {
      const response = await apiClient.get<Customer>(`/admin/customers/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async create(data: CreateCustomerData): Promise<Customer> {
    try {
      const response = await apiClient.post<Customer>('/admin/customers', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    try {
      const response = await apiClient.put<Customer>(`/admin/customers/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/customers/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Company-scoped operations
  async createForCompany(companyId: string, data: CreateCustomerData): Promise<Customer> {
    try {
      const response = await apiClient.post<Customer>(`/admin/companies/${companyId}/customers`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async updateForCompany(companyId: string, customerId: string, data: UpdateCustomerData): Promise<Customer> {
    try {
      const response = await apiClient.put<Customer>(`/admin/companies/${companyId}/customers/${customerId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async deleteForCompany(companyId: string, customerId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/companies/${companyId}/customers/${customerId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Extended Customer interface for detailed view
export interface CustomerDetails extends Customer {
  type?: 'buyer' | 'owner' | 'both';
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  is_hot_lead?: boolean;
  preferred_bhk?: string[];
  preferred_localities?: string;
  must_have_features?: string[];
  nice_to_have_features?: string[];
  selling_reason?: string;
  expected_price?: number;
  property_details?: string;
  urgency_level?: string;
  preferred_payment_terms?: string;
  documents_available?: string[];
  seller_bhk?: string;
  seller_area?: string;
  seller_location?: string;
  seller_property_type?: string;
  total_interactions?: number;
  last_contact?: string;
  Company?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface SuggestedProperty {
  property: {
    id: string;
    company_id: string;
    title: string;
    description?: string;
    property_type: string;
    status: string;
    price?: number;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    Company?: {
      id: string;
      name: string;
    };
  };
  match_score?: number;
  notes?: string;
  visit_status?: string;
  visit_date?: string;
  feedback?: string;
  suggested_at?: string;
}

export interface SuggestedPropertiesResponse {
  data: SuggestedProperty[];
  properties: SuggestedProperty[];
  total: number;
}

// Extended customer service methods
export const customerDetailsService = {
  async getById(id: string): Promise<CustomerDetails> {
    try {
      const response = await apiClient.get<CustomerDetails>(`/admin/customers/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getCustomerNotes(customerId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<NotesResponse> {
    try {
      const response = await apiClient.get<NotesResponse>(`/admin/customers/${customerId}/notes`, { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async createCustomerNote(customerId: string, data: {
    content: string;
    type: 'general' | 'issue' | 'positive';
    property_id?: string;
  }): Promise<Note> {
    try {
      const response = await apiClient.post<Note>(`/admin/customers/${customerId}/notes`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getCustomerActivities(customerId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ActivitiesResponse> {
    try {
      const response = await apiClient.get<ActivitiesResponse>(`/admin/customers/${customerId}/activities`, { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getCustomerSuggestedProperties(customerId: string): Promise<SuggestedPropertiesResponse> {
    try {
      const response = await apiClient.get<SuggestedPropertiesResponse>(`/admin/customers/${customerId}/suggested-properties`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

