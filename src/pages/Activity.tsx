import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  AlertCircle,
  Activity as ActivityIcon,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { activityService, type Activity } from "@/services/activityService";

const mockActivities: Activity[] = [
  {
    id: "1",
    company_id: "1",
    user_id: "1",
    user_name: "John Doe",
    activity_type: "property_created",
    entity_type: "property",
    entity_id: "1",
    description: "Created new property: Luxury Apartment in Downtown",
    created_at: "2024-06-15T10:30:00Z",
  },
  {
    id: "2",
    company_id: "1",
    user_id: "2",
    user_name: "Jane Smith",
    activity_type: "customer_updated",
    entity_type: "customer",
    entity_id: "1",
    description: "Updated customer: John Doe",
    created_at: "2024-06-15T09:15:00Z",
  },
  {
    id: "3",
    company_id: "2",
    user_id: "3",
    user_name: "Bob Johnson",
    activity_type: "visit_scheduled",
    entity_type: "visit",
    entity_id: "1",
    description: "Scheduled visit for property: Modern Villa",
    created_at: "2024-06-14T14:20:00Z",
  },
];

const TableSkeleton = () => (
  <div className="space-y-4 p-6">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-20 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 p-8 shadow-lg">
      <ActivityIcon className="h-16 w-16 text-orange-600" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-900">No activities found</h3>
    <p className="mb-6 text-center text-sm text-slate-500 max-w-sm">
      No activities match your search criteria.
    </p>
  </div>
);

type SortField = "created_at" | "activity_type" | null;
type SortDirection = "asc" | "desc" | null;

export function Activity() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["activities", page, limit, searchQuery, typeFilter],
    queryFn: () =>
      activityService.getAll({
        page,
        limit,
        search: searchQuery,
        activity_type: typeFilter !== "all" ? typeFilter : undefined,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const activities = useMemo(() => {
    const rawActivities = data?.data || data?.activities || (error ? mockActivities : []);
    const uniqueMap = new Map();
    rawActivities.forEach((activity: Activity) => {
      if (activity.id && !uniqueMap.has(activity.id)) {
        uniqueMap.set(activity.id, activity);
      }
    });
    return Array.from(uniqueMap.values());
  }, [data?.data, data?.activities, error]);

  const sortedActivities = useMemo(() => {
    if (!sortField) return activities;
    return [...activities].sort((a, b) => {
      let aValue: any = a[sortField as keyof Activity];
      let bValue: any = b[sortField as keyof Activity];
      if (sortField === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue || "").toLowerCase();
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [activities, sortField, sortDirection]);

  const paginatedActivities = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return sortedActivities.slice(start, end);
  }, [sortedActivities, page, limit]);

  const total = data?.total || activities.length;
  const totalPages = Math.ceil(total / limit);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection("asc");
      } else {
        setSortDirection("desc");
      }
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ChevronUp className="ml-1 h-4 w-4" />;
    }
    return <ChevronDown className="ml-1 h-4 w-4" />;
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityTypeColor = (type: string) => {
    if (type.includes("created")) return "success";
    if (type.includes("updated")) return "default";
    if (type.includes("deleted")) return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">
            View system activity and audit logs
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-11 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all duration-200"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 bg-white">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="property_created">Property Created</SelectItem>
            <SelectItem value="property_updated">Property Updated</SelectItem>
            <SelectItem value="customer_created">Customer Created</SelectItem>
            <SelectItem value="customer_updated">Customer Updated</SelectItem>
            <SelectItem value="visit_scheduled">Visit Scheduled</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="rounded-xl border-0 bg-white shadow-lg p-4">
          <TableSkeleton />
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border-0 bg-white shadow-lg">
          <EmptyState />
        </div>
      ) : (
        <div className="rounded-xl border-0 bg-white shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2 border-gray-100">
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center font-semibold uppercase tracking-wide text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Timestamp
                      {getSortIcon("created_at")}
                    </button>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden md:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      User
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <button
                      onClick={() => handleSort("activity_type")}
                      className="flex items-center font-semibold uppercase tracking-wide text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Activity Type
                      {getSortIcon("activity_type")}
                    </button>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden lg:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Entity
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Description
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActivities.map((activity) => (
                  <TableRow
                    key={activity.id}
                    className="transition-all duration-200"
                  >
                    <TableCell className="text-gray-600 text-sm">
                      {formatDateTime(activity.created_at)}
                    </TableCell>
                    <TableCell className="text-gray-600 hidden md:table-cell">
                      {activity.user_name || activity.creator?.name || "System"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getActivityTypeColor(activity.activity_type || activity.type || '')}
                        className="font-medium px-2.5 py-0.5 text-xs capitalize"
                      >
                        {(activity.activity_type || activity.type || '').replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 hidden lg:table-cell capitalize">
                      {activity.entity_type || (activity.property_id ? 'property' : activity.customer_id ? 'customer' : 'general')} #{activity.entity_id?.substring(0, 8) || activity.property_id?.substring(0, 8) || activity.customer_id?.substring(0, 8) || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {activity.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="border-t px-4 py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return (
                        <PaginationItem key={pageNum}>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
