import { apiClient, handleApiError } from '@/lib/api';

export interface MediaItem {
  id: string;
  url: string;
  thumbnail_url?: string;
  type: string;
  order?: number;
}

export interface Property {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  property_type: string;
  status: string;
  pipeline_status?: string;
  buyer_id?: string;
  buyer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  price?: number;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  created_at: string;
  updated_at: string;
  // Owner information
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  // Additional property details
  features?: string[];
  nearby_places?: Array<{ name: string; distance?: string }>;
  possession?: string;
  visiting_days?: string[];
  visiting_start_time?: string;
  visiting_end_time?: string;
  visiting_notes?: string;
  // Media fields (optional, only in detailed view)
  images?: MediaItem[];
  videos?: MediaItem[];
  floor_plans?: MediaItem[];
  documents?: MediaItem[];
  media?: MediaItem[];
}

export interface PropertiesResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePropertyData {
  title: string;
  description?: string;
  property_type: string;
  status: string;
  pipeline_status?: string;
  buyer_id?: string | null;
  price?: number;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

export interface UpdatePropertyData extends Partial<CreatePropertyData> {}

export const propertyService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    property_type?: string;
    company_id?: string;
    price_min?: number;
    price_max?: number;
  }): Promise<PropertiesResponse> {
    try {
      const response = await apiClient.get<PropertiesResponse>('/admin/properties', { params });
      return response.data;
    } catch (error) {
      console.warn('Admin properties endpoint not available, using mock data');
      throw new Error(handleApiError(error));
    }
  },

  async getById(id: string): Promise<Property> {
    try {
      const response = await apiClient.get<Property>(`/admin/properties/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async create(data: CreatePropertyData): Promise<Property> {
    try {
      const response = await apiClient.post<Property>('/admin/properties', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async update(id: string, data: UpdatePropertyData): Promise<Property> {
    try {
      const response = await apiClient.put<Property>(`/admin/properties/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/properties/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Company-scoped operations
  async createForCompany(companyId: string, data: CreatePropertyData): Promise<Property> {
    try {
      const response = await apiClient.post<Property>(`/admin/companies/${companyId}/properties`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async updateForCompany(companyId: string, propertyId: string, data: UpdatePropertyData): Promise<Property> {
    try {
      const response = await apiClient.put<Property>(`/admin/companies/${companyId}/properties/${propertyId}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async deleteForCompany(companyId: string, propertyId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/companies/${companyId}/properties/${propertyId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

