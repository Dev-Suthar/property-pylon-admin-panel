import { apiClient, handleApiError } from '@/lib/api';

export interface ReportData {
  id: string;
  report_type: string;
  title: string;
  data: Record<string, any>;
  generated_at: string;
  generated_by: string;
}

export interface ReportsResponse {
  reports: ReportData[];
  total: number;
  page: number;
  limit: number;
}

export interface GenerateReportParams {
  report_type: string;
  start_date?: string;
  end_date?: string;
  company_id?: string;
  filters?: Record<string, any>;
}

export const reportService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    report_type?: string;
  }): Promise<ReportsResponse> {
    try {
      const response = await apiClient.get<ReportsResponse>('/admin/reports', { params });
      return response.data;
    } catch (error) {
      console.warn('Admin reports endpoint not available, using mock data');
      throw new Error(handleApiError(error));
    }
  },

  async generate(params: GenerateReportParams): Promise<ReportData> {
    try {
      const response = await apiClient.post<ReportData>('/admin/reports/generate', params);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getById(id: string): Promise<ReportData> {
    try {
      const response = await apiClient.get<ReportData>(`/admin/reports/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

