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
import {
  subscriptionPlanService,
  SubscriptionPlan,
} from "@/services/subscriptionPlanService";
import { formatPriceWithCurrency } from "@/utils/priceUtils";
import { PlanDetailsDrawer } from "@/components/PlanDetailsDrawer";

const mockPlans: SubscriptionPlan[] = [
  {
    id: "1",
    name: "Basic Plan",
    price: 4999,
    period: "monthly",
    features: ["Up to 50 properties", "Up to 100 customers"],
    popular: false,
    max_properties: 50,
    max_customers: 100,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Professional Plan",
    price: 9999,
    period: "monthly",
    features: [
      "Up to 200 properties",
      "Up to 500 customers",
      "Priority support",
    ],
    popular: true,
    max_properties: 200,
    max_customers: 500,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Enterprise Plan",
    price: 19999,
    period: "monthly",
    features: [
      "Unlimited properties",
      "Unlimited customers",
      "Priority support",
      "Custom integrations",
    ],
    popular: false,
    max_properties: undefined,
    max_customers: undefined,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const TableSkeleton = () => (
  <div className="space-y-4 p-6">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="h-20 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
      />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 p-8 shadow-lg">
      <CreditCard className="h-16 w-16 text-emerald-600" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-900">
      No subscription plans found
    </h3>
    <p className="mb-6 text-center text-sm text-slate-500 max-w-sm">
      No subscription plans match your search criteria. Create a new plan to get
      started.
    </p>
  </div>
);

type SortField = "name" | "price" | "created_at" | null;
type SortDirection = "asc" | "desc" | null;

export function Subscriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["subscription-plans", page, limit, searchQuery, statusFilter],
    queryFn: () =>
      subscriptionPlanService.getAll({
        page,
        limit,
        search: searchQuery,
        is_active:
          statusFilter !== "all" ? statusFilter === "active" : undefined,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const plans = useMemo(() => {
    const rawPlans = data?.plans || (error ? mockPlans : []);
    const uniqueMap = new Map();
    rawPlans.forEach((plan: SubscriptionPlan) => {
      if (plan.id && !uniqueMap.has(plan.id)) {
        uniqueMap.set(plan.id, plan);
      }
    });
    return Array.from(uniqueMap.values());
  }, [data?.plans, error]);

  // Client-side sorting
  const sortedPlans = useMemo(() => {
    if (!sortField) return plans;
    return [...plans].sort((a, b) => {
      let aValue: any = a[sortField as keyof SubscriptionPlan];
      let bValue: any = b[sortField as keyof SubscriptionPlan];
      if (sortField === "created_at" || sortField === "price") {
        aValue =
          sortField === "price" ? aValue || 0 : new Date(aValue).getTime();
        bValue =
          sortField === "price" ? bValue || 0 : new Date(bValue).getTime();
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue || "").toLowerCase();
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [plans, sortField, sortDirection]);

  // Use backend pagination - plans are already paginated from the API
  const displayPlans = sortedPlans;

  const total = data?.total || plans.length;
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

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "success" : "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage subscription plans available in the mobile application
          </p>
        </div>
        <Button
          onClick={() => setIsCreateSheetOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-11 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 bg-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
      ) : plans.length === 0 ? (
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
                      onClick={() => handleSort("name")}
                      className="flex items-center font-semibold uppercase tracking-wide text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Plan Name
                      {getSortIcon("name")}
                    </button>
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
                  <TableHead className="sticky top-0 z-10 bg-white hidden md:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Period
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden xl:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Features
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Status
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
                {displayPlans.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer transition-all duration-200 hover:bg-slate-50"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <TableCell className="font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        {plan.name}
                        {plan.popular && (
                          <Badge variant="default" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 hidden lg:table-cell font-medium">
                      {formatCurrency(plan.price)}/{plan.period}
                    </TableCell>
                    <TableCell className="text-gray-600 hidden md:table-cell capitalize">
                      {plan.period}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm hidden xl:table-cell">
                      {plan.features && plan.features.length > 0 ? (
                        <span className="text-xs">
                          {plan.features.length} feature
                          {plan.features.length !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(plan.is_active)}
                        className="font-medium px-2.5 py-0.5 text-xs min-w-[70px] justify-center capitalize"
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
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
                            <DropdownMenuItem
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setSelectedPlan(plan);
                                setIsDrawerOpen(true);
                                setIsEditSheetOpen(false);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setSelectedPlan(plan);
                                setIsDrawerOpen(true);
                                setIsEditSheetOpen(true);
                              }}
                            >
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
                      className={
                        page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        page === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* Plan Details Drawer */}
      <PlanDetailsDrawer
        plan={selectedPlan}
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setIsEditSheetOpen(false);
            setSelectedPlan(null);
          }
        }}
        openEditSheet={isEditSheetOpen}
        onEditSheetOpenChange={setIsEditSheetOpen}
        isCreateMode={isCreateSheetOpen}
        onCreateModeChange={setIsCreateSheetOpen}
      />
    </div>
  );
}
