import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DollarSign,
  Database,
  Activity,
  TrendingUp,
  AlertCircle,
  Eye,
  Download,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  billingService,
  AllCompaniesUsageReport,
  CompanyBillingData,
  AllCompaniesCloudWatchMetrics,
  CompanyCloudWatchMetrics,
} from '@/services/billingService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cpu, Network, Server, HardDrive } from 'lucide-react';

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format storage
const formatStorage = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format number with commas
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Get date range for period
const getDateRange = (period: string): { start: string; end: string } => {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);

  switch (period) {
    case 'current':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'last3':
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last6':
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

export function Billing() {
  const [period, setPeriod] = useState<string>('current');
  const [selectedCompany, setSelectedCompany] = useState<CompanyBillingData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('billing');

  const dateRange = useMemo(() => getDateRange(period), [period]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['billing', 'all-companies', dateRange.start, dateRange.end],
    queryFn: () => billingService.getAllCompaniesUsage(dateRange.start, dateRange.end),
    retry: false,
  });

  const {
    data: cloudWatchData,
    isLoading: isCloudWatchLoading,
    error: cloudWatchError,
    refetch: refetchCloudWatch,
  } = useQuery({
    queryKey: ['cloudwatch', 'all-companies', dateRange.start, dateRange.end],
    queryFn: () => billingService.getAllCompaniesCloudWatchMetrics(dateRange.start, dateRange.end),
    retry: false,
    enabled: activeTab === 'metrics', // Only fetch when metrics tab is active
  });

  const report = data || ({} as AllCompaniesUsageReport);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!report.companies || report.companies.length === 0) {
      return {
        totalCost: 0,
        totalStorage: 0,
        totalRequests: 0,
        averageCost: 0,
        companyCount: 0,
      };
    }

    const totalCost = report.total_costs?.total || 0;
    const totalStorage = report.total_s3_storage_bytes || 0;
    const totalRequests = report.total_api_requests || 0;
    const companyCount = report.companies.length;
    const averageCost = companyCount > 0 ? totalCost / companyCount : 0;

    return {
      totalCost,
      totalStorage,
      totalRequests,
      averageCost,
      companyCount,
    };
  }, [report]);

  // Prepare chart data
  const costsByCompanyData = useMemo(() => {
    if (!report.companies) return [];
    return report.companies
      .map((company) => ({
        name: company.company.name.length > 15 
          ? company.company.name.substring(0, 15) + '...' 
          : company.company.name,
        fullName: company.company.name,
        cost: company.costs.total,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10); // Top 10 companies
  }, [report.companies]);

  const costBreakdownData = useMemo(() => {
    if (!report.total_costs) return [];
    return [
      { name: 'EC2', value: report.total_costs.ec2, color: '#3b82f6' },
      { name: 'S3', value: report.total_costs.s3, color: '#10b981' },
      { name: 'Data Transfer', value: report.total_costs.data_transfer, color: '#f59e0b' },
    ].filter((item) => item.value > 0);
  }, [report.total_costs]);

  const storageByCompanyData = useMemo(() => {
    if (!report.companies) return [];
    return report.companies
      .map((company) => ({
        name: company.company.name.length > 15 
          ? company.company.name.substring(0, 15) + '...' 
          : company.company.name,
        fullName: company.company.name,
        storage: parseFloat(company.usage.s3_storage_gb) || 0,
      }))
      .sort((a, b) => b.storage - a.storage)
      .slice(0, 10); // Top 10 companies
  }, [report.companies]);

  const handleViewDetails = (company: CompanyBillingData) => {
    setSelectedCompany(company);
    setIsDetailsOpen(true);
  };

  const handleExportCSV = () => {
    if (!report.companies) return;

    const headers = [
      'Company Name',
      'Company Email',
      'API Requests',
      'S3 Storage (GB)',
      'EC2 Cost ($)',
      'S3 Cost ($)',
      'Data Transfer Cost ($)',
      'Total Cost ($)',
    ];

    const rows = report.companies.map((company) => [
      company.company.name,
      company.company.email || 'N/A',
      formatNumber(company.usage.api_requests),
      company.usage.s3_storage_gb,
      formatCurrency(company.costs.ec2),
      formatCurrency(company.costs.s3),
      formatCurrency(company.costs.data_transfer),
      formatCurrency(company.costs.total),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-report-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statsCards = [
    {
      title: 'Total AWS Costs',
      value: formatCurrency(summaryStats.totalCost),
      icon: DollarSign,
      change: '+0%',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Total S3 Storage',
      value: formatStorage(summaryStats.totalStorage),
      icon: Database,
      change: '+0%',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Total API Requests',
      value: formatNumber(summaryStats.totalRequests),
      icon: Activity,
      change: '+0%',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Average Cost per Company',
      value: formatCurrency(summaryStats.averageCost),
      icon: TrendingUp,
      change: '+0%',
      gradient: 'from-orange-500 to-amber-500',
    },
  ];

  const cloudWatchMetrics = cloudWatchData || ({} as AllCompaniesCloudWatchMetrics);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Cost Tracking & Metrics
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            AWS resource usage, costs, and CloudWatch metrics per company
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="last">Last Month</SelectItem>
              <SelectItem value="last3">Last 3 Months</SelectItem>
              <SelectItem value="last6">Last 6 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          {activeTab === 'billing' && report.companies && report.companies.length > 0 && (
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="billing">Billing & Usage</TabsTrigger>
          <TabsTrigger value="metrics">CloudWatch Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-8 mt-6">

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load billing data. {error instanceof Error ? error.message : 'Unknown error'}
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && report.message && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{report.message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200 mb-2" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.title}
                  className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      <span className="font-medium text-green-600">{stat.change}</span>
                      <span>from last period</span>
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Costs by Company (Top 10)
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Total AWS costs per company
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {costsByCompanyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={costsByCompanyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="cost" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Cost Breakdown by Service
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Distribution of costs across AWS services
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {costBreakdownData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={costBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {costBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="text-lg font-semibold text-slate-900">
                S3 Storage Usage by Company (Top 10)
              </CardTitle>
              <CardDescription className="text-slate-600">
                S3 storage consumption per company
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {storageByCompanyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={storageByCompanyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: number) => `${value.toFixed(2)} GB`}
                    />
                    <Legend />
                    <Bar dataKey="storage" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Companies Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Company Cost Breakdown</CardTitle>
              <CardDescription>
                Detailed AWS usage and costs for all companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.companies && report.companies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>API Requests</TableHead>
                      <TableHead>S3 Storage (GB)</TableHead>
                      <TableHead>EC2 Cost</TableHead>
                      <TableHead>S3 Cost</TableHead>
                      <TableHead>Data Transfer Cost</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.companies.map((company) => (
                      <TableRow key={company.company.id}>
                        <TableCell className="font-medium">
                          {company.company.name}
                        </TableCell>
                        <TableCell>{formatNumber(company.usage.api_requests)}</TableCell>
                        <TableCell>{company.usage.s3_storage_gb}</TableCell>
                        <TableCell>{formatCurrency(company.costs.ec2)}</TableCell>
                        <TableCell>{formatCurrency(company.costs.s3)}</TableCell>
                        <TableCell>{formatCurrency(company.costs.data_transfer)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(company.costs.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(company)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No billing data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-8 mt-6">
          {cloudWatchError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load CloudWatch metrics. {cloudWatchError instanceof Error ? cloudWatchError.message : 'Unknown error'}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={() => refetchCloudWatch()}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isCloudWatchLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-16 animate-pulse rounded bg-gray-200 mb-2" />
                    <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* CloudWatch Summary Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">
                      Total EC2 Instances
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                      <Server className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {cloudWatchMetrics.companies?.reduce((sum, c) => sum + (c.ec2?.instanceCount || 0), 0) || 0}
                    </div>
                    <p className="text-xs text-slate-500">Active EC2 instances across all companies</p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">
                      Avg CPU Utilization
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                      <Cpu className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {cloudWatchMetrics.companies && cloudWatchMetrics.companies.length > 0
                        ? `${(
                            cloudWatchMetrics.companies
                              .filter(c => c.ec2 && !c.error)
                              .reduce((sum, c) => sum + (c.ec2?.cpuUtilization?.average || 0), 0) /
                            cloudWatchMetrics.companies.filter(c => c.ec2 && !c.error).length
                          ).toFixed(1)}%`
                        : '0%'}
                    </div>
                    <p className="text-xs text-slate-500">Average across all EC2 instances</p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">
                      Total S3 Requests
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                      <HardDrive className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {formatNumber(
                        cloudWatchMetrics.companies?.reduce((sum, c) => sum + (c.s3?.requests?.total || 0), 0) || 0
                      )}
                    </div>
                    <p className="text-xs text-slate-500">GET, PUT, DELETE requests</p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 opacity-5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">
                      Network Traffic
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
                      <Network className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {formatStorage(
                        cloudWatchMetrics.companies?.reduce(
                          (sum, c) => sum + (c.ec2?.networkIn?.total || 0) + (c.ec2?.networkOut?.total || 0),
                          0
                        ) || 0
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Total in/out across all instances</p>
                  </CardContent>
                </Card>
              </div>

              {/* CloudWatch Metrics Table */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>CloudWatch Metrics by Company</CardTitle>
                  <CardDescription>
                    Real-time AWS resource metrics from CloudWatch
                    {cloudWatchMetrics.summary && (
                      <span className="ml-2 text-xs">
                        ({cloudWatchMetrics.summary.success} successful, {cloudWatchMetrics.summary.errors} errors)
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cloudWatchMetrics.warning && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{cloudWatchMetrics.warning}</AlertDescription>
                    </Alert>
                  )}
                  
                  {cloudWatchMetrics.companies && cloudWatchMetrics.companies.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company Name</TableHead>
                          <TableHead>EC2 Instances</TableHead>
                          <TableHead>CPU Avg (%)</TableHead>
                          <TableHead>S3 Requests</TableHead>
                          <TableHead>Network In</TableHead>
                          <TableHead>Network Out</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cloudWatchMetrics.companies.map((company) => (
                          <TableRow key={company.company.id}>
                            <TableCell className="font-medium">
                              {company.company.name}
                            </TableCell>
                            <TableCell>
                              {company.error ? (
                                <span className="text-slate-400">N/A</span>
                              ) : (
                                company.ec2?.instanceCount || 0
                              )}
                            </TableCell>
                            <TableCell>
                              {company.error ? (
                                <span className="text-slate-400">N/A</span>
                              ) : (
                                `${company.ec2?.cpuUtilization?.average?.toFixed(1) || '0.0'}%`
                              )}
                            </TableCell>
                            <TableCell>
                              {company.error ? (
                                <span className="text-slate-400">N/A</span>
                              ) : (
                                formatNumber(company.s3?.requests?.total || 0)
                              )}
                            </TableCell>
                            <TableCell>
                              {company.error ? (
                                <span className="text-slate-400">N/A</span>
                              ) : (
                                formatStorage(company.ec2?.networkIn?.total || 0)
                              )}
                            </TableCell>
                            <TableCell>
                              {company.error ? (
                                <span className="text-slate-400">N/A</span>
                              ) : (
                                formatStorage(company.ec2?.networkOut?.total || 0)
                              )}
                            </TableCell>
                            <TableCell>
                              {company.error ? (
                                <Badge variant="destructive" className="text-xs">
                                  {company.error === 'AWS_CREDENTIALS_ERROR' ? 'Credentials Error' :
                                   company.error === 'AWS_PERMISSION_DENIED' ? 'Permission Denied' :
                                   company.error === 'THROTTLING' ? 'Rate Limited' :
                                   'Error'}
                                </Badge>
                              ) : company.ec2?.warning || company.s3?.warning ? (
                                <Badge variant="outline" className="text-xs">
                                  Warning
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  OK
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      {isCloudWatchLoading
                        ? 'Loading CloudWatch metrics...'
                        : cloudWatchError
                        ? 'Failed to load CloudWatch metrics. Please check AWS configuration.'
                        : 'No CloudWatch metrics available for the selected period'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Company Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Billing Details</DialogTitle>
            <DialogDescription>
              Detailed AWS usage and cost breakdown for {selectedCompany?.company.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Company Information</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Name:</span> {selectedCompany.company.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {selectedCompany.company.email || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Usage Metrics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">API Requests:</span>{' '}
                    {formatNumber(selectedCompany.usage.api_requests)}
                  </div>
                  <div>
                    <span className="font-medium">S3 Storage:</span>{' '}
                    {selectedCompany.usage.s3_storage_gb} GB
                  </div>
                  <div>
                    <span className="font-medium">S3 Requests:</span>{' '}
                    {formatNumber(selectedCompany.usage.s3_requests)}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cost Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>EC2 Costs:</span>
                    <span className="font-medium">{formatCurrency(selectedCompany.costs.ec2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>S3 Costs:</span>
                    <span className="font-medium">{formatCurrency(selectedCompany.costs.s3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Transfer Costs:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedCompany.costs.data_transfer)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Cost:</span>
                    <span>{formatCurrency(selectedCompany.costs.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

