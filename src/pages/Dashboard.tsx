import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Home, UsersRound, TrendingUp, AlertCircle } from 'lucide-react';
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
} from 'recharts';
import { dashboardService } from '@/services/dashboardService';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Mock data fallback
const mockStats = {
  totalCompanies: 24,
  totalUsers: 1234,
  totalProperties: 5678,
  totalCustomers: 3456,
  activeSubscriptions: 20,
  revenue: {
    mrr: 35000,
    arr: 420000,
  },
};

const mockCompanyGrowth = [
  { month: 'Jan', companies: 20 },
  { month: 'Feb', companies: 22 },
  { month: 'Mar', companies: 21 },
  { month: 'Apr', companies: 23 },
  { month: 'May', companies: 24 },
  { month: 'Jun', companies: 24 },
];

const mockSubscriptionData = [
  { name: 'Basic', value: 8, color: '#8884d8' },
  { name: 'Professional', value: 12, color: '#82ca9d' },
  { name: 'Enterprise', value: 4, color: '#ffc658' },
];

const mockRevenueData = [
  { month: 'Jan', revenue: 24000 },
  { month: 'Feb', revenue: 26000 },
  { month: 'Mar', revenue: 28000 },
  { month: 'Apr', revenue: 30000 },
  { month: 'May', revenue: 32000 },
  { month: 'Jun', revenue: 35000 },
];

export function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboardData(),
    retry: false,
  });

  const stats = data?.stats || mockStats;
  const companyGrowth = data?.companyGrowth || mockCompanyGrowth;
  const subscriptionData = data?.subscriptionDistribution || mockSubscriptionData;
  const revenueData = data?.revenue || mockRevenueData;

  const statsCards = [
    {
      title: 'Total Companies',
      value: stats.totalCompanies.toLocaleString(),
      icon: Building2,
      change: '+12%',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: '+8%',
    },
    {
      title: 'Total Properties',
      value: stats.totalProperties.toLocaleString(),
      icon: Home,
      change: '+15%',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: UsersRound,
      change: '+10%',
    },
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Using mock data. Backend API not available. Error: {error.message}
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              const gradients = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500',
                'from-green-500 to-emerald-500',
                'from-orange-500 to-amber-500',
              ];
              const gradient = gradients[index % gradients.length];
              
              return (
                <Card 
                  key={stat.title}
                  className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-slate-600">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-md`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      <span className="font-medium text-green-600">{stat.change}</span>
                      <span>from last month</span>
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-semibold text-slate-900">Company Growth</CardTitle>
                <CardDescription className="text-slate-600">New companies registered over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={companyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="companies" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="text-lg font-semibold text-slate-900">Subscription Distribution</CardTitle>
                <CardDescription className="text-slate-600">Current subscription plans breakdown</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="text-lg font-semibold text-slate-900">Revenue Trends</CardTitle>
              <CardDescription className="text-slate-600">Monthly recurring revenue over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill="url(#colorRevenue)"
                    radius={[8, 8, 0, 0]}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
