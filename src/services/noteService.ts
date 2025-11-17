import { apiClient, handleApiError } from '@/lib/api';

export interface Note {
  id: string;
  property_id?: string;
  customer_id?: string;
  content: string;
  type: 'general' | 'issue' | 'positive';
  attachments?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  Customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface NotesResponse {
  data: Note[];
  total: number;
  page: number;
  limit: number;
}

export const noteService = {
  async getPropertyNotes(propertyId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<NotesResponse> {
    try {
      const response = await apiClient.get<NotesResponse>(`/admin/properties/${propertyId}/notes`, { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

