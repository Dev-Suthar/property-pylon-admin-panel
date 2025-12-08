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
  company_name: string;
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
    email: string | null;
  };
  period: {
    start: string;
    end: string;
    month: string;
  };
  usage: {
    api_requests: number;
    s3_storage_bytes: number;
    s3_storage_gb: number;
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
    email: string | null;
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
  period: {
    start: string;
    end: string;
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
  message?: string;
}

// CloudWatch Metrics Interfaces
export interface EC2Metrics {
  cpuUtilization: {
    average: number;
    max: number;
    min: number;
  };
  networkIn: {
    total: number;
    average: number;
  };
  networkOut: {
    total: number;
    average: number;
  };
  instanceCount: number;
  instances: Array<{
    instanceId: string;
    instanceType: string;
    state: string;
  }>;
  error?: string;
  errorMessage?: string;
  warning?: string[];
  warningMessage?: string;
}

export interface S3Metrics {
  requests: {
    get: number;
    put: number;
    delete: number;
    total: number;
  };
  bucketSize: {
    bytes: number;
    gb: number;
  };
  bucketName: string;
  error?: string;
  errorMessage?: string;
  warning?: string[];
  warningMessage?: string;
}

export interface CompanyCloudWatchMetrics {
  company: {
    id: string;
    name: string;
  };
  companyId: string;
  period: {
    start: string;
    end: string;
  };
  ec2: EC2Metrics;
  s3: S3Metrics;
  fetchedAt: string;
  error?: string;
  errors?: Array<{
    source: string;
    error: string;
    message: string;
  }>;
  warnings?: Array<{
    source: string;
    warnings: string[];
    message: string;
  }>;
}

export interface AllCompaniesCloudWatchMetrics {
  period: {
    start: string;
    end: string;
  };
  companies: Array<{
    company: {
      id: string;
      name: string;
    };
    companyId: string;
    period: {
      start: string;
      end: string;
    };
    ec2: EC2Metrics;
    s3: S3Metrics;
    fetchedAt: string;
    error?: string;
    errorMessage?: string;
    errors?: Array<{
      source: string;
      error: string;
      message: string;
    }>;
    warnings?: Array<{
      source: string;
      warnings: string[];
      message: string;
    }>;
  }>;
  generatedAt: string;
  summary?: {
    total: number;
    success: number;
    errors: number;
  };
  warning?: string;
  message?: string;
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

  /**
   * Get CloudWatch metrics for a company
   */
  async getCompanyCloudWatchMetrics(
    companyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CompanyCloudWatchMetrics> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiClient.get<CompanyCloudWatchMetrics>(
        `/billing/metrics/${companyId}${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get CloudWatch metrics for all companies (admin only)
   */
  async getAllCompaniesCloudWatchMetrics(
    startDate?: string,
    endDate?: string
  ): Promise<AllCompaniesCloudWatchMetrics> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiClient.get<AllCompaniesCloudWatchMetrics>(
        `/billing/metrics${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export const billingService = new BillingService();

