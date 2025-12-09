import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  FileText,
  Activity,
  LogOut,
  UserCog,
  Bell,
  FileCode2,
  Smartphone,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Building2, label: 'Companies', path: '/companies' },
  { icon: UserCog, label: 'Salesmen', path: '/salesmen' },
  { icon: CreditCard, label: 'Subscriptions', path: '/subscriptions' },
  { icon: DollarSign, label: 'Cost Tracking', path: '/billing' },
  { icon: Bell, label: 'Push Notifications', path: '/push-notifications' },
  { icon: FileCode2, label: 'Notification Templates', path: '/notification-templates' },
  { icon: Activity, label: 'Activity Logs', path: '/activity' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Smartphone, label: 'App Versions', path: '/app-versions' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-gradient-to-b from-white to-slate-50/50 shadow-lg">
      {/* Logo/Brand Section */}
      <div className="flex h-20 items-center border-b border-slate-200/60 bg-gradient-to-r from-blue-600 to-indigo-600 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">DreamToBuy</h1>
            <span className="text-xs text-blue-100">Admin Portal</span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-md'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 transition-transform duration-200',
                isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700',
                !isActive && 'group-hover:scale-110'
              )} />
              <span className={cn(
                'transition-all duration-200',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="border-t border-slate-200/60 p-4 bg-slate-50/50">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}

