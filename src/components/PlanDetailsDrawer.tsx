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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  DollarSign,
  Calendar,
  Tag,
  Edit,
  X,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { formatPriceWithCurrency } from "@/utils/priceUtils";
import {
  subscriptionPlanService,
  SubscriptionPlan,
} from "@/services/subscriptionPlanService";
import { format } from "date-fns";

interface PlanDetailsDrawerProps {
  plan: SubscriptionPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openEditSheet?: boolean;
  onEditSheetOpenChange?: (open: boolean) => void;
  isCreateMode?: boolean;
  onCreateModeChange?: (open: boolean) => void;
}

export function PlanDetailsDrawer({
  plan,
  open,
  onOpenChange,
  openEditSheet: externalEditSheetOpen,
  onEditSheetOpenChange: externalEditSheetOpenChange,
  isCreateMode: externalCreateMode,
  onCreateModeChange: externalCreateModeChange,
}: PlanDetailsDrawerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [internalEditSheetOpen, setInternalEditSheetOpen] = useState(false);
  const [internalCreateMode, setInternalCreateMode] = useState(false);

  // Use external control if provided, otherwise use internal state
  const isEditSheetOpen =
    externalEditSheetOpen !== undefined
      ? externalEditSheetOpen
      : internalEditSheetOpen;
  const setIsEditSheetOpen =
    externalEditSheetOpenChange || setInternalEditSheetOpen;

  const isCreateMode =
    externalCreateMode !== undefined
      ? externalCreateMode
      : internalCreateMode;
  const setIsCreateMode =
    externalCreateModeChange || setInternalCreateMode;

  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    period: "monthly" as "monthly" | "yearly",
    features: [] as string[],
    popular: false,
    max_properties: "",
    max_customers: "",
    is_active: true,
  });

  const [newFeature, setNewFeature] = useState("");

  const {
    data: planDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["plan-details", plan?.id],
    queryFn: () =>
      plan?.id
        ? subscriptionPlanService.getById(plan.id)
        : Promise.resolve(null),
    enabled: !!plan?.id && (open || isEditSheetOpen) && !isCreateMode,
    retry: false,
  });

  // Initialize form when plan changes or edit/create mode opens
  useEffect(() => {
    if (isCreateMode) {
      setEditForm({
        name: "",
        price: "",
        period: "monthly",
        features: [],
        popular: false,
        max_properties: "",
        max_customers: "",
        is_active: true,
      });
      setNewFeature("");
    } else if (isEditSheetOpen && plan) {
      const dataToUse = planDetails || plan;
      if (dataToUse) {
        setEditForm({
          name: dataToUse.name,
          price: dataToUse.price.toString(),
          period: dataToUse.period,
          features: dataToUse.features || [],
          popular: dataToUse.popular || false,
          max_properties: dataToUse.max_properties?.toString() || "",
          max_customers: dataToUse.max_customers?.toString() || "",
          is_active: dataToUse.is_active,
        });
        setNewFeature("");
      }
    }
  }, [isEditSheetOpen, isCreateMode, plan, planDetails]);

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      price: number;
      period: "monthly" | "yearly";
      features?: string[];
      popular?: boolean;
      max_properties?: number;
      max_customers?: number;
      is_active?: boolean;
    }) => subscriptionPlanService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      setIsCreateMode(false);
      onOpenChange(false);
      
      // Format response similar to seed:plan output
      const featuresCount = data.features?.length || 0;
      const maxProps = data.max_properties || 'Unlimited';
      const maxCust = data.max_customers || 'Unlimited';
      
      toast({
        title: "✅ Subscription plan created successfully!",
        description: `Plan "${data.name}" - ₹${data.price}/${data.period} | ${featuresCount} features | ${maxProps} properties | ${maxCust} customers | ${data.popular ? 'Popular' : 'Standard'} | ${data.is_active ? 'Active' : 'Inactive'}`,
        duration: 6000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to create subscription plan",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      name?: string;
      price?: number;
      period?: "monthly" | "yearly";
      features?: string[];
      popular?: boolean;
      max_properties?: number;
      max_customers?: number;
      is_active?: boolean;
    }) =>
      plan?.id
        ? subscriptionPlanService.update(plan.id, data)
        : Promise.reject(new Error("No plan ID")),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      queryClient.invalidateQueries({
        queryKey: ["plan-details", plan?.id],
      });
      setIsEditSheetOpen(false);
      
      // Format response similar to seed:plan output
      const featuresCount = data.features?.length || 0;
      const maxProps = data.max_properties || 'Unlimited';
      const maxCust = data.max_customers || 'Unlimited';
      
      toast({
        title: "✅ Subscription plan updated successfully!",
        description: `Plan "${data.name}" - ₹${data.price}/${data.period} | ${featuresCount} features | ${maxProps} properties | ${maxCust} customers | ${data.popular ? 'Popular' : 'Standard'} | ${data.is_active ? 'Active' : 'Inactive'}`,
        duration: 6000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to update subscription plan",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      plan?.id
        ? subscriptionPlanService.delete(plan.id)
        : Promise.reject(new Error("No plan ID")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      onOpenChange(false);
      const planName = plan?.name || "Plan";
      toast({
        title: "✅ Subscription plan deleted successfully!",
        description: `Plan "${planName}" has been removed from the system.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to delete subscription plan",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    const dataToUse = planDetails || plan;
    if (dataToUse) {
      setEditForm({
        name: dataToUse.name,
        price: dataToUse.price.toString(),
        period: dataToUse.period,
        features: dataToUse.features || [],
        popular: dataToUse.popular || false,
        max_properties: dataToUse.max_properties?.toString() || "",
        max_customers: dataToUse.max_customers?.toString() || "",
        is_active: dataToUse.is_active,
      });
      setNewFeature("");
      setIsEditSheetOpen(true);
    }
  };

  const handleSave = () => {
    if (isCreateMode) {
      const data = {
        name: editForm.name,
        price: parseFloat(editForm.price),
        period: editForm.period,
        features: editForm.features,
        popular: editForm.popular,
        max_properties: editForm.max_properties
          ? parseInt(editForm.max_properties)
          : undefined,
        max_customers: editForm.max_customers
          ? parseInt(editForm.max_customers)
          : undefined,
        is_active: editForm.is_active,
      };
      createMutation.mutate(data);
    } else {
      const updates: {
        name?: string;
        price?: number;
        period?: "monthly" | "yearly";
        features?: string[];
        popular?: boolean;
        max_properties?: number;
        max_customers?: number;
        is_active?: boolean;
      } = {};

      const dataToUse = planDetails || plan;
      if (!dataToUse) return;

      if (editForm.name !== dataToUse.name) updates.name = editForm.name;
      if (parseFloat(editForm.price) !== dataToUse.price)
        updates.price = parseFloat(editForm.price);
      if (editForm.period !== dataToUse.period) updates.period = editForm.period;
      if (JSON.stringify(editForm.features) !== JSON.stringify(dataToUse.features || []))
        updates.features = editForm.features;
      if (editForm.popular !== (dataToUse.popular || false))
        updates.popular = editForm.popular;
      if (
        (editForm.max_properties ? parseInt(editForm.max_properties) : null) !==
        dataToUse.max_properties
      )
        updates.max_properties = editForm.max_properties
          ? parseInt(editForm.max_properties)
          : undefined;
      if (
        (editForm.max_customers ? parseInt(editForm.max_customers) : null) !==
        dataToUse.max_customers
      )
        updates.max_customers = editForm.max_customers
          ? parseInt(editForm.max_customers)
          : undefined;
      if (editForm.is_active !== dataToUse.is_active)
        updates.is_active = editForm.is_active;

      if (Object.keys(updates).length > 0) {
        updateMutation.mutate(updates);
      } else {
        setIsEditSheetOpen(false);
      }
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setEditForm({
        ...editForm,
        features: [...editForm.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setEditForm({
      ...editForm,
      features: editForm.features.filter((_, i) => i !== index),
    });
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this plan? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate();
    }
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "success" : "secondary";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  const displayData = planDetails || plan;

  // If in create mode, show the edit sheet directly
  if (isCreateMode && open) {
    return (
      <Sheet open={isCreateMode} onOpenChange={setIsCreateMode}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Subscription Plan</SheetTitle>
            <SheetDescription>
              Create a new subscription plan that will be available in the mobile application
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="e.g., Basic Plan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm({ ...editForm, price: e.target.value })
                }
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Billing Period *</Label>
              <Select
                value={editForm.period}
                onValueChange={(value: "monthly" | "yearly") =>
                  setEditForm({ ...editForm, period: value })
                }
                modal={false}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_properties">Max Properties</Label>
              <Input
                id="max_properties"
                type="number"
                value={editForm.max_properties}
                onChange={(e) =>
                  setEditForm({ ...editForm, max_properties: e.target.value })
                }
                placeholder="Leave empty for unlimited"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_customers">Max Customers</Label>
              <Input
                id="max_customers"
                type="number"
                value={editForm.max_customers}
                onChange={(e) =>
                  setEditForm({ ...editForm, max_customers: e.target.value })
                }
                placeholder="Leave empty for unlimited"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddFeature} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {editForm.features.length > 0 && (
                <div className="mt-2 space-y-1">
                  {editForm.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <span className="text-sm">{feature}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="popular">Mark as Popular</Label>
              <Switch
                id="popular"
                checked={editForm.popular}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, popular: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, is_active: checked })
                }
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateMode(false);
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || !editForm.name || !editForm.price}
            >
              {createMutation.isPending ? "Creating..." : "Create Plan"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Drawer open={open && !isCreateMode} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96vh]">
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-2xl font-bold">
                  Plan Details
                </DrawerTitle>
                <DrawerDescription>
                  View and manage subscription plan information
                </DrawerDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {displayData && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto p-6">
            {!displayData ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No plan selected</AlertDescription>
              </Alert>
            ) : isLoading ? (
              <Loading />
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load plan details
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-4">
                  <Badge
                    variant={getStatusBadgeVariant(displayData.is_active)}
                    className="text-sm px-3 py-1"
                  >
                    {displayData.is_active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                  {displayData.popular && (
                    <Badge variant="default" className="text-sm px-3 py-1">
                      POPULAR
                    </Badge>
                  )}
                </div>

                {/* Main Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Plan Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Plan Name
                        </Label>
                        <p className="font-semibold">{displayData.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Price
                        </Label>
                        <p className="font-semibold text-lg">
                          {formatPriceWithCurrency(displayData.price)}/
                          {displayData.period}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Billing Period
                        </Label>
                        <p className="font-semibold capitalize">
                          {displayData.period}
                        </p>
                      </div>
                      {displayData.max_properties !== null && (
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Max Properties
                          </Label>
                          <p className="font-semibold">
                            {displayData.max_properties}
                          </p>
                        </div>
                      )}
                      {displayData.max_customers !== null && (
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Max Customers
                          </Label>
                          <p className="font-semibold">
                            {displayData.max_customers}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {displayData.features && displayData.features.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {displayData.features.map((feature, index) => (
                            <li key={index} className="text-sm">
                              {feature}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No features specified
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Dates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Created At
                        </Label>
                        <p className="text-sm">
                          {formatDate(displayData.created_at)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Last Updated
                        </Label>
                        <p className="text-sm">
                          {formatDate(displayData.updated_at)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Plan ID
                        </Label>
                        <p className="font-mono text-sm">{displayData.id}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Subscription Plan</SheetTitle>
            <SheetDescription>
              Update subscription plan details
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Plan Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₹) *</Label>
              <Input
                id="edit-price"
                type="number"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm({ ...editForm, price: e.target.value })
                }
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-period">Billing Period *</Label>
              <Select
                value={editForm.period}
                onValueChange={(value: "monthly" | "yearly") =>
                  setEditForm({ ...editForm, period: value })
                }
                modal={false}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max_properties">Max Properties</Label>
              <Input
                id="edit-max_properties"
                type="number"
                value={editForm.max_properties}
                onChange={(e) =>
                  setEditForm({ ...editForm, max_properties: e.target.value })
                }
                placeholder="Leave empty for unlimited"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max_customers">Max Customers</Label>
              <Input
                id="edit-max_customers"
                type="number"
                value={editForm.max_customers}
                onChange={(e) =>
                  setEditForm({ ...editForm, max_customers: e.target.value })
                }
                placeholder="Leave empty for unlimited"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddFeature} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {editForm.features.length > 0 && (
                <div className="mt-2 space-y-1">
                  {editForm.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <span className="text-sm">{feature}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="edit-popular">Mark as Popular</Label>
              <Switch
                id="edit-popular"
                checked={editForm.popular}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, popular: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="edit-is_active">Active</Label>
              <Switch
                id="edit-is_active"
                checked={editForm.is_active}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, is_active: checked })
                }
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !editForm.name || !editForm.price}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

