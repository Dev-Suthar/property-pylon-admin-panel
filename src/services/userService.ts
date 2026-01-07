import { apiClient, handleApiError } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  age?: number;
  gender?: string;
  role: string;
  company_id: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: string;
  company_id: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  is_active?: boolean;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export const userService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    company_id?: string;
    role?: string;
    status?: string;
  }): Promise<UsersResponse> {
    try {
      const response = await apiClient.get<UsersResponse>('/admin/users', { params });
      return response.data;
    } catch (error) {
      console.warn('Admin users endpoint not available, using mock data');
      throw new Error(handleApiError(error));
    }
  },

  async getById(id: string): Promise<User> {
    try {
      const response = await apiClient.get<User>(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async create(data: CreateUserData): Promise<User> {
    try {
      const response = await apiClient.post<User>('/admin/users', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async update(id: string, data: UpdateUserData): Promise<User> {
    try {
      const response = await apiClient.put<User>(`/admin/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/users/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async resetPassword(id: string): Promise<void> {
    try {
      await apiClient.post(`/admin/users/${id}/reset-password`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

