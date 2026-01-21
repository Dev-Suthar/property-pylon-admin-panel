import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  Home,
  UsersRound,
  Mail,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  UserCog,
  User,
  AlertCircle,
  Search,
  Eye,
  MoreVertical,
  DollarSign,
  Bed,
  Bath,
  Square,
  Plus,
  Edit,
  Trash2,
  Filter,
  X,
  Star,
  TrendingUp,
  Bell,
  FileText,
} from "lucide-react";
import {
  companyService,
  Company,
  CompanyUser,
} from "@/services/companyService";
import { propertyService, Property } from "@/services/propertyService";
import { customerService, Customer } from "@/services/customerService";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertyDetailsDrawer } from "@/components/PropertyDetailsDrawer";
import { CustomerDetailsDrawer } from "@/components/CustomerDetailsDrawer";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatPriceWithCurrency } from "@/utils/priceUtils";
import { NotificationStatsCards } from "@/components/NotificationStatsCards";
import { SendNotificationForm } from "@/components/SendNotificationForm";
import { NotificationHistoryTable } from "@/components/NotificationHistoryTable";
import { FCMTokenManagement } from "@/components/FCMTokenManagement";
import { notificationService } from "@/services/notificationService";

interface CompanyDetailsDrawerProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <UserCheck className="h-4 w-4" />,
  owner: <UserCheck className="h-4 w-4" />,
  manager: <UserCog className="h-4 w-4" />,
  agent: <User className="h-4 w-4" />,
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-500",
  owner: "bg-blue-500",
  manager: "bg-green-500",
  agent: "bg-gray-500",
};

// Mock data for fallback
const mockUsers: CompanyUser[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+91 98765 43210",
    role: "admin",
    is_active: true,
    last_login: "2024-06-15T10:30:00Z",
    created_at: "2024-01-15T00:00:00Z",
  },
];

export function CompanyDetailsDrawer({
  company,
  open,
  onOpenChange,
}: CompanyDetailsDrawerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch full company details to ensure we have all fields
  const {
    data: companyDetails,
    isLoading: companyDetailsLoading,
  } = useQuery({
    queryKey: ["company-details", company?.id],
    queryFn: () => {
      if (!company?.id) return Promise.resolve(null);
      return companyService.getById(company.id);
    },
    enabled: !!company?.id && open,
    retry: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [isPropertyDrawerOpen, setIsPropertyDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState(false);

  // CRUD modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "agent",
    password: "",
  });
  const [propertyForm, setPropertyForm] = useState({
    title: "",
    property_type: "apartment",
    status: "open",
    price: "",
    address: "",
    city: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
  });
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
    budget_min: "",
    budget_max: "",
  });

  // Filter state
  const [userFilters, setUserFilters] = useState({ role: "", status: "" });
  const [propertyFilters, setPropertyFilters] = useState({
    status: "",
    property_type: "",
    price_min: "",
    price_max: "",
    bhk: "",
    area: "",
  });
  const [customerFilters, setCustomerFilters] = useState({
    status: "",
    type: "",
    budget_min: "",
    budget_max: "",
    bhk: "",
    area: "",
    property_type: "",
    hot_lead: "",
    preferred_localities: "",
  });

  // Filter modal state
  const [showUserFilterModal, setShowUserFilterModal] = useState(false);
  const [showPropertyFilterModal, setShowPropertyFilterModal] = useState(false);
  const [showCustomerFilterModal, setShowCustomerFilterModal] = useState(false);

  // Reset state when drawer opens/closes or company changes
  useEffect(() => {
    if (!open) {
      setActiveTab("overview");
      setSearchQuery("");
      setSelectedProperty(null);
      setIsPropertyDrawerOpen(false);
      setSelectedCustomer(null);
      setIsCustomerDrawerOpen(false);
    }
  }, [open, company?.id]);

  // Reset search and filters when switching tabs
  useEffect(() => {
    setSearchQuery("");
    setUserFilters({ role: "", status: "" });
    setPropertyFilters({
      status: "",
      property_type: "",
      price_min: "",
      price_max: "",
      bhk: "",
      area: "",
    });
    setCustomerFilters({
      status: "",
      type: "",
      budget_min: "",
      budget_max: "",
      bhk: "",
      area: "",
      property_type: "",
      hot_lead: "",
      preferred_localities: "",
    });
  }, [activeTab]);

  // Helper to check if filters are active
  const hasActiveUserFilters =
    userFilters.role !== "" || userFilters.status !== "";
  const hasActivePropertyFilters =
    propertyFilters.status !== "" ||
    propertyFilters.property_type !== "" ||
    propertyFilters.price_min !== "" ||
    propertyFilters.price_max !== "" ||
    propertyFilters.bhk !== "" ||
    propertyFilters.area !== "";
  const hasActiveCustomerFilters =
    customerFilters.status !== "" ||
    customerFilters.type !== "" ||
    customerFilters.budget_min !== "" ||
    customerFilters.budget_max !== "" ||
    customerFilters.bhk !== "" ||
    customerFilters.area !== "" ||
    customerFilters.property_type !== "" ||
    customerFilters.hot_lead !== "" ||
    customerFilters.preferred_localities !== "";

  // Reset filter functions
  const resetUserFilters = () => setUserFilters({ role: "", status: "" });
  const resetPropertyFilters = () =>
    setPropertyFilters({
      status: "",
      property_type: "",
      price_min: "",
      price_max: "",
      bhk: "",
      area: "",
    });
  const resetCustomerFilters = () =>
    setCustomerFilters({
      status: "",
      type: "",
      budget_min: "",
      budget_max: "",
      bhk: "",
      area: "",
      property_type: "",
      hot_lead: "",
      preferred_localities: "",
    });

  // Fetch company users with filters
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["company-users", company?.id, userFilters],
    queryFn: () => {
      if (!company?.id) return Promise.resolve([]);
      const params: any = { limit: 100 };
      if (userFilters.role) params.role = userFilters.role;
      if (userFilters.status) params.status = userFilters.status;
      // Note: search is handled client-side for now, but can be passed here
      return companyService.getUsers(company.id);
    },
    enabled: !!company?.id && open,
    retry: false,
  });

  // Fetch company properties with filters
  const {
    data: propertiesData,
    isLoading: propertiesLoading,
    error: propertiesError,
  } = useQuery({
    queryKey: ["company-properties", company?.id, propertyFilters],
    queryFn: () => {
      if (!company?.id)
        return Promise.resolve({
          properties: [],
          total: 0,
          page: 1,
          limit: 100,
        });
      const params: any = { company_id: company.id, limit: 100 };
      if (propertyFilters.status) params.status = propertyFilters.status;
      if (propertyFilters.property_type)
        params.property_type = propertyFilters.property_type;
      if (propertyFilters.price_min)
        params.price_min = parseFloat(propertyFilters.price_min);
      if (propertyFilters.price_max)
        params.price_max = parseFloat(propertyFilters.price_max);
      return propertyService.getAll(params);
    },
    enabled: !!company?.id && open,
    retry: false,
  });

  // Fetch notification stats
  const { data: notificationStats, isLoading: notificationStatsLoading } =
    useQuery({
      queryKey: ["notification-stats", company?.id],
      queryFn: () => notificationService.getStats(company?.id),
      enabled: !!company?.id && open && activeTab === "notifications",
      retry: false,
    });

  // Fetch company customers with filters
  const {
    data: customersData,
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: ["company-customers", company?.id, customerFilters],
    queryFn: () => {
      if (!company?.id)
        return Promise.resolve({
          customers: [],
          total: 0,
          page: 1,
          limit: 100,
        });
      const params: any = { company_id: company.id, limit: 100 };
      if (customerFilters.status) params.status = customerFilters.status;
      if (customerFilters.type) params.type = customerFilters.type;
      if (customerFilters.budget_min)
        params.budget_min = parseFloat(customerFilters.budget_min);
      if (customerFilters.budget_max)
        params.budget_max = parseFloat(customerFilters.budget_max);
      return customerService.getAll(params);
    },
    enabled: !!company?.id && open,
    retry: false,
  });

  // Handle both old array format and new object format from backend
  const companyUsers: CompanyUser[] = Array.isArray(users)
    ? users
    : (users as any)?.users || (usersError ? mockUsers : []);
  const properties = propertiesData?.properties || [];
  const customers = customersData?.customers || [];

  // Mutations for CRUD operations
  const createUserMutation = useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password?: string;
      phone?: string;
      role: string;
    }) => companyService.createUser(company!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-users", company?.id],
      });
      setShowUserModal(false);
      setUserForm({
        name: "",
        email: "",
        phone: "",
        role: "agent",
        password: "",
      });
      toast({ title: "Success", description: "User created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      companyService.updateUser(company!.id, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-users", company?.id],
      });
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({
        name: "",
        email: "",
        phone: "",
        role: "agent",
        password: "",
      });
      toast({ title: "Success", description: "User updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      companyService.deleteUser(company!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-users", company?.id],
      });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: (data: any) =>
      propertyService.createForCompany(company!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-properties", company?.id],
      });
      setShowPropertyModal(false);
      setPropertyForm({
        title: "",
        property_type: "apartment",
        status: "open",
        price: "",
        address: "",
        city: "",
        bedrooms: "",
        bathrooms: "",
        area: "",
      });
      toast({ title: "Success", description: "Property created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive",
      });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ propertyId, data }: { propertyId: string; data: any }) =>
      propertyService.updateForCompany(company!.id, propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-properties", company?.id],
      });
      setShowPropertyModal(false);
      setEditingProperty(null);
      setPropertyForm({
        title: "",
        property_type: "apartment",
        status: "open",
        price: "",
        address: "",
        city: "",
        bedrooms: "",
        bathrooms: "",
        area: "",
      });
      toast({ title: "Success", description: "Property updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update property",
        variant: "destructive",
      });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (propertyId: string) =>
      propertyService.deleteForCompany(company!.id, propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-properties", company?.id],
      });
      toast({ title: "Success", description: "Property deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete property",
        variant: "destructive",
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: any) =>
      customerService.createForCompany(company!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-customers", company?.id],
      });
      setShowCustomerModal(false);
      setCustomerForm({
        name: "",
        email: "",
        phone: "",
        status: "active",
        budget_min: "",
        budget_max: "",
      });
      toast({ title: "Success", description: "Customer created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ customerId, data }: { customerId: string; data: any }) =>
      customerService.updateForCompany(company!.id, customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-customers", company?.id],
      });
      setShowCustomerModal(false);
      setEditingCustomer(null);
      setCustomerForm({
        name: "",
        email: "",
        phone: "",
        status: "active",
        budget_min: "",
        budget_max: "",
      });
      toast({ title: "Success", description: "Customer updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (customerId: string) =>
      customerService.deleteForCompany(company!.id, customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-customers", company?.id],
      });
      toast({ title: "Success", description: "Customer deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      name: "",
      email: "",
      phone: "",
      role: "agent",
      password: "",
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user: CompanyUser) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      password: "",
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = (user: CompanyUser) => {
    if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleAddProperty = () => {
    setEditingProperty(null);
    setPropertyForm({
      title: "",
      property_type: "apartment",
      status: "open",
      price: "",
      address: "",
      city: "",
      bedrooms: "",
      bathrooms: "",
      area: "",
    });
    setShowPropertyModal(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setPropertyForm({
      title: property.title,
      property_type: property.property_type,
      status: property.status,
      price: property.price?.toString() || "",
      address: property.address || "",
      city: property.city || "",
      bedrooms: property.bedrooms?.toString() || "",
      bathrooms: property.bathrooms?.toString() || "",
      area: property.area?.toString() || "",
    });
    setShowPropertyModal(true);
  };

  const handleDeleteProperty = (property: Property) => {
    if (
      confirm(`Are you sure you want to delete property "${property.title}"?`)
    ) {
      deletePropertyMutation.mutate(property.id);
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: "",
      email: "",
      phone: "",
      status: "active",
      budget_min: "",
      budget_max: "",
    });
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      status: customer.status,
      budget_min: customer.budget_min?.toString() || "",
      budget_max: customer.budget_max?.toString() || "",
    });
    setShowCustomerModal(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete customer ${customer.name}?`)) {
      deleteCustomerMutation.mutate(customer.id);
    }
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    if (editingUser) {
      // Only include password if it's provided (not empty)
      const updateData: any = {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
      };
      if (userForm.password && userForm.password.trim() !== "") {
        updateData.password = userForm.password;
      }
      updateUserMutation.mutate({ userId: editingUser.id, data: updateData });
    } else {
      createUserMutation.mutate(userForm);
    }
  };

  const handleSaveProperty = () => {
    if (
      !propertyForm.title ||
      !propertyForm.property_type ||
      !propertyForm.status
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    const data = {
      ...propertyForm,
      price: propertyForm.price ? parseFloat(propertyForm.price) : undefined,
      bedrooms: propertyForm.bedrooms
        ? parseInt(propertyForm.bedrooms)
        : undefined,
      bathrooms: propertyForm.bathrooms
        ? parseInt(propertyForm.bathrooms)
        : undefined,
      area: propertyForm.area ? parseFloat(propertyForm.area) : undefined,
    };
    if (editingProperty) {
      updatePropertyMutation.mutate({ propertyId: editingProperty.id, data });
    } else {
      createPropertyMutation.mutate(data);
    }
  };

  const handleSaveCustomer = () => {
    if (!customerForm.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    const data = {
      ...customerForm,
      budget_min: customerForm.budget_min
        ? parseFloat(customerForm.budget_min)
        : undefined,
      budget_max: customerForm.budget_max
        ? parseFloat(customerForm.budget_max)
        : undefined,
    };
    if (editingCustomer) {
      updateCustomerMutation.mutate({ customerId: editingCustomer.id, data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  // Filter data based on search
  const filteredUsers = companyUsers.filter((user: CompanyUser) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !userFilters.role || user.role === userFilters.role;
    const matchesStatus =
      !userFilters.status ||
      (userFilters.status === "active" && user.is_active) ||
      (userFilters.status === "inactive" && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      !propertyFilters.status || property.status === propertyFilters.status;
    const matchesType =
      !propertyFilters.property_type ||
      property.property_type === propertyFilters.property_type;
    const matchesPriceMin =
      !propertyFilters.price_min ||
      (property.price &&
        property.price >= parseFloat(propertyFilters.price_min));
    const matchesPriceMax =
      !propertyFilters.price_max ||
      (property.price &&
        property.price <= parseFloat(propertyFilters.price_max));

    // BHK filter
    let matchesBhk = true;
    if (propertyFilters.bhk) {
      const propertyBhk = property.bedrooms ? `${property.bedrooms} BHK` : "";
      if (propertyFilters.bhk === "Office") {
        matchesBhk = propertyBhk === "Office" || property.bedrooms === 0;
      } else {
        matchesBhk = propertyBhk === propertyFilters.bhk;
      }
    }

    // Area filter
    let matchesArea = true;
    if (propertyFilters.area && property.area) {
      const area =
        typeof property.area === "string"
          ? parseFloat(property.area)
          : property.area;
      const [min, max] = propertyFilters.area
        .split("-")
        .map((v) => v.replace("+", "").trim());
      if (propertyFilters.area.includes("+")) {
        matchesArea = area >= parseFloat(min);
      } else if (min && max) {
        matchesArea = area >= parseFloat(min) && area <= parseFloat(max);
      }
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesPriceMin &&
      matchesPriceMax &&
      matchesBhk &&
      matchesArea
    );
  });

  const filteredCustomers = customers.filter(
    (
      customer: Customer & {
        type?: string;
        is_hot_lead?: boolean;
        preferred_localities?: string;
      }
    ) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        !customerFilters.status || customer.status === customerFilters.status;
      const matchesType =
        !customerFilters.type || customer.type === customerFilters.type;
      const matchesBudgetMin =
        !customerFilters.budget_min ||
        (customer.budget_min &&
          customer.budget_min >= parseFloat(customerFilters.budget_min));
      const matchesBudgetMax =
        !customerFilters.budget_max ||
        (customer.budget_max &&
          customer.budget_max <= parseFloat(customerFilters.budget_max));

      // Hot lead filter
      const matchesHotLead =
        !customerFilters.hot_lead ||
        (customerFilters.hot_lead === "yes" && customer.is_hot_lead) ||
        (customerFilters.hot_lead === "no" && !customer.is_hot_lead);

      // Preferred localities filter
      const matchesLocalities =
        !customerFilters.preferred_localities ||
        (customer.preferred_localities &&
          customer.preferred_localities
            .toLowerCase()
            .includes(customerFilters.preferred_localities.toLowerCase()));

      // BHK, Area, Property Type filters would need to check customer preferences
      // These are typically stored in customer preferences, so we'll skip for now
      // but the structure is ready for when that data is available

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesBudgetMin &&
        matchesBudgetMax &&
        matchesHotLead &&
        matchesLocalities
      );
    }
  );

  if (!company) return null;
  
  // Use fetched company details if available, otherwise fall back to prop
  const displayCompany = companyDetails || company;

  const groupedUsers = filteredUsers.reduce(
    (acc: Record<string, CompanyUser[]>, user: CompanyUser) => {
      const role = user.role || "agent";
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(user);
      return acc;
    },
    {} as Record<string, CompanyUser[]>
  );

  const roleOrder = ["admin", "owner", "manager", "agent"];

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A";
    return formatPriceWithCurrency(amount, true); // Use converter format (K, L, Cr)
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96vh]">
          <div className="overflow-y-auto">
            <DrawerHeader className="border-b bg-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 shadow-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <DrawerTitle className="text-2xl text-slate-900">
                      {displayCompany.name}
                    </DrawerTitle>
                    <DrawerDescription className="mt-1 text-slate-600">
                      Company details and management
                    </DrawerDescription>
                  </div>
                </div>
                <Badge variant={displayCompany.is_active ? "success" : "secondary"}>
                  {displayCompany.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </DrawerHeader>

            <div className="p-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-5 mb-6 bg-slate-100 rounded-xl p-1">
                  <TabsTrigger
                    value="overview"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Users ({companyUsers.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="properties"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Properties ({properties.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="customers"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Customers ({customers.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Bell className="h-4 w-4 mr-1" />
                    Notifications
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              Email
                            </p>
                            <p className="text-sm text-slate-600">
                              {displayCompany.email}
                            </p>
                          </div>
                        </div>
                        {displayCompany.phone && (
                          <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                Phone
                              </p>
                              <p className="text-sm text-slate-600">
                                {displayCompany.phone}
                              </p>
                            </div>
                          </div>
                        )}
                        {displayCompany.address && (
                          <div className="flex items-start gap-3 md:col-span-2">
                            <MapPin className="h-5 w-5 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                Address
                              </p>
                              <p className="text-sm text-slate-600">
                                {displayCompany.address}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <UsersRound className="h-5 w-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              Team Members
                            </p>
                            <p className="text-sm text-slate-600">
                              {displayCompany.team_members !== undefined && displayCompany.team_members !== null 
                                ? displayCompany.team_members 
                                : '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              Years of Experience
                            </p>
                            <p className="text-sm text-slate-600">
                              {displayCompany.years_of_experience !== undefined && displayCompany.years_of_experience !== null 
                                ? displayCompany.years_of_experience 
                                : '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 md:col-span-2">
                          <Building2 className="h-5 w-5 text-slate-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700 mb-2">
                              Office Photo
                            </p>
                            {displayCompany.office_photo_url ? (
                              <img
                                src={displayCompany.office_photo_url}
                                alt="Company office"
                                className="rounded-lg border border-slate-200 max-w-full h-auto max-h-64 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <p className="text-sm text-slate-400 italic">No office photo uploaded</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              Created
                            </p>
                            <p className="text-sm text-slate-600">
                              {format(new Date(displayCompany.created_at), "PPp")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Identity Proof Documents */}
                  {displayCompany.documents && displayCompany.documents.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Identity Proof Documents</CardTitle>
                        <CardDescription>
                          Broker identity proof documents uploaded during onboarding
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {displayCompany.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setPreviewDoc(doc)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4 text-slate-500" />
                                  <span className="text-sm font-medium text-slate-700">
                                    {doc.document_type || "Document"}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {doc.mime_type?.includes('pdf') ? 'PDF' : 
                                   doc.mime_type?.includes('image') ? 'Image' : 
                                   'File'}
                                </Badge>
                              </div>
                              {doc.thumbnail_url || (doc.mime_type?.startsWith('image/')) ? (
                                <div className="mb-2">
                                  <img
                                    src={doc.thumbnail_url || doc.url}
                                    alt="Document"
                                    className="w-full h-32 object-cover rounded border border-slate-200"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="mb-2 h-32 bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                                  <FileText className="h-8 w-8 text-slate-400" />
                                </div>
                              )}
                              <div className="space-y-1">
                                <p className="text-xs text-slate-500">
                                  {format(new Date(doc.created_at), "MMM d, yyyy")}
                                </p>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye className="h-3 w-3" />
                                  View Document
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Document Preview Dialog */}
                  <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>
                          {previewDoc?.document_type || "Document Preview"}
                        </DialogTitle>
                        <DialogDescription>
                          {previewDoc?.mime_type || ""}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="w-full">
                        {previewDoc?.mime_type?.includes("pdf") ? (
                          <iframe
                            src={previewDoc?.url}
                            className="w-full h-[70vh] rounded border"
                            title="PDF Preview"
                          />
                        ) : previewDoc?.mime_type?.startsWith("image/") ? (
                          <img
                            src={previewDoc?.url}
                            alt="Document"
                            className="w-full max-h-[70vh] object-contain rounded border bg-white"
                          />
                        ) : (
                          <div className="p-6 border rounded bg-slate-50 text-slate-600">
                            Preview not available. Use “View Document” to open.
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewDoc(null)}>
                          Close
                        </Button>
                        <Button asChild>
                          <a href={previewDoc?.url} target="_blank" rel="noopener noreferrer">
                            Open in new tab
                          </a>
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-slate-600">
                            Total Users
                          </CardTitle>
                          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-slate-900">
                          {companyUsers.length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Active users in company
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-slate-600">
                            Total Properties
                          </CardTitle>
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                            <Home className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-slate-900">
                          {properties.length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Properties listed
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-slate-600">
                            Total Customers
                          </CardTitle>
                          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                            <UsersRound className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-slate-900">
                          {customers.length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Registered customers
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearchQuery(e.target.value)
                          }
                          className="pl-11 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                        />
                      </div>
                      <Button onClick={handleAddUser} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add User
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUserFilterModal(true)}
                        className="gap-2 h-9"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                        {hasActiveUserFilters && (
                          <Badge
                            variant="secondary"
                            className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                          >
                            !
                          </Badge>
                        )}
                      </Button>
                      {hasActiveUserFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetUserFilters}
                          className="gap-1 h-9"
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {usersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loading size="lg" />
                    </div>
                  ) : usersError ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Using mock data. Backend API not available.
                      </AlertDescription>
                    </Alert>
                  ) : filteredUsers.length === 0 ? (
                    <Card className="border-0 shadow-lg">
                      <CardContent className="py-16 text-center">
                        <div className="mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 p-6 w-fit mx-auto">
                          <Users className="h-12 w-12 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          No users found
                        </h3>
                        <p className="text-sm text-slate-500">
                          {searchQuery
                            ? "Try adjusting your search query"
                            : "This company has no users yet"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-0">
                        <div className="space-y-6 p-6">
                          {roleOrder.map((role) => {
                            const usersInRole = groupedUsers[role] || [];
                            if (usersInRole.length === 0) return null;

                            return (
                              <div key={role} className="space-y-3">
                                <div className="flex items-center gap-2">
                                  {roleIcons[role] || (
                                    <User className="h-4 w-4" />
                                  )}
                                  <h4 className="font-semibold capitalize text-slate-900">
                                    {role === "admin" ? "Owner/Admin" : role}s (
                                    {usersInRole.length})
                                  </h4>
                                </div>
                                <div className="grid gap-3 pl-6">
                                  {usersInRole.map((user: CompanyUser) => (
                                    <div
                                      key={user.id}
                                      className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold ${
                                            roleColors[user.role] ||
                                            "bg-gray-500"
                                          }`}
                                        >
                                          {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="font-medium text-slate-900">
                                            {user.name}
                                          </p>
                                          <p className="text-sm text-slate-500">
                                            {user.email}
                                          </p>
                                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                            {user.phone && (
                                              <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {user.phone}
                                              </span>
                                            )}
                                            {user.age !== undefined && user.age !== null && (
                                              <span>Age: {user.age}</span>
                                            )}
                                            {user.gender && (
                                              <span>• {user.gender}</span>
                                            )}
                                          </div>
                                          {user.address && (
                                            <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                                              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                              <span className="line-clamp-1">{user.address}</span>
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <Badge
                                            variant="outline"
                                            className="capitalize"
                                          >
                                            {user.role}
                                          </Badge>
                                          {user.last_login && (
                                            <p className="text-xs text-slate-500 mt-1">
                                              Last login:{" "}
                                              {format(
                                                new Date(user.last_login),
                                                "MMM d, yyyy"
                                              )}
                                            </p>
                                          )}
                                        </div>
                                        <Badge
                                          variant={
                                            user.is_active
                                              ? "success"
                                              : "secondary"
                                          }
                                        >
                                          {user.is_active
                                            ? "Active"
                                            : "Inactive"}
                                        </Badge>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleEditUser(user)
                                              }
                                            >
                                              <Edit className="mr-2 h-4 w-4" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() =>
                                                handleDeleteUser(user)
                                              }
                                              className="text-red-600"
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Properties Tab */}
                <TabsContent value="properties" className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search properties..."
                          value={searchQuery}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearchQuery(e.target.value)
                          }
                          className="pl-11 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                        />
                      </div>
                      <Button onClick={handleAddProperty} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Property
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPropertyFilterModal(true)}
                        className="gap-2 h-9"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                        {hasActivePropertyFilters && (
                          <Badge
                            variant="secondary"
                            className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                          >
                            !
                          </Badge>
                        )}
                      </Button>
                      {hasActivePropertyFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetPropertyFilters}
                          className="gap-1 h-9"
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {propertiesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loading size="lg" />
                    </div>
                  ) : propertiesError ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Using mock data. Backend API not available.
                      </AlertDescription>
                    </Alert>
                  ) : filteredProperties.length === 0 ? (
                    <Card className="border-0 shadow-lg">
                      <CardContent className="py-16 text-center">
                        <div className="mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 p-6 w-fit mx-auto">
                          <Home className="h-12 w-12 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          No properties found
                        </h3>
                        <p className="text-sm text-slate-500">
                          {searchQuery
                            ? "Try adjusting your search query"
                            : "This company has no properties yet"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="rounded-xl border-0 bg-white shadow-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Title</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead className="hidden md:table-cell">
                                Details
                              </TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProperties.map((property: Property) => (
                              <TableRow
                                key={property.id}
                                className="cursor-pointer hover:bg-slate-50"
                                onClick={() => {
                                  setSelectedProperty(property);
                                  setIsPropertyDrawerOpen(true);
                                }}
                              >
                                <TableCell className="font-medium">
                                  {property.title}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {property.property_type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-600">
                                  {property.city || property.address || "N/A"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-slate-600">
                                  <div className="flex items-center gap-3 text-sm">
                                    {property.bedrooms !== undefined &&
                                      property.bedrooms > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Bed className="h-3.5 w-3.5" />
                                          <span>{property.bedrooms}</span>
                                        </div>
                                      )}
                                    {property.bathrooms !== undefined &&
                                      property.bathrooms > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Bath className="h-3.5 w-3.5" />
                                          <span>{property.bathrooms}</span>
                                        </div>
                                      )}
                                    {property.area && (
                                      <div className="flex items-center gap-1">
                                        <Square className="h-3.5 w-3.5" />
                                        <span>{property.area} sq ft</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {formatCurrency(property.price)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      property.status === "available"
                                        ? "success"
                                        : property.status === "sold"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="capitalize"
                                  >
                                    {property.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      asChild
                                      onClick={(e: React.MouseEvent) =>
                                        e.stopPropagation()
                                      }
                                    >
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e: React.MouseEvent) => {
                                          e.stopPropagation();
                                          setSelectedProperty(property);
                                          setIsPropertyDrawerOpen(true);
                                        }}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e: React.MouseEvent) => {
                                          e.stopPropagation();
                                          handleEditProperty(property);
                                        }}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e: React.MouseEvent) => {
                                          e.stopPropagation();
                                          handleDeleteProperty(property);
                                        }}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Customers Tab */}
                <TabsContent value="customers" className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          placeholder="Search customers..."
                          value={searchQuery}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearchQuery(e.target.value)
                          }
                          className="pl-11 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                        />
                      </div>
                      <Button onClick={handleAddCustomer} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Customer
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomerFilterModal(true)}
                        className="gap-2 h-9"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                        {hasActiveCustomerFilters && (
                          <Badge
                            variant="secondary"
                            className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                          >
                            !
                          </Badge>
                        )}
                      </Button>
                      {hasActiveCustomerFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetCustomerFilters}
                          className="gap-1 h-9"
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {customersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loading size="lg" />
                    </div>
                  ) : customersError ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Using mock data. Backend API not available.
                      </AlertDescription>
                    </Alert>
                  ) : filteredCustomers.length === 0 ? (
                    <Card className="border-0 shadow-lg">
                      <CardContent className="py-16 text-center">
                        <div className="mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 p-6 w-fit mx-auto">
                          <UsersRound className="h-12 w-12 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          No customers found
                        </h3>
                        <p className="text-sm text-slate-500">
                          {searchQuery
                            ? "Try adjusting your search query"
                            : "This company has no customers yet"}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="rounded-xl border-0 bg-white shadow-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Name</TableHead>
                              <TableHead className="hidden md:table-cell">
                                Email
                              </TableHead>
                              <TableHead className="hidden lg:table-cell">
                                Phone
                              </TableHead>
                              <TableHead>Budget</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCustomers.map(
                              (
                                customer: Customer & {
                                  type?: string;
                                  is_hot_lead?: boolean;
                                  preferred_localities?: string;
                                }
                              ) => (
                                <TableRow
                                  key={customer.id}
                                  className="cursor-pointer hover:bg-slate-50"
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setIsCustomerDrawerOpen(true);
                                  }}
                                >
                                  <TableCell className="font-medium">
                                    {customer.name}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell text-slate-600">
                                    {customer.email || "N/A"}
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell text-slate-600">
                                    {customer.phone || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {customer.budget_min && customer.budget_max
                                      ? `${formatCurrency(
                                          customer.budget_min
                                        )} - ${formatCurrency(
                                          customer.budget_max
                                        )}`
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        customer.status === "active"
                                          ? "success"
                                          : "secondary"
                                      }
                                      className="capitalize"
                                    >
                                      {customer.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell
                                    className="text-right"
                                    onClick={(e: React.MouseEvent) =>
                                      e.stopPropagation()
                                    }
                                  >
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            setSelectedCustomer(customer);
                                            setIsCustomerDrawerOpen(true);
                                          }}
                                        >
                                          <Eye className="mr-2 h-4 w-4" />
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            handleEditCustomer(customer);
                                          }}
                                        >
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            handleDeleteCustomer(customer);
                                          }}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Push Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  {company && (
                    <>
                      {/* Stats */}
                      {notificationStats && (
                        <NotificationStatsCards
                          stats={notificationStats}
                          isLoading={notificationStatsLoading}
                        />
                      )}

                      {/* Send Notification */}
                      <SendNotificationForm
                        companyId={company.id}
                        onSuccess={() => {
                          queryClient.invalidateQueries({
                            queryKey: ["notification-stats", company.id],
                          });
                        }}
                      />

                      {/* History */}
                      <NotificationHistoryTable companyId={company.id} />

                      {/* FCM Tokens */}
                      <FCMTokenManagement companyId={company.id} />
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {selectedProperty && (
        <PropertyDetailsDrawer
          property={selectedProperty}
          open={isPropertyDrawerOpen}
          onOpenChange={setIsPropertyDrawerOpen}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailsDrawer
          customer={selectedCustomer}
          open={isCustomerDrawerOpen}
          onOpenChange={setIsCustomerDrawerOpen}
        />
      )}

      {/* User Create/Edit Dialog */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user information"
                : "Create a new user for this company"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={userForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
                placeholder="Enter user name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={userForm.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserForm({ ...userForm, phone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={userForm.role}
                onValueChange={(value: string) =>
                  setUserForm({ ...userForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingUser ? "(leave empty to keep current)" : ""}
              </Label>
              <Input
                id="password"
                type="password"
                value={userForm.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                placeholder={
                  editingUser
                    ? "Enter new password (optional)"
                    : "Leave empty for default password"
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={
                createUserMutation.isPending || updateUserMutation.isPending
              }
            >
              {editingUser ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Property Create/Edit Dialog */}
      <Dialog open={showPropertyModal} onOpenChange={setShowPropertyModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? "Edit Property" : "Add New Property"}
            </DialogTitle>
            <DialogDescription>
              {editingProperty
                ? "Update property information"
                : "Create a new property for this company"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={propertyForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPropertyForm({ ...propertyForm, title: e.target.value })
                }
                placeholder="Enter property title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property_type">Type *</Label>
                <Select
                  value={propertyForm.property_type}
                  onValueChange={(value: string) =>
                    setPropertyForm({ ...propertyForm, property_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="shop">Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={propertyForm.status}
                  onValueChange={(value: string) =>
                    setPropertyForm({ ...propertyForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="dealing">Dealing</SelectItem>
                    <SelectItem value="discussion">Discussion</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={propertyForm.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPropertyForm({ ...propertyForm, price: e.target.value })
                  }
                  placeholder="Enter price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={propertyForm.bedrooms}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPropertyForm({
                      ...propertyForm,
                      bedrooms: e.target.value,
                    })
                  }
                  placeholder="No. of bedrooms"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={propertyForm.bathrooms}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPropertyForm({
                      ...propertyForm,
                      bathrooms: e.target.value,
                    })
                  }
                  placeholder="No. of bathrooms"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={propertyForm.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPropertyForm({ ...propertyForm, address: e.target.value })
                }
                placeholder="Enter address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={propertyForm.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPropertyForm({ ...propertyForm, city: e.target.value })
                  }
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area (sq ft)</Label>
                <Input
                  id="area"
                  type="number"
                  value={propertyForm.area}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPropertyForm({ ...propertyForm, area: e.target.value })
                  }
                  placeholder="Enter area"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPropertyModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProperty}
              disabled={
                createPropertyMutation.isPending ||
                updatePropertyMutation.isPending
              }
            >
              {editingProperty ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Create/Edit Dialog */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Update customer information"
                : "Create a new customer for this company"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name *</Label>
              <Input
                id="customer-name"
                value={customerForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomerForm({ ...customerForm, name: e.target.value })
                }
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerForm.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomerForm({ ...customerForm, email: e.target.value })
                }
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={customerForm.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomerForm({ ...customerForm, phone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-status">Status</Label>
              <Select
                value={customerForm.status}
                onValueChange={(value: string) =>
                  setCustomerForm({ ...customerForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_min">Min Budget</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={customerForm.budget_min}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomerForm({
                      ...customerForm,
                      budget_min: e.target.value,
                    })
                  }
                  placeholder="Min budget"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">Max Budget</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={customerForm.budget_max}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomerForm({
                      ...customerForm,
                      budget_max: e.target.value,
                    })
                  }
                  placeholder="Max budget"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomerModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomer}
              disabled={
                createCustomerMutation.isPending ||
                updateCustomerMutation.isPending
              }
            >
              {editingCustomer ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Filter Modal */}
      <Dialog open={showUserFilterModal} onOpenChange={setShowUserFilterModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Users</DialogTitle>
            <DialogDescription>
              Filter users by role and status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Role</Label>
              <div className="flex flex-wrap gap-2">
                {["all", "admin", "owner", "manager", "agent"].map((role) => (
                  <Button
                    key={role}
                    variant={
                      userFilters.role === (role === "all" ? "" : role)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setUserFilters({
                        ...userFilters,
                        role: role === "all" ? "" : role,
                      })
                    }
                  >
                    {role === "all"
                      ? "All Roles"
                      : role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {["all", "active", "inactive"].map((status) => (
                  <Button
                    key={status}
                    variant={
                      userFilters.status === (status === "all" ? "" : status)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setUserFilters({
                        ...userFilters,
                        status: status === "all" ? "" : status,
                      })
                    }
                  >
                    {status === "all"
                      ? "All Status"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetUserFilters}>
              Reset
            </Button>
            <Button onClick={() => setShowUserFilterModal(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Property Filter Modal */}
      <Dialog
        open={showPropertyFilterModal}
        onOpenChange={setShowPropertyFilterModal}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter Properties</DialogTitle>
            <DialogDescription>
              Filter properties by various criteria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {["all", "open", "dealing", "discussion", "closed"].map(
                  (status) => (
                    <Button
                      key={status}
                      variant={
                        propertyFilters.status ===
                        (status === "all" ? "" : status)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setPropertyFilters({
                          ...propertyFilters,
                          status: status === "all" ? "" : status,
                        })
                      }
                    >
                      {status === "all"
                        ? "All Status"
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  )
                )}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Property Type</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "all",
                  "apartment",
                  "villa",
                  "penthouse",
                  "office",
                  "shop",
                ].map((type) => (
                  <Button
                    key={type}
                    variant={
                      propertyFilters.property_type ===
                      (type === "all" ? "" : type)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setPropertyFilters({
                        ...propertyFilters,
                        property_type: type === "all" ? "" : type,
                      })
                    }
                  >
                    {type === "all"
                      ? "All Types"
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>BHK</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "all",
                  "1 BHK",
                  "2 BHK",
                  "3 BHK",
                  "4 BHK",
                  "5+ BHK",
                  "Office",
                ].map((bhk) => (
                  <Button
                    key={bhk}
                    variant={
                      propertyFilters.bhk === (bhk === "all" ? "" : bhk)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setPropertyFilters({
                        ...propertyFilters,
                        bhk: bhk === "all" ? "" : bhk,
                      })
                    }
                  >
                    {bhk === "all" ? "All BHK" : bhk}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Area Range (sq ft)</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "all",
                  "0-1000",
                  "1000-2000",
                  "2000-3000",
                  "3000-5000",
                  "5000+",
                ].map((area) => (
                  <Button
                    key={area}
                    variant={
                      propertyFilters.area === (area === "all" ? "" : area)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setPropertyFilters({
                        ...propertyFilters,
                        area: area === "all" ? "" : area,
                      })
                    }
                  >
                    {area === "all" ? "All Areas" : area}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Price</Label>
                <Input
                  type="number"
                  placeholder="Min price"
                  value={propertyFilters.price_min}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPropertyFilters({
                      ...propertyFilters,
                      price_min: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Price</Label>
                <Input
                  type="number"
                  placeholder="Max price"
                  value={propertyFilters.price_max}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPropertyFilters({
                      ...propertyFilters,
                      price_max: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetPropertyFilters}>
              Reset
            </Button>
            <Button onClick={() => setShowPropertyFilterModal(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Filter Modal */}
      <Dialog
        open={showCustomerFilterModal}
        onOpenChange={setShowCustomerFilterModal}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter Customers</DialogTitle>
            <DialogDescription>
              Filter customers by various criteria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {["all", "active", "inactive"].map((status) => (
                  <Button
                    key={status}
                    variant={
                      customerFilters.status ===
                      (status === "all" ? "" : status)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setCustomerFilters({
                        ...customerFilters,
                        status: status === "all" ? "" : status,
                      })
                    }
                  >
                    {status === "all"
                      ? "All Status"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Customer Type</Label>
              <div className="flex flex-wrap gap-2">
                {["all", "buyer", "owner", "both"].map((type) => (
                  <Button
                    key={type}
                    variant={
                      customerFilters.type === (type === "all" ? "" : type)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setCustomerFilters({
                        ...customerFilters,
                        type: type === "all" ? "" : type,
                      })
                    }
                  >
                    {type === "all"
                      ? "All Types"
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>BHK Preference</Label>
              <div className="flex flex-wrap gap-2">
                {["all", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK"].map(
                  (bhk) => (
                    <Button
                      key={bhk}
                      variant={
                        customerFilters.bhk === (bhk === "all" ? "" : bhk)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setCustomerFilters({
                          ...customerFilters,
                          bhk: bhk === "all" ? "" : bhk,
                        })
                      }
                    >
                      {bhk === "all" ? "All BHK" : bhk}
                    </Button>
                  )
                )}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Area Preference</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "all",
                  "0-1000",
                  "1000-2000",
                  "2000-3000",
                  "3000-5000",
                  "5000+",
                ].map((area) => (
                  <Button
                    key={area}
                    variant={
                      customerFilters.area === (area === "all" ? "" : area)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setCustomerFilters({
                        ...customerFilters,
                        area: area === "all" ? "" : area,
                      })
                    }
                  >
                    {area === "all" ? "All Areas" : area}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Property Type Preference</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "all",
                  "apartment",
                  "villa",
                  "penthouse",
                  "office",
                  "shop",
                ].map((type) => (
                  <Button
                    key={type}
                    variant={
                      customerFilters.property_type ===
                      (type === "all" ? "" : type)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setCustomerFilters({
                        ...customerFilters,
                        property_type: type === "all" ? "" : type,
                      })
                    }
                  >
                    {type === "all"
                      ? "All Types"
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Hot Lead</Label>
              <div className="flex flex-wrap gap-2">
                {["all", "yes", "no"].map((hotLead) => (
                  <Button
                    key={hotLead}
                    variant={
                      customerFilters.hot_lead ===
                      (hotLead === "all" ? "" : hotLead)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setCustomerFilters({
                        ...customerFilters,
                        hot_lead: hotLead === "all" ? "" : hotLead,
                      })
                    }
                  >
                    {hotLead === "all"
                      ? "All"
                      : hotLead === "yes"
                      ? "Hot Leads Only"
                      : "Regular Leads"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Budget</Label>
                <Input
                  type="number"
                  placeholder="Min budget"
                  value={customerFilters.budget_min}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomerFilters({
                      ...customerFilters,
                      budget_min: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Budget</Label>
                <Input
                  type="number"
                  placeholder="Max budget"
                  value={customerFilters.budget_max}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCustomerFilters({
                      ...customerFilters,
                      budget_max: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preferred Localities</Label>
              <Input
                placeholder="Enter localities (e.g., Bopal, Shela, Prahladnagar)"
                value={customerFilters.preferred_localities}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomerFilters({
                    ...customerFilters,
                    preferred_localities: e.target.value,
                  })
                }
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter comma-separated localities to filter by preferred areas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetCustomerFilters}>
              Reset
            </Button>
            <Button onClick={() => setShowCustomerFilterModal(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
