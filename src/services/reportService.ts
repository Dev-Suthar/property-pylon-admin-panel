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

export interface ReportStats {
  total_reports: number;
  total_companies: number;
  total_properties: number;
  total_customers?: number;
  total_users?: number;
  total_active_subscriptions?: number;
  company_growth_percentage: number;
}

export interface ReportAnalytics {
  company_growth: Array<{ month: string; companies: number }>;
  revenue: Array<{ month: string; revenue: number }>;
  subscription_distribution: Array<{ name: string; value: number; color: string }>;
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

  async getStats(): Promise<ReportStats> {
    try {
      const response = await apiClient.get<ReportStats>('/admin/reports/stats');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getAnalytics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ReportAnalytics> {
    try {
      const response = await apiClient.get<ReportAnalytics>('/admin/reports/analytics', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async download(id: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<void> {
    try {
      // Validate ID format
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid report ID');
      }

      // Validate format
      if (format !== 'json' && format !== 'csv') {
        throw new Error('Invalid format. Supported formats: json, csv, pdf');
      }

      console.log(`[ReportService] Downloading report ${id} as ${format}`);

      if (format === 'csv' || format === 'pdf') {
        // For CSV and PDF, we need to get the blob response
        const response = await apiClient.get(`/admin/reports/${id}/download`, {
          params: { format },
          responseType: 'blob',
        });

        // Check response status
        if (response.status < 200 || response.status >= 300) {
          // Try to parse error from blob
          if (response.data instanceof Blob) {
            try {
              const text = await response.data.text();
              const errorData = JSON.parse(text);
              throw new Error(errorData.error?.message || 'Failed to download report');
            } catch (parseError) {
              throw new Error(`Download failed with status ${response.status}`);
            }
          }
          throw new Error(`Download failed with status ${response.status}`);
        }

        // Check if response is actually an error (blob might contain error JSON)
        if (response.data instanceof Blob) {
          // Check if it's an error response by checking content type
          if (response.data.type && response.data.type.includes('application/json')) {
            const text = await response.data.text();
            try {
              const errorData = JSON.parse(text);
              throw new Error(errorData.error?.message || 'Failed to download report');
            } catch (parseError) {
              throw new Error('Failed to download report');
            }
          }
        }
        
        // Create blob and download
        let blobType = format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;';
        const blob = response.data instanceof Blob 
          ? response.data 
          : new Blob([response.data], { type: blobType });
        
        console.log(`[ReportService] ${format.toUpperCase()} blob created, size: ${blob.size} bytes`);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${id}.${format}`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        console.log(`[ReportService] ${format.toUpperCase()} download triggered`);
        // Small delay to ensure download starts
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      } else {
        // For JSON, get the JSON response
        const response = await apiClient.get(`/admin/reports/${id}/download`, {
          params: { format: 'json' },
          responseType: 'json',
        });

        // Check response status
        if (response.status < 200 || response.status >= 300) {
          const errorMsg = response.data?.error?.message || `Download failed with status ${response.status}`;
          throw new Error(errorMsg);
        }

        // Check for error in response data
        if (response.data?.error) {
          throw new Error(response.data.error.message || 'Failed to download report');
        }
        
        // Download JSON
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
        console.log(`[ReportService] JSON blob created, size: ${blob.size} bytes`);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${id}.json`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        console.log(`[ReportService] JSON download triggered`);
        // Small delay to ensure download starts
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (error: any) {
      console.error('[ReportService] Download error:', error);
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Report not found');
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.error?.message || 'Invalid request');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later');
      } else if (error.message) {
        throw error;
      } else {
        throw new Error(handleApiError(error));
      }
    }
  },
};

