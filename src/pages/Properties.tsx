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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Plus,
  Search,
  Edit,
  Eye,
  MoreVertical,
  AlertCircle,
  Home,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  LayoutGrid,
  List,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
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
import { Textarea } from "@/components/ui/textarea";
import { propertyService, Property, CreatePropertyData } from "@/services/propertyService";
import { useToast } from "@/hooks/use-toast";
import { PropertyDetailsDrawer } from "@/components/PropertyDetailsDrawer";
import { formatPriceWithCurrency } from "@/utils/priceUtils";

// Mock data fallback
const mockProperties: Property[] = [
  {
    id: "1",
    company_id: "1",
    title: "Luxury Apartment in Downtown",
    property_type: "apartment",
    status: "available",
    price: 5000000,
    address: "123 Main St",
    city: "Ahmedabad",
    bedrooms: 3,
    bathrooms: 2,
    area: 1500,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    company_id: "1",
    title: "Modern Villa with Garden",
    property_type: "villa",
    status: "sold",
    price: 12000000,
    address: "456 Park Ave",
    city: "Ahmedabad",
    bedrooms: 4,
    bathrooms: 3,
    area: 2500,
    created_at: "2024-02-20T00:00:00Z",
    updated_at: "2024-02-20T00:00:00Z",
  },
  {
    id: "3",
    company_id: "2",
    title: "Commercial Office Space",
    property_type: "commercial",
    status: "available",
    price: 8000000,
    address: "789 Business Park",
    city: "Ahmedabad",
    bedrooms: 0,
    bathrooms: 2,
    area: 3000,
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
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-8 shadow-lg">
      <Home className="h-16 w-16 text-blue-600" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-900">No properties found</h3>
    <p className="mb-6 text-center text-sm text-slate-500 max-w-sm">
      Get started by creating your first property. Click the button above to add a new property.
    </p>
  </div>
);

type SortField = "title" | "price" | "created_at" | null;
type SortDirection = "asc" | "desc" | null;

type ViewMode = "table" | "grid";

export function Properties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priceMinFilter, setPriceMinFilter] = useState<string>("");
  const [priceMaxFilter, setPriceMaxFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["properties", page, limit, searchQuery, statusFilter, typeFilter, priceMinFilter, priceMaxFilter],
    queryFn: () =>
      propertyService.getAll({
        page,
        limit,
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
        property_type: typeFilter !== "all" ? typeFilter : undefined,
        price_min: priceMinFilter ? parseFloat(priceMinFilter) : undefined,
        price_max: priceMaxFilter ? parseFloat(priceMaxFilter) : undefined,
      }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const properties = useMemo(() => {
    const rawProperties = data?.properties || (error ? mockProperties : []);
    const uniqueMap = new Map();
    rawProperties.forEach((property: Property) => {
      if (property.id && !uniqueMap.has(property.id)) {
        uniqueMap.set(property.id, property);
      }
    });
    return Array.from(uniqueMap.values());
  }, [data?.properties, error]);

  const sortedProperties = useMemo(() => {
    if (!sortField) return properties;
    return [...properties].sort((a, b) => {
      let aValue: any = a[sortField as keyof Property];
      let bValue: any = b[sortField as keyof Property];
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
  }, [properties, sortField, sortDirection]);

  const paginatedProperties = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return sortedProperties.slice(start, end);
  }, [sortedProperties, page, limit]);

  const total = data?.total || properties.length;
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
    mutationFn: propertyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Property created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePropertyData> }) =>
      propertyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setIsEditDialogOpen(false);
      setSelectedProperty(null);
      toast({
        title: "Success",
        description: "Property updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update property",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: propertyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setIsDeleteDialogOpen(false);
      setPropertyToDelete(null);
      toast({
        title: "Success",
        description: "Property deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete property",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (formData: FormData) => {
    const data: CreatePropertyData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      property_type: formData.get("property_type") as string,
      status: (formData.get("status") as string) || "available",
      price: formData.get("price") ? parseFloat(formData.get("price") as string) : undefined,
      address: formData.get("address") as string || undefined,
      city: formData.get("city") as string || undefined,
      state: formData.get("state") as string || undefined,
      zip_code: formData.get("zip_code") as string || undefined,
      bedrooms: formData.get("bedrooms") ? parseInt(formData.get("bedrooms") as string) : undefined,
      bathrooms: formData.get("bathrooms") ? parseInt(formData.get("bathrooms") as string) : undefined,
      area: formData.get("area") ? parseFloat(formData.get("area") as string) : undefined,
    };
    createMutation.mutate(data);
  };

  const handleUpdate = (formData: FormData) => {
    if (!selectedProperty) return;
    const data: Partial<CreatePropertyData> = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      property_type: formData.get("property_type") as string,
      status: formData.get("status") as string,
      price: formData.get("price") ? parseFloat(formData.get("price") as string) : undefined,
      address: formData.get("address") as string || undefined,
      city: formData.get("city") as string || undefined,
      state: formData.get("state") as string || undefined,
      zip_code: formData.get("zip_code") as string || undefined,
      bedrooms: formData.get("bedrooms") ? parseInt(formData.get("bedrooms") as string) : undefined,
      bathrooms: formData.get("bathrooms") ? parseInt(formData.get("bathrooms") as string) : undefined,
      area: formData.get("area") ? parseFloat(formData.get("area") as string) : undefined,
    };
    updateMutation.mutate({ id: selectedProperty.id, data });
  };

  const handleDelete = () => {
    if (propertyToDelete) {
      deleteMutation.mutate(propertyToDelete.id);
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setPriceMinFilter("");
    setPriceMaxFilter("");
    setPage(1);
  };

  const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all" || priceMinFilter || priceMaxFilter;

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "success";
      case "sold":
        return "secondary";
      case "rented":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Properties
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Manage all properties across all companies
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-11 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 bg-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 bg-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="land">Land</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min Price"
            value={priceMinFilter}
            onChange={(e) => {
              setPriceMinFilter(e.target.value);
              setPage(1);
            }}
            className="w-[120px] h-10 rounded-xl border-slate-200"
          />
          <span className="text-slate-500">-</span>
          <Input
            type="number"
            placeholder="Max Price"
            value={priceMaxFilter}
            onChange={(e) => {
              setPriceMaxFilter(e.target.value);
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
        <div className="rounded-lg border bg-white p-4">
          <TableSkeleton />
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-lg border bg-white">
          <EmptyState />
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white border-0 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
              onClick={() => {
                setSelectedProperty(property);
                setIsDrawerOpen(true);
              }}
            >
              {/* Property Image Placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                <Home className="h-16 w-16 text-blue-500/60 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <Badge
                  variant={getStatusBadgeVariant(property.status)}
                  className="absolute top-3 right-3 capitalize shadow-lg z-10"
                >
                  {property.status}
                </Badge>
              </div>

              {/* Property Details */}
              <div className="p-5 space-y-4 bg-white">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">
                    {property.title}
                  </h3>
                  <p className="text-sm text-slate-500 capitalize font-medium">
                    {property.property_type}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="line-clamp-1">
                    {property.city || property.state || "Location not specified"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(property.price)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600 pt-2">
                  {property.bedrooms !== undefined && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
                      <Bed className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms !== undefined && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
                      <Bath className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">{property.bathrooms}</span>
                    </div>
                  )}
                  {property.area && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
                      <Square className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">{typeof property.area === 'number' ? property.area.toLocaleString() : property.area} sq ft</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                    onClick={() => {
                      setSelectedProperty(property);
                      setIsDrawerOpen(true);
                    }}
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
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setSelectedProperty(property);
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
                          setSelectedProperty(property);
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
                          setPropertyToDelete(property);
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
        <div className="rounded-lg border bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2 border-gray-100">
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <button
                      onClick={() => handleSort("title")}
                      className="flex items-center font-semibold uppercase tracking-wide text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Property Title
                      {getSortIcon("title")}
                    </button>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden md:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Type
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
                      Location
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
                {paginatedProperties.map((property) => (
                  <TableRow
                    key={property.id}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => {
                      setSelectedProperty(property);
                      setIsDrawerOpen(true);
                    }}
                  >
                    <TableCell className="font-semibold text-gray-900">
                      <TruncatedText text={property.title} maxLength={30} />
                    </TableCell>
                    <TableCell className="text-gray-600 hidden md:table-cell capitalize">
                      {property.property_type}
                    </TableCell>
                    <TableCell className="text-gray-600 hidden lg:table-cell font-medium">
                      {formatCurrency(property.price)}
                    </TableCell>
                    <TableCell className="text-gray-600 hidden lg:table-cell">
                      <TruncatedText
                        text={`${property.city || ""} ${property.state || ""}`.trim() || "-"}
                        maxLength={20}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(property.status)}
                        className="font-medium px-2.5 py-0.5 text-xs min-w-[70px] justify-center capitalize"
                      >
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm hidden xl:table-cell">
                      {formatDate(property.created_at)}
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
                                setSelectedProperty(property);
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
                                setSelectedProperty(property);
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
                                setPropertyToDelete(property);
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

      <PropertyDetailsDrawer
        property={selectedProperty}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />

      {/* Create Property Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Property</DialogTitle>
            <DialogDescription>
              Add a new property to the system
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
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Property Type *</Label>
                  <Select name="property_type" defaultValue="apartment">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue="available">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">Zip Code</Label>
                  <Input id="zip_code" name="zip_code" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" name="bedrooms" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" name="bathrooms" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area (sq ft)</Label>
                  <Input id="area" name="area" type="number" />
                </div>
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
                {createMutation.isPending ? "Creating..." : "Create Property"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property information
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(new FormData(e.currentTarget));
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title *</Label>
                    <Input id="edit-title" name="title" defaultValue={selectedProperty.title} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-property_type">Property Type *</Label>
                    <Select name="property_type" defaultValue={selectedProperty.property_type}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" name="description" rows={3} defaultValue={selectedProperty.description || ""} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status *</Label>
                    <Select name="status" defaultValue={selectedProperty.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price</Label>
                    <Input id="edit-price" name="price" type="number" defaultValue={selectedProperty.price?.toString() || ""} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Input id="edit-address" name="address" defaultValue={selectedProperty.address || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-city">City</Label>
                    <Input id="edit-city" name="city" defaultValue={selectedProperty.city || ""} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-state">State</Label>
                    <Input id="edit-state" name="state" defaultValue={selectedProperty.state || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-zip_code">Zip Code</Label>
                    <Input id="edit-zip_code" name="zip_code" defaultValue={selectedProperty.zip_code || ""} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                    <Input id="edit-bedrooms" name="bedrooms" type="number" defaultValue={selectedProperty.bedrooms?.toString() || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bathrooms">Bathrooms</Label>
                    <Input id="edit-bathrooms" name="bathrooms" type="number" defaultValue={selectedProperty.bathrooms?.toString() || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-area">Area (sq ft)</Label>
                    <Input id="edit-area" name="area" type="number" defaultValue={selectedProperty.area?.toString() || ""} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedProperty(null);
                  }}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Property"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Property Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {propertyToDelete?.title}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setPropertyToDelete(null);
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
