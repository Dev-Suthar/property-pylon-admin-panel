import { apiClient, handleApiError } from '@/lib/api';
import { Company } from './companyService';

export interface Salesman {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  company_id: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  companies_count?: number;
  password?: string; // Plain password (only available immediately after creation)
}

export interface CreateSalesmanData {
  name: string;
  email: string;
  password: string; // Required - salesman will use this to login
  phone?: string;
}

export interface UpdateSalesmanData extends Partial<CreateSalesmanData> {
  is_active?: boolean;
}

export interface SalesmenResponse {
  salesmen: Salesman[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesmanDetails extends Salesman {
  companies?: Company[];
  companies_count?: number;
}

export const salesmanService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<SalesmenResponse> {
    try {
      const response = await apiClient.get<SalesmenResponse>('/admin/salesmen', { params });
      return response.data;
    } catch (error) {
      console.warn('Admin salesmen endpoint not available, using mock data');
      throw new Error(handleApiError(error));
    }
  },

  async getById(id: string): Promise<SalesmanDetails> {
    try {
      const response = await apiClient.get<SalesmanDetails>(`/admin/salesmen/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async create(data: CreateSalesmanData): Promise<Salesman> {
    try {
      const response = await apiClient.post<Salesman>('/admin/salesmen', data);
      return response.data;
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  async update(id: string, data: UpdateSalesmanData): Promise<Salesman> {
    try {
      const response = await apiClient.put<Salesman>(`/admin/salesmen/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/salesmen/${id}`);
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  async getCompanies(salesmanId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ companies: Company[]; total: number; page: number; limit: number }> {
    try {
      const response = await apiClient.get<{ companies: Company[]; total: number; page: number; limit: number }>(
        `/admin/salesmen/${salesmanId}/companies`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

