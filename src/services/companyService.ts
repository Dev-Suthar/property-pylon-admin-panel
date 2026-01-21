import { apiClient, handleApiError } from '@/lib/api';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  team_members?: number;
  years_of_experience?: number | string;
  office_photo_url?: string;
  created_by?: string;
  s3_bucket_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {
  is_active?: boolean;
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  limit: number;
}

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  age?: number;
  gender?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface CompanyUsersResponse {
  users: CompanyUser[];
  total: number;
  page: number;
  limit: number;
}

export interface CompanyDocument {
  id: string;
  url: string;
  thumbnail_url?: string;
  type: string;
  mime_type: string;
  size: number | string;
  document_type?: string;
  created_at: string;
}

export interface CompanyDetails extends Company {
  users?: CompanyUser[];
  propertiesCount?: number;
  customersCount?: number;
  documents?: CompanyDocument[];
  subscription?: {
    plan: string;
    status: string;
  };
}

export const companyService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<CompaniesResponse> {
    try {
      // Note: This endpoint might need to be created in the backend for admin access
      // For now, we'll use a mock response structure
      const response = await apiClient.get<CompaniesResponse>('/admin/companies', { params });
      return response.data;
    } catch (error) {
      // If admin endpoint doesn't exist, return mock data for now
      console.warn('Admin companies endpoint not available, using mock data');
      throw new Error(handleApiError(error));
    }
  },

  async getById(id: string): Promise<CompanyDetails> {
    try {
      const response = await apiClient.get<CompanyDetails>(`/admin/companies/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getUsers(companyId: string): Promise<CompanyUser[]> {
    try {
      const response = await apiClient.get<CompanyUsersResponse>(`/admin/companies/${companyId}/users`);
      // Backend now returns { users, total, page, limit }, extract users array
      return response.data.users || response.data as any;
    } catch (error) {
      console.warn('Company users endpoint not available, using mock data');
      throw new Error(handleApiError(error));
    }
  },

  async create(data: CreateCompanyData): Promise<Company> {
    try {
      const response = await apiClient.post<Company>('/admin/companies', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async update(id: string, data: UpdateCompanyData): Promise<Company> {
    try {
      const response = await apiClient.put<Company>(`/admin/companies/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/companies/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Company-scoped user operations
  async createUser(companyId: string, data: { name: string; email: string; password?: string; phone?: string; role: string }): Promise<CompanyUser> {
    try {
      const response = await apiClient.post<CompanyUser>(`/admin/companies/${companyId}/users`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async updateUser(companyId: string, userId: string, data: { name?: string; email?: string; phone?: string; role?: string; is_active?: boolean; password?: string }): Promise<CompanyUser> {
    try {
      const response = await apiClient.put<CompanyUser>(`/admin/companies/${companyId}/users/${userId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async deleteUser(companyId: string, userId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/companies/${companyId}/users/${userId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
