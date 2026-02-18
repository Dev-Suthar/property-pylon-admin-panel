import { apiClient, handleApiError } from "@/lib/api";

export interface DashboardStats {
  totalCompanies: number;
  totalUsers: number;
  totalProperties: number;
  totalCustomers: number;
  activeSubscriptions: number;
  total_properties_for_sale?: number;
  total_properties_for_rent?: number;
  total_buyer_requirements_sale?: number;
  total_buyer_requirements_rent?: number;
  expiring_agreements_count?: number;
  active_rentals_count?: number;
  revenue: {
    mrr: number;
    arr: number;
  };
}

export interface CompanyGrowthData {
  month: string;
  companies: number;
}

export interface SubscriptionDistribution {
  name: string;
  value: number;
  color?: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  subscription_revenue?: number;
  commission_revenue?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  companyGrowth: CompanyGrowthData[];
  subscriptionDistribution: SubscriptionDistribution[];
  revenue: RevenueData[];
}

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await apiClient.get<DashboardData>("/admin/dashboard");
      return response.data;
    } catch (error) {
      console.warn("Admin dashboard endpoint not available, using mock data");
      throw new Error(handleApiError(error));
    }
  },
};
