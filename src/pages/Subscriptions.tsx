import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Edit,
  Eye,
  MoreVertical,
  AlertCircle,
  CreditCard,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { subscriptionService, Subscription } from "@/services/subscriptionService";
import { formatPriceWithCurrency } from "@/utils/priceUtils";

const mockSubscriptions: Subscription[] = [
  {
    id: "1",
    company_id: "1",
    plan_id: "1",
    plan_name: "Professional",
    status: "active",
    start_date: "2024-01-01T00:00:00Z",
    end_date: "2024-12-31T00:00:00Z",
    price: 9999,
    billing_cycle: "monthly",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    company_id: "2",
    plan_id: "2",
    plan_name: "Enterprise",
    status: "active",
    start_date: "2024-02-01T00:00:00Z",
    end_date: "2025-01-31T00:00:00Z",
    price: 19999,
    billing_cycle: "monthly",
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
  {
    id: "3",
    company_id: "3",
    plan_id: "3",
    plan_name: "Basic",
    status: "cancelled",
    start_date: "2024-03-01T00:00:00Z",
    price: 4999,
    billing_cycle: "monthly",
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-15T00:00:00Z",
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
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 p-8 shadow-lg">
      <CreditCard className="h-16 w-16 text-emerald-600" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-900">No subscriptions found</h3>
    <p className="mb-6 text-center text-sm text-slate-500 max-w-sm">
      No subscriptions match your search criteria.
    </p>
  </div>
);

type SortField = "plan_name" | "price" | "created_at" | null;
type SortDirection = "asc" | "desc" | null;

export function Subscriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["subscriptions", page, limit, searchQuery, statusFilter],
    queryFn: () =>
      subscriptionService.getAll({
        page,
        limit,
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const subscriptions = useMemo(() => {
    const rawSubscriptions = data?.subscriptions || (error ? mockSubscriptions : []);
    const uniqueMap = new Map();
    rawSubscriptions.forEach((subscription: Subscription) => {
      if (subscription.id && !uniqueMap.has(subscription.id)) {
        uniqueMap.set(subscription.id, subscription);
      }
    });
    return Array.from(uniqueMap.values());
  }, [data?.subscriptions, error]);

  const sortedSubscriptions = useMemo(() => {
    if (!sortField) return subscriptions;
    return [...subscriptions].sort((a, b) => {
      let aValue: any = a[sortField as keyof Subscription];
      let bValue: any = b[sortField as keyof Subscription];
      if (sortField === "created_at" || sortField === "price") {
        aValue = sortField === "price" ? (aValue || 0) : new Date(aValue).getTime();
        bValue = sortField === "price" ? (bValue || 0) : new Date(bValue).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue || "").toLowerCase();
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [subscriptions, sortField, sortDirection]);

  const paginatedSubscriptions = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return sortedSubscriptions.slice(start, end);
  }, [sortedSubscriptions, page, limit]);

  const total = data?.total || subscriptions.length;
  const totalPages = Math.ceil(total / limit);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
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

  const formatCurrency = (amount: number) => {
    return formatPriceWithCurrency(amount, true); // Use converter format (K, L, Cr)
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "cancelled":
        return "secondary";
      case "expired":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage subscription plans and company subscriptions
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-11 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 bg-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
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
      ) : subscriptions.length === 0 ? (
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
                      onClick={() => handleSort("plan_name")}
                      className="flex items-center font-semibold uppercase tracking-wide text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Plan Name
                      {getSortIcon("plan_name")}
                    </button>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden md:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Company
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden lg:table-cell">
                    <button
                      onClick={() => handleSort("price")}
                      className="flex items-center font-semibold uppercase tracking-wide text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Price
                      {getSortIcon("price")}
                    </button>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden lg:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Billing Cycle
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Status
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden xl:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Start Date
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white text-right">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubscriptions.map((subscription) => (
                  <TableRow
                    key={subscription.id}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <TableCell className="font-semibold text-gray-900">
                      {subscription.plan_name}
                    </TableCell>
                    <TableCell className="text-gray-600 hidden md:table-cell">
                      Company ID: {subscription.company_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="text-gray-600 hidden lg:table-cell font-medium">
                      {formatCurrency(subscription.price)}/{subscription.billing_cycle}
                    </TableCell>
                    <TableCell className="text-gray-600 hidden lg:table-cell capitalize">
                      {subscription.billing_cycle}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(subscription.status)}
                        className="font-medium px-2.5 py-0.5 text-xs min-w-[70px] justify-center capitalize"
                      >
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm hidden xl:table-cell">
                      {formatDate(subscription.start_date)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <TooltipProvider>
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors"
                                  aria-label="Actions"
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-600" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Actions</p>
                            </TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TooltipProvider>
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
