import {
  BarChart3, Briefcase, CalendarCheck, ClipboardList, Clock, FileSpreadsheet, Handshake, Home,
  KanbanSquare, LayoutDashboard, LucideIcon, Building, FileSignature, IndianRupee, KeyRound, ListChecks, MessageSquareText, Settings2, Target, UserSquare2, Users2,
} from 'lucide-react';
import PipelineTab from '../workspace/PipelineTab';
import VisitsTab from '../workspace/VisitsTab';
import TasksTab from '../workspace/TasksTab';
import DealsTab from '../workspace/DealsTab';
import PartnersTab from '../workspace/PartnersTab';
import RentalsTab from '../workspace/RentalsTab';
import AttendanceTab from '../workspace/AttendanceTab';
import InsightsTab from '../workspace/InsightsTab';
import LeadsTab from '../workspace/LeadsTab';
import type { ModuleKey } from '@/services/entitlementService';
import Overview from './Overview';
import LeadsModule from './LeadsModule';
import TemplatesModule from './TemplatesModule';
import TeamModule from './TeamModule';
import ReportsModule from './ReportsModule';
import SettingsModule from './SettingsModule';
import ProjectsModule from './ProjectsModule';
import BookingsModule from './BookingsModule';
import CollectionsModule from './CollectionsModule';
import PermissionsModule from './PermissionsModule';
import ListsModule from './ListsModule';

export interface CompanyModule {
  key: string;
  label: string;
  icon: LucideIcon;
  group: 'Sales' | 'Inventory' | 'Business' | 'Team' | 'Setup';
  /** Plan module this screen needs (server answers 403 MODULE_DISABLED without it). */
  requires?: ModuleKey;
  Component: React.ComponentType<{ companyId: string }>;
}

/**
 * Every module of the broker app, operable by a platform admin for any
 * company. Order = order in the workspace nav.
 */
export const COMPANY_MODULES: CompanyModule[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'Sales', Component: Overview },
  { key: 'leads', label: 'Leads', icon: UserSquare2, group: 'Sales', Component: LeadsModule },
  { key: 'followups', label: 'Follow-ups', icon: ClipboardList, group: 'Sales', Component: TasksTab },
  { key: 'visits', label: 'Site visits', icon: CalendarCheck, group: 'Sales', Component: VisitsTab },
  { key: 'projects', label: 'Projects & units', icon: Building, group: 'Inventory', requires: 'builder', Component: ProjectsModule },
  { key: 'bookings', label: 'Bookings', icon: FileSignature, group: 'Inventory', requires: 'builder', Component: BookingsModule },
  { key: 'collections', label: 'Collections', icon: IndianRupee, group: 'Inventory', requires: 'builder', Component: CollectionsModule },
  { key: 'pipeline', label: 'Listing pipeline', icon: KanbanSquare, group: 'Inventory', Component: PipelineTab },
  { key: 'rentals', label: 'Rental renewals', icon: Home, group: 'Inventory', requires: 'rentals', Component: RentalsTab },
  { key: 'deals', label: 'Deals & commission', icon: Briefcase, group: 'Business', Component: DealsTab },
  { key: 'partners', label: 'Channel partners', icon: Handshake, group: 'Business', requires: 'partners', Component: PartnersTab },
  { key: 'reports', label: 'Reports & targets', icon: Target, group: 'Business', requires: 'reports', Component: ReportsModule },
  { key: 'insights', label: 'Insights', icon: BarChart3, group: 'Business', Component: InsightsTab },
  { key: 'team', label: 'Team & roles', icon: Users2, group: 'Team', Component: TeamModule },
  { key: 'permissions', label: 'Roles & permissions', icon: KeyRound, group: 'Team', Component: PermissionsModule },
  { key: 'attendance', label: 'Attendance', icon: Clock, group: 'Team', requires: 'attendance', Component: AttendanceTab },
  { key: 'settings', label: 'Company settings', icon: Settings2, group: 'Setup', Component: SettingsModule },
  { key: 'lists', label: 'Dropdown lists', icon: ListChecks, group: 'Setup', Component: ListsModule },
  { key: 'templates', label: 'WhatsApp templates', icon: MessageSquareText, group: 'Setup', requires: 'templates', Component: TemplatesModule },
  { key: 'import', label: 'Lead capture & import', icon: FileSpreadsheet, group: 'Setup', Component: LeadsTab },
];

export const MODULE_GROUPS: CompanyModule['group'][] = ['Sales', 'Inventory', 'Business', 'Team', 'Setup'];

/** Old /workspace?tab= keys → module keys. */
export const LEGACY_TABS: Record<string, string> = { leads: 'import' };

export const findModule = (key?: string) => COMPANY_MODULES.find((m) => m.key === key);

