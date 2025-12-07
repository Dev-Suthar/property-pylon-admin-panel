import { apiClient, handleApiError } from '@/lib/api';

// TypeScript interfaces for billing data
export interface CompanyUsage {
  id: string;
  period_start: string;
  period_end: string;
  api_requests: number;
  s3_storage_bytes: number;
  s3_storage_gb: string;
  s3_requests: number;
  ec2_cost: number;
  s3_cost: number;
  data_transfer_cost: number;
  total_cost: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CompanyUsageResponse {
  company_id: string;
  period: {
    start: string;
    end: string;
  };
  usage: CompanyUsage[];
}

export interface BillingReport {
  company: {
    id: string;
    name: string;
    email: string;
  };
  period: {
    start: string;
    end: string;
    month: string;
  };
  usage: {
    api_requests: number;
    s3_storage_bytes: number;
    s3_storage_gb: string;
    s3_requests: number;
  };
  costs: {
    ec2: number;
    s3: number;
    data_transfer: number;
    total: number;
  };
  breakdown: {
    api_requests_cost: number;
    s3_storage_cost: number;
    ec2_cost: number;
    data_transfer_cost: number;
  };
  metadata?: Record<string, any>;
  generated_at: string;
}

export interface CompanyBillingData {
  company: {
    id: string;
    name: string;
    email: string;
  };
  usage: {
    api_requests: number;
    s3_storage_bytes: number;
    s3_storage_gb: string;
    s3_requests: number;
  };
  costs: {
    ec2: number;
    s3: number;
    data_transfer: number;
    total: number;
  };
}

export interface AllCompaniesUsageReport {
  period: {
    start: string;
    end: string;
  };
  total_companies: number;
  total_api_requests: number;
  total_s3_storage_bytes: number;
  total_s3_storage_gb: string;
  total_costs: {
    ec2: number;
    s3: number;
    data_transfer: number;
    total: number;
  };
  companies: CompanyBillingData[];
  generated_at: string;
}

class BillingService {
  /**
   * Get all companies usage report (admin only)
   */
  async getAllCompaniesUsage(startDate?: string, endDate?: string): Promise<AllCompaniesUsageReport> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiClient.get<AllCompaniesUsageReport>(
        `/billing/reports${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get company usage data
   */
  async getCompanyUsage(
    companyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CompanyUsageResponse> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiClient.get<CompanyUsageResponse>(
        `/billing/usage/${companyId}${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get company billing report
   */
  async getCompanyBillingReport(companyId: string, period?: string): Promise<BillingReport> {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);

      const response = await apiClient.get<BillingReport>(
        `/billing/report/${companyId}${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const billingService = new BillingService();

