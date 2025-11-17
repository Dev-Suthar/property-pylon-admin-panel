import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  UsersRound,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  LayoutGrid,
  List,
  Mail,
  Phone,
  DollarSign,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CustomerDetailsDrawer } from "@/components/CustomerDetailsDrawer";
import { customerService, Customer, CreateCustomerData } from "@/services/customerService";
import { formatPriceWithCurrency } from "@/utils/priceUtils";

const mockCustomers: Customer[] = [
  {
    id: "1",
    company_id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+91 98765 43210",
    status: "active",
    budget_min: 5000000,
    budget_max: 10000000,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    company_id: "1",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+91 98765 43211",
    status: "active",
    budget_min: 3000000,
    budget_max: 6000000,
    created_at: "2024-02-20T00:00:00Z",
    updated_at: "2024-02-20T00:00:00Z",
  },
  {
    id: "3",
    company_id: "2",
    name: "Bob Johnson",
    email: "bob@example.com",
    phone: "+91 98765 43212",
    status: "inactive",
    created_at: "2024-03-10T00:00:00Z",
    updated_at: "2024-03-10T00:00:00Z",
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
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 p-8 shadow-lg">
      <UsersRound className="h-16 w-16 text-purple-600" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-900">No customers found</h3>
    <p className="mb-6 text-center text-sm text-slate-500 max-w-sm">
      No customers match your search criteria.
    </p>
  </div>
);

type SortField = "name" | "email" | "created_at" | null;
type SortDirection = "asc" | "desc" | null;
type ViewMode = "table" | "grid";

export function Customers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [hotLeadFilter, setHotLeadFilter] = useState<string>("all");
  const [budgetMinFilter, setBudgetMinFilter] = useState<string>("");
  const [budgetMaxFilter, setBudgetMaxFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", page, limit, searchQuery, statusFilter, typeFilter, hotLeadFilter, budgetMinFilter, budgetMaxFilter],
    queryFn: () =>
      customerService.getAll({
        page,
        limit,
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        is_hot_lead: hotLeadFilter !== "all" ? hotLeadFilter : undefined,
        budget_min: budgetMinFilter ? parseFloat(budgetMinFilter) : undefined,
        budget_max: budgetMaxFilter ? parseFloat(budgetMaxFilter) : undefined,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const customers = useMemo(() => {
    const rawCustomers = data?.customers || (error ? mockCustomers : []);
    const uniqueMap = new Map();
    rawCustomers.forEach((customer: Customer) => {
      if (customer.id && !uniqueMap.has(customer.id)) {
        uniqueMap.set(customer.id, customer);
      }
    });
    return Array.from(uniqueMap.values());
  }, [data?.customers, error]);

  const sortedCustomers = useMemo(() => {
    if (!sortField) return customers;
    return [...customers].sort((a, b) => {
      let aValue: any = a[sortField as keyof Customer];
      let bValue: any = b[sortField as keyof Customer];
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
  }, [customers, sortField, sortDirection]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return sortedCustomers.slice(start, end);
  }, [sortedCustomers, page, limit]);

  const total = data?.total || customers.length;
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

  const TruncatedText = ({
    text,
    maxLength = 30,
  }: {
    text: string;
    maxLength?: number;
  }) => {
    const truncated =
      text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    const needsTooltip = text.length > maxLength;

    if (needsTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help truncate block">{truncated}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{text}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <span className="truncate block">{text}</span>;
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerData> }) =>
      customerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: customerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (formData: FormData) => {
    const data: CreateCustomerData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      status: (formData.get("status") as string) || "active",
      type: (formData.get("type") as string) || "buyer",
      budget_min: formData.get("budget_min") ? parseFloat(formData.get("budget_min") as string) : undefined,
      budget_max: formData.get("budget_max") ? parseFloat(formData.get("budget_max") as string) : undefined,
      notes: formData.get("notes") as string || undefined,
    };
    createMutation.mutate(data);
  };

  const handleUpdate = (formData: FormData) => {
    if (!selectedCustomer) return;
    const data: Partial<CreateCustomerData> = {
      name: formData.get("name") as string,
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      status: formData.get("status") as string,
      type: formData.get("type") as string,
      budget_min: formData.get("budget_min") ? parseFloat(formData.get("budget_min") as string) : undefined,
      budget_max: formData.get("budget_max") ? parseFloat(formData.get("budget_max") as string) : undefined,
      notes: formData.get("notes") as string || undefined,
    };
    updateMutation.mutate({ id: selectedCustomer.id, data });
  };

  const handleDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setHotLeadFilter("all");
    setBudgetMinFilter("");
    setBudgetMaxFilter("");
    setPage(1);
  };

  const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all" || hotLeadFilter !== "all" || budgetMinFilter || budgetMaxFilter;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Customers
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Manage all customers across all companies
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-11 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buyer">Buyer</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
          <Select value={hotLeadFilter} onValueChange={setHotLeadFilter}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="Hot Lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="true">Hot Leads</SelectItem>
              <SelectItem value="false">Regular Leads</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min Budget"
              value={budgetMinFilter}
              onChange={(e) => {
                setBudgetMinFilter(e.target.value);
                setPage(1);
              }}
              className="w-[120px] h-10 rounded-xl border-slate-200"
            />
            <span className="text-slate-500">-</span>
            <Input
              type="number"
              placeholder="Max Budget"
              value={budgetMaxFilter}
              onChange={(e) => {
                setBudgetMaxFilter(e.target.value);
                setPage(1);
              }}
              className="w-[120px] h-10 rounded-xl border-slate-200"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 rounded-xl"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
          <div className="flex items-center gap-2 border-2 border-slate-200 rounded-xl p-1 bg-slate-50/50">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 rounded-lg"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 rounded-lg"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
      ) : customers.length === 0 ? (
        <div className="rounded-xl border-0 bg-white shadow-lg">
          <EmptyState />
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white border-0 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
            >
              {/* Customer Header */}
              <div className="relative p-6 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-rose-600/20" />
                <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl mb-4 mx-auto">
                  <UsersRound className="h-8 w-8 text-white" />
                </div>
                <Badge
                  variant={customer.status === "active" ? "success" : "secondary"}
                  className="absolute top-4 right-4 capitalize shadow-lg z-10"
                >
                  {customer.status}
                </Badge>
              </div>

              {/* Customer Details */}
              <div className="p-5 space-y-4 bg-white">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-purple-600 transition-colors">
                    {customer.name}
                  </h3>
                </div>

                <div className="space-y-2.5 text-sm">
                  {customer.email && (
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <div className="p-1.5 rounded-lg bg-purple-50">
                        <Mail className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="line-clamp-1">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <div className="p-1.5 rounded-lg bg-green-50">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {(customer.budget_min || customer.budget_max) && (
                    <div className="flex items-center gap-2.5 text-slate-600 pt-2 border-t border-slate-100">
                      <div className="p-1.5 rounded-lg bg-emerald-50">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium">
                        {customer.budget_min && formatCurrency(customer.budget_min)}
                        {customer.budget_min && customer.budget_max && " - "}
                        {customer.budget_max && formatCurrency(customer.budget_max)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Created: {formatDate(customer.created_at)}
                </div>

                {/* Actions */}
                <div className="pt-3 flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsDrawerOpen(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-600"
                        onClick={() => {
                          setCustomerToDelete(customer);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
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
                      Name
                      {getSortIcon("name")}
                    </button>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden md:table-cell">
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center font-semibold uppercase tracking-wide text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Email
                      {getSortIcon("email")}
                    </button>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden lg:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Phone
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden xl:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Budget
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Status
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden xl:table-cell">
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center font-semibold uppercase tracking-wide text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Created
                      {getSortIcon("created_at")}
                    </button>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white text-right">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Actions
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <TableCell className="font-semibold text-gray-900">
                      <TruncatedText text={customer.name} maxLength={25} />
                    </TableCell>
                    <TableCell className="text-gray-600 hidden md:table-cell">
                      <TruncatedText text={customer.email || "-"} maxLength={30} />
                    </TableCell>
                    <TableCell className="text-gray-600 font-mono text-sm hidden lg:table-cell">
                      {customer.phone || "-"}
                    </TableCell>
                    <TableCell className="text-gray-600 hidden xl:table-cell">
                      {customer.budget_min && customer.budget_max
                        ? `${formatCurrency(customer.budget_min)} - ${formatCurrency(customer.budget_max)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={customer.status === "active" ? "success" : "secondary"}
                        className="font-medium px-2.5 py-0.5 text-xs min-w-[70px] justify-center capitalize"
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm hidden xl:table-cell">
                      {formatDate(customer.created_at)}
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
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setSelectedCustomer(customer);
                                setIsDrawerOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setSelectedCustomer(customer);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-600"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setCustomerToDelete(customer);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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

      {viewMode === "grid" && totalPages > 1 && (
        <div className="flex justify-center pt-4">
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

      {/* Customer Details Drawer */}
      <CustomerDetailsDrawer
        customer={selectedCustomer}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to the system
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate(new FormData(e.currentTarget));
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" name="phone" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select name="type" defaultValue="buyer">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_min">Budget Min</Label>
                  <Input id="budget_min" name="budget_min" type="number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_max">Budget Max</Label>
                  <Input id="budget_max" name="budget_max" type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(new FormData(e.currentTarget));
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input id="edit-name" name="name" defaultValue={selectedCustomer.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone *</Label>
                    <Input id="edit-phone" name="phone" defaultValue={selectedCustomer.phone || ""} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" name="email" type="email" defaultValue={selectedCustomer.email || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Type *</Label>
                    <Select name="type" defaultValue={(selectedCustomer as any).type || "buyer"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status *</Label>
                    <Select name="status" defaultValue={selectedCustomer.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-budget_min">Budget Min</Label>
                    <Input id="edit-budget_min" name="budget_min" type="number" defaultValue={selectedCustomer.budget_min?.toString() || ""} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-budget_max">Budget Max</Label>
                    <Input id="edit-budget_max" name="budget_max" type="number" defaultValue={selectedCustomer.budget_max?.toString() || ""} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea id="edit-notes" name="notes" rows={3} defaultValue={(selectedCustomer as any).notes || ""} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedCustomer(null);
                  }}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Customer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {customerToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCustomerToDelete(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
