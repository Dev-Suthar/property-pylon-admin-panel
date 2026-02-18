import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Plus,
  AlertCircle,
  TrendingUp,
  Building2,
  Home,
  Loader2,
} from "lucide-react";
import { reportService } from "@/services/reportService";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function Reports() {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("company_growth");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reports list
  const { data: reportsData, error: reportsError, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ["reports"],
    queryFn: () => reportService.getAll({ page: 1, limit: 10 }),
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch stats
  const { data: stats, error: statsError, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["report-stats"],
    queryFn: () => reportService.getStats(),
    retry: 2,
    retryDelay: 1000,
    staleTime: 60000, // Stats can be cached longer
  });

  // Fetch analytics
  const { data: analytics, error: analyticsError, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ["report-analytics"],
    queryFn: () => reportService.getAnalytics(),
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
  });

  const generateMutation = useMutation({
    mutationFn: (params: { report_type: string }) =>
      reportService.generate({ report_type: params.report_type }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
      setIsGenerateDialogOpen(false);
      setReportType("company_growth"); // Reset to default
      // Refetch reports and stats
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["report-stats"] });
      queryClient.invalidateQueries({ queryKey: ["report-analytics"] });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to generate report. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  const downloadMutation = useMutation({
    mutationFn: ({ id, format }: { id: string; format: 'json' | 'csv' | 'pdf' }) => {
      setDownloadingReportId(id);
      return reportService.download(id, format);
    },
    onSuccess: (_, variables) => {
      setDownloadingReportId(null);
      toast({
        title: "Success",
        description: `Report downloaded as ${variables.format.toUpperCase()}`,
      });
    },
    onError: (error: Error) => {
      setDownloadingReportId(null);
      const errorMessage = error.message || "Failed to download report. Please try again.";
      toast({
        title: "Download Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const reports = reportsData?.reports || [];
  const companyGrowthData = analytics?.company_growth || [];
  const revenueData = analytics?.revenue || [];
  const subscriptionDistribution = analytics?.subscription_distribution || [];

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Reports Data:', reportsData);
    console.log('Stats:', stats);
    console.log('Analytics:', analytics);
    console.log('Company Growth Data:', companyGrowthData);
    console.log('Revenue Data:', revenueData);
    console.log('Subscription Distribution:', subscriptionDistribution);
  }

  const handleGenerate = () => {
    generateMutation.mutate({ report_type: reportType });
  };

  const handleDownload = (reportId: string, format: 'json' | 'csv' | 'pdf' = 'json') => {
    downloadMutation.mutate({ id: reportId, format });
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Unknown";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    } catch (error) {
      return "Invalid Date";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and view system reports
          </p>
        </div>
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Select the type of report you want to generate
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="report_type">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="report_type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_growth">Company Growth</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="subscription_distribution">
                      Subscription Distribution
                    </SelectItem>
                    <SelectItem value="user_activity">User Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGenerateDialogOpen(false)}
                disabled={generateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? "Generating..." : "Generate Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {(reportsError || statsError || analyticsError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              {reportsError && <div>Error loading reports: {reportsError.message || "Unknown error"}</div>}
              {statsError && <div>Error loading stats: {statsError.message || "Unknown error"}</div>}
              {analyticsError && <div>Error loading analytics: {analyticsError.message || "Unknown error"}</div>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (reportsError) refetchReports();
                if (statsError) refetchStats();
                if (analyticsError) refetchAnalytics();
              }}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : stats ? (
                stats.total_reports
              ) : statsError ? (
                <span className="text-muted-foreground text-sm">Error</span>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </div>
            {statsError && (
              <p className="text-xs text-muted-foreground mt-1">Unable to load stats</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : stats ? (
                stats.company_growth_percentage >= 0 ? `+${stats.company_growth_percentage.toFixed(1)}%` : `${stats.company_growth_percentage.toFixed(1)}%`
              ) : statsError ? (
                <span className="text-muted-foreground text-sm">Error</span>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </div>
            {statsError && (
              <p className="text-xs text-muted-foreground mt-1">Unable to load growth</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : stats ? (
                stats.total_companies
              ) : statsError ? (
                <span className="text-muted-foreground text-sm">Error</span>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </div>
            {statsError && (
              <p className="text-xs text-muted-foreground mt-1">Unable to load count</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : stats ? (
                stats.total_properties.toLocaleString()
              ) : statsError ? (
                <span className="text-muted-foreground text-sm">Error</span>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </div>
            {statsError && (
              <p className="text-xs text-muted-foreground mt-1">Unable to load count</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Growth</CardTitle>
            <CardDescription>New companies registered over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading || !companyGrowthData.length ? (
              <div className="flex items-center justify-center h-[300px]">
                {analyticsLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={companyGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="companies"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
            <CardDescription>Companies by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading || !subscriptionDistribution.length ? (
              <div className="flex items-center justify-center h-[300px]">
                {analyticsLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-muted-foreground">No data available</p>
                )}
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                    data={subscriptionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                    {subscriptionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly recurring revenue (MRR)</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsLoading || !revenueData.length ? (
            <div className="flex items-center justify-center h-[300px]">
              {analyticsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="subscription_revenue" name="Subscriptions" stackId="a" fill="#8884d8" />
                <Bar dataKey="commission_revenue" name="Commissions" stackId="a" fill="#82ca9d" />
              </BarChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>View and download previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportsError ? (
            <div className="text-center py-8">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load reports: {reportsError.message || "Unknown error"}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchReports()}
                    className="ml-4"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports generated yet</p>
              <p className="text-sm mt-2">Click "Generate Report" to create your first report</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Generated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {report.report_type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.generated_by}</TableCell>
                    <TableCell>{formatDate(report.generated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(report.id, 'json')}
                          disabled={downloadMutation.isPending && downloadingReportId === report.id}
                          title="Download as JSON"
                        >
                          {downloadMutation.isPending && downloadingReportId === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                        <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(report.id, 'csv')}
                          disabled={downloadMutation.isPending && downloadingReportId === report.id}
                          title="Download as CSV"
                        >
                          {downloadMutation.isPending && downloadingReportId === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(report.id, 'pdf')}
                          disabled={downloadMutation.isPending && downloadingReportId === report.id}
                          title="Download as PDF"
                        >
                          {downloadMutation.isPending && downloadingReportId === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                      </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
