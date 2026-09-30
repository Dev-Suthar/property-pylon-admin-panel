import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CreditCard,
  DollarSign,
  FileCode2,
  Home,
  KeyRound,
  ListChecks,
  Megaphone,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Settings,
  ShieldCheck,
  Smartphone,
  UserCog,
  Users,
  UserSquare2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface Item {
  icon: LucideIcon;
  label: string;
  path: string;
  /** Extra path prefix that also marks this item active. */
  match?: string;
}

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Platform',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Building2, label: 'Companies', path: '/companies' },
      { icon: Briefcase, label: 'Company workspace', path: '/workspace', match: '/c/' },
      { icon: Users, label: 'Users', path: '/users' },
      { icon: UserCog, label: 'Salesmen', path: '/salesmen' },
    ],
  },
  {
    title: 'All companies data',
    items: [
      { icon: Home, label: 'Properties', path: '/properties' },
      { icon: UserSquare2, label: 'Customers', path: '/customers' },
      { icon: Activity, label: 'Activity', path: '/activity' },
    ],
  },
  {
    title: 'Business',
    items: [
      { icon: CreditCard, label: 'Plans & subscriptions', path: '/subscriptions' },
      { icon: DollarSign, label: 'Cost tracking', path: '/billing' },
      { icon: BarChart3, label: 'Reports', path: '/reports' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { icon: ListChecks, label: 'Master lists', path: '/master-lists' },
      { icon: KeyRound, label: 'Roles & permissions', path: '/permissions' },
      { icon: Smartphone, label: 'App versions', path: '/app-versions' },
      { icon: FileCode2, label: 'Notification templates', path: '/notification-templates' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { icon: Megaphone, label: 'Announcements & maintenance', path: '/notices' },
      { icon: Bell, label: 'Push notifications', path: '/push-notifications' },
      { icon: ShieldCheck, label: 'Audit log', path: '/audit-log' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
];

export function Sidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const isActive = (i: Item) => pathname === i.path || pathname.startsWith(`${i.path}/`) || (!!i.match && pathname.startsWith(i.match));

  return (
    <div className={cn('h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white', className ?? 'hidden lg:flex')}>
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 bg-blue-600 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold text-white">DreamToBuy</div>
          <div className="text-xs text-blue-100">Admin</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{g.title}</div>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}
