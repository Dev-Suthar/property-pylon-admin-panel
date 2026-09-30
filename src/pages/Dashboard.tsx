import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Users,
  Home,
  UsersRound,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
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
} from "recharts";
import { dashboardService } from "@/services/dashboardService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const PIE_FALLBACK_COLORS = [
  "rgb(var(--tw-blue-500))",
  "rgb(var(--tw-emerald-500))",
  "rgb(var(--tw-amber-500))",
  "rgb(var(--tw-purple-500))",
  "rgb(var(--tw-pink-500))",
];

const formatCount = (value?: number | null) =>
  typeof value === "number" ? value.toLocaleString() : "—";

function ChartEmptyState({ message = "No data yet" }: { message?: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.getDashboardData(),
    retry: false,
  });

  const stats = data?.stats;
  const companyGrowth = data?.companyGrowth ?? [];
  const subscriptionData = data?.subscriptionDistribution ?? [];
  const revenueData = data?.revenue ?? [];

  const statsCards = [
    {
      title: "Total Companies",
      value: formatCount(stats?.totalCompanies),
      icon: Building2,
    },
    {
      title: "Total Users",
      value: formatCount(stats?.totalUsers),
      icon: Users,
    },
    {
      title: "Total Properties",
      value: formatCount(stats?.totalProperties),
      icon: Home,
    },
    {
      title: "Total Customers",
      value: formatCount(stats?.totalCustomers),
      icon: UsersRound,
    },
    ...(stats?.total_properties_for_sale !== undefined
      ? [
          {
            title: "Properties For Sale",
            value: formatCount(stats?.total_properties_for_sale),
            icon: Home,
          },
        ]
      : []),
    ...(stats?.total_properties_for_rent !== undefined
      ? [
          {
            title: "Properties For Rent",
            value: formatCount(stats?.total_properties_for_rent),
            icon: Home,
          },
        ]
      : []),
    ...(stats?.total_buyer_requirements_sale !== undefined
      ? [
          {
            title: "Buyers (Want to Buy)",
            value: formatCount(stats?.total_buyer_requirements_sale),
            icon: UsersRound,
          },
        ]
      : []),
    ...(stats?.total_buyer_requirements_rent !== undefined
      ? [
          {
            title: "Buyers (Want to Rent)",
            value: formatCount(stats?.total_buyer_requirements_rent),
            icon: UsersRound,
          },
        ]
      : []),
    ...(stats?.expiring_agreements_count !== undefined
      ? [
          {
            title: "Expiring Agreements (30d)",
            value: formatCount(stats?.expiring_agreements_count),
            icon: AlertCircle,
          },
        ]
      : []),
    ...(stats?.active_rentals_count !== undefined
      ? [
          {
            title: "Active Rentals",
            value: formatCount(stats?.active_rentals_count),
            icon: Home,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-slate-600 mt-2 text-lg">
          Overview of your DreamToBuy system
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>Failed to load dashboard: {error.message}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Retrying..." : "Retry"}
            </Button>
          </AlertDescription>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              const gradients = [
                "from-blue-500 to-cyan-500",
                "from-purple-500 to-pink-500",
                "from-green-500 to-emerald-500",
                "from-orange-500 to-amber-500",
              ];
              const gradient = gradients[index % gradients.length];

              return (
                <Card
                  key={stat.title}
                  className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`}
                  />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-md`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Company Growth
                </CardTitle>
                <CardDescription className="text-slate-600">
                  New companies registered over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {companyGrowth.length === 0 ? (
                  <ChartEmptyState />
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={companyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--tw-slate-200))" />
                    <XAxis
                      dataKey="month"
                      stroke="rgb(var(--tw-slate-500))"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke="rgb(var(--tw-slate-500))" style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgb(var(--tw-white))",
                        border: "1px solid rgb(var(--tw-slate-200))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="companies"
                      stroke="rgb(var(--tw-blue-500))"
                      strokeWidth={3}
                      dot={{ fill: "rgb(var(--tw-blue-500))", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Subscription Distribution
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Current subscription plans breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {subscriptionData.length === 0 ? (
                  <ChartEmptyState />
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      fill="rgb(var(--tw-blue-500))"
                      dataKey="value"
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.color ||
                            PIE_FALLBACK_COLORS[index % PIE_FALLBACK_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgb(var(--tw-white))",
                        border: "1px solid rgb(var(--tw-slate-200))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Revenue Trends
              </CardTitle>
              <CardDescription className="text-slate-600">
                Monthly recurring revenue over time
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {revenueData.length === 0 ? (
                <ChartEmptyState />
              ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--tw-slate-200))" />
                  <XAxis
                    dataKey="month"
                    stroke="rgb(var(--tw-slate-500))"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="rgb(var(--tw-slate-500))" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgb(var(--tw-white))",
                      border: "1px solid rgb(var(--tw-slate-200))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="url(#colorRevenue)"
                    radius={[8, 8, 0, 0]}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="rgb(var(--tw-emerald-500))"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="rgb(var(--tw-emerald-600))"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
