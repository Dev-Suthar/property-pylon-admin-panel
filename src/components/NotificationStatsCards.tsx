import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Smartphone, Bell, CheckCircle } from 'lucide-react';
import { NotificationStats } from '@/services/notificationService';

interface NotificationStatsCardsProps {
  stats: NotificationStats;
  isLoading?: boolean;
}

export function NotificationStatsCards({ stats, isLoading }: NotificationStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
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
    );
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.total_users.toLocaleString(),
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      description: 'All company users',
    },
    {
      title: 'Users with FCM Tokens',
      value: stats.users_with_tokens.toLocaleString(),
      icon: Smartphone,
      gradient: 'from-purple-500 to-pink-500',
      description: `${((stats.users_with_tokens / Math.max(stats.total_users, 1)) * 100).toFixed(1)}% of users`,
    },
    {
      title: 'Upcoming Reminders',
      value: stats.upcoming_reminders.toLocaleString(),
      icon: Bell,
      gradient: 'from-green-500 to-emerald-500',
      description: 'Visits in next 24 hours',
    },
    {
      title: 'Reminders Sent Today',
      value: stats.reminders_sent_today.toLocaleString(),
      icon: CheckCircle,
      gradient: 'from-orange-500 to-amber-500',
      description: 'Notifications sent today',
    },
  ];

  return (
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
              <CardTitle className="text-sm font-semibold text-slate-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
              <p className="text-xs text-slate-500">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

