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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Tag,
  Edit,
  X,
} from "lucide-react";
import { formatPriceWithCurrency } from "@/utils/priceUtils";
import {
  subscriptionService,
  Subscription,
} from "@/services/subscriptionService";
import { format } from "date-fns";

interface SubscriptionDetailsDrawerProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openEditSheet?: boolean;
  onEditSheetOpenChange?: (open: boolean) => void;
}

export function SubscriptionDetailsDrawer({
  subscription,
  open,
  onOpenChange,
  openEditSheet: externalEditSheetOpen,
  onEditSheetOpenChange: externalEditSheetOpenChange,
}: SubscriptionDetailsDrawerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [internalEditSheetOpen, setInternalEditSheetOpen] = useState(false);

  // Use external control if provided, otherwise use internal state
  const isEditSheetOpen =
    externalEditSheetOpen !== undefined
      ? externalEditSheetOpen
      : internalEditSheetOpen;
  const setIsEditSheetOpen =
    externalEditSheetOpenChange || setInternalEditSheetOpen;
  const [editForm, setEditForm] = useState({
    status: "active",
    plan_id: "",
  });

  const {
    data: subscriptionDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subscription-details", subscription?.id],
    queryFn: () =>
      subscription?.id
        ? subscriptionService.getById(subscription.id)
        : Promise.resolve(null),
    enabled: !!subscription?.id && (open || isEditSheetOpen),
    retry: false,
  });

  // Open edit sheet when external control opens it
  useEffect(() => {
    if (isEditSheetOpen && subscription) {
      const dataToUse = subscriptionDetails || subscription;
      if (dataToUse) {
        setEditForm({
          status: dataToUse.status,
          plan_id: dataToUse.plan_id || "",
        });
      }
    }
  }, [isEditSheetOpen, subscription, subscriptionDetails]);

  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; plan_id?: string }) =>
      subscription?.id
        ? subscriptionService.update(subscription.id, data)
        : Promise.reject(new Error("No subscription ID")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["subscription-details", subscription?.id],
      });
      setIsEditSheetOpen(false);
      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      subscription?.id
        ? subscriptionService.cancel(subscription.id)
        : Promise.reject(new Error("No subscription ID")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["subscription-details", subscription?.id],
      });
      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    const dataToUse = subscriptionDetails || subscription;
    if (dataToUse) {
      setEditForm({
        status: dataToUse.status,
        plan_id: dataToUse.plan_id || "",
      });
      setIsEditSheetOpen(true);
    }
  };

  const handleSave = () => {
    const updates: { status?: string; plan_id?: string } = {};
    if (editForm.status !== subscriptionDetails?.status) {
      updates.status = editForm.status;
    }
    if (editForm.plan_id && editForm.plan_id !== subscriptionDetails?.plan_id) {
      updates.plan_id = editForm.plan_id;
    }
    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates);
    } else {
      setIsEditSheetOpen(false);
    }
  };

  const handleCancel = () => {
    if (subscriptionDetails?.status === "active") {
      cancelMutation.mutate();
    }
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch {
      return dateString;
    }
  };

  const displayData = subscriptionDetails || subscription;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[96vh]">
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-2xl font-bold">
                  Subscription Details
                </DrawerTitle>
                <DrawerDescription>
                  View and manage subscription information
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
                {displayData?.status && displayData.status === "active" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto p-6">
            {!displayData ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No subscription selected</AlertDescription>
              </Alert>
            ) : isLoading ? (
              <Loading />
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load subscription details
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-4">
                  <Badge
                    variant={getStatusBadgeVariant(displayData.status)}
                    className="text-sm px-3 py-1"
                  >
                    {displayData.status.toUpperCase()}
                  </Badge>
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
                        <p className="font-semibold">{displayData.plan_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Price
                        </Label>
                        <p className="font-semibold text-lg">
                          {formatPriceWithCurrency(displayData.price)}/
                          {displayData.billing_cycle}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Billing Cycle
                        </Label>
                        <p className="font-semibold capitalize">
                          {displayData.billing_cycle}
                        </p>
                      </div>
                      {displayData.features &&
                        displayData.features.length > 0 && (
                          <div>
                            <Label className="text-sm text-muted-foreground">
                              Features
                            </Label>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {displayData.features.map((feature, index) => (
                                <li key={index} className="text-sm">
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Company Name
                        </Label>
                        <p className="font-semibold">
                          {displayData.Company?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Company ID
                        </Label>
                        <p className="font-mono text-sm">
                          {displayData.company_id}
                        </p>
                      </div>
                      {displayData.Company?.email && (
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Email
                          </Label>
                          <p className="text-sm">{displayData.Company.email}</p>
                        </div>
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
                          Start Date
                        </Label>
                        <p className="font-semibold">
                          {formatDate(displayData.start_date)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Renewal Date
                        </Label>
                        <p className="font-semibold">
                          {formatDate(
                            displayData.renewal_date ||
                              displayData.end_date ||
                              ""
                          )}
                        </p>
                      </div>
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
                          Subscription ID
                        </Label>
                        <p className="font-mono text-sm">{displayData.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Plan ID
                        </Label>
                        <p className="font-mono text-sm">
                          {displayData.plan_id}
                        </p>
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Subscription</SheetTitle>
            <SheetDescription>
              Update subscription status and plan
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsEditSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
