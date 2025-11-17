import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UsersRound,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Home,
  Bed,
  Bath,
  Square,
  Star,
  MessageSquare,
  Activity,
  Tag,
  Clock,
} from 'lucide-react';
import { formatPriceWithCurrency } from '@/utils/priceUtils';
import { customerDetailsService, CustomerDetails, SuggestedProperty } from '@/services/customerService';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CustomerDetailsDrawerProps {
  customer: CustomerDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsDrawer({ customer, open, onOpenChange }: CustomerDetailsDrawerProps) {

  const { data: customerDetails, isLoading, error } = useQuery({
    queryKey: ['customer-details', customer?.id],
    queryFn: () => customer?.id ? customerDetailsService.getById(customer.id) : Promise.resolve(null),
    enabled: !!customer?.id && open,
    retry: false,
  });

  // Fetch customer notes
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['customer-notes', customer?.id],
    queryFn: () => customer?.id ? customerDetailsService.getCustomerNotes(customer.id, { limit: 50 }) : Promise.resolve({ data: [], total: 0, page: 1, limit: 50 }),
    enabled: !!customer?.id && open,
    retry: false,
  });

  // Fetch customer activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['customer-activities', customer?.id],
    queryFn: () => customer?.id ? customerDetailsService.getCustomerActivities(customer.id, { limit: 50 }) : Promise.resolve({ data: [], total: 0, page: 1, limit: 50 }),
    enabled: !!customer?.id && open,
    retry: false,
  });

  // Fetch suggested properties
  const { data: suggestedPropertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['customer-suggested-properties', customer?.id],
    queryFn: () => customer?.id ? customerDetailsService.getCustomerSuggestedProperties(customer.id) : Promise.resolve({ data: [], properties: [], total: 0 }),
    enabled: !!customer?.id && open,
    retry: false,
  });

  if (!customer) return null;

  const customerData = customerDetails || customer;
  const notes = notesData?.data || [];
  const activities = activitiesData?.data || activitiesData?.activities || [];
  
  // Get linked properties from customer details or suggested properties
  const linkedProperties = (customerData as any).linked_properties || 
                          (customerData as any).suggested_properties || 
                          suggestedPropertiesData?.data || 
                          suggestedPropertiesData?.properties || [];
  
  const suggestedProperties = linkedProperties;

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return formatPriceWithCurrency(amount, true); // Use converter format (K, L, Cr)
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'issue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getActivityTypeIcon = (type?: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'visit':
        return <Home className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'note':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[96vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="border-b bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <UsersRound className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <DrawerTitle className="text-2xl font-bold text-slate-900">{customerData.name}</DrawerTitle>
                  <DrawerDescription className="mt-1 text-slate-600">
                    Customer details and information
                  </DrawerDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {customerData.is_hot_lead && (
                  <Badge variant="destructive" className="shadow-md">
                    <Star className="h-3 w-3 mr-1" />
                    Hot Lead
                  </Badge>
                )}
                <Badge variant={customerData.status === 'active' ? 'success' : 'secondary'} className="shadow-md capitalize">
                  {customerData.status}
                </Badge>
              </div>
            </div>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loading size="lg" />
              </div>
            ) : error ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading customer details. Showing basic information.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Customer Information */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customerData.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">Email</p>
                            <p className="text-sm text-slate-600">{customerData.email}</p>
                          </div>
                        </div>
                      )}
                      {customerData.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">Phone</p>
                            <p className="text-sm text-slate-600">{customerData.phone}</p>
                          </div>
                        </div>
                      )}
                      {customerData.address && (
                        <div className="flex items-start gap-3 md:col-span-2">
                          <MapPin className="h-5 w-5 text-slate-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">Address</p>
                            <p className="text-sm text-slate-600">{customerData.address}</p>
                            {(customerData.city || customerData.state || customerData.pincode) && (
                              <p className="text-sm text-slate-500 mt-1">
                                {[customerData.city, customerData.state, customerData.pincode].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <Tag className="h-5 w-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Type</p>
                          <Badge variant="outline" className="capitalize mt-1">
                            {customerData.type || 'buyer'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">Created</p>
                          <p className="text-sm text-slate-600">
                            {format(new Date(customerData.created_at), 'PPp')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Buyer Requirements */}
                {customerData.type === 'buyer' || customerData.type === 'both' ? (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-slate-900">Buyer Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Budget Range</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {customerData.budget_min && customerData.budget_max
                              ? `${formatCurrency(customerData.budget_min)} - ${formatCurrency(customerData.budget_max)}`
                              : 'Not specified'}
                          </p>
                        </div>
                        {customerData.preferred_bhk && customerData.preferred_bhk.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Preferred BHK</p>
                            <div className="flex flex-wrap gap-2">
                              {customerData.preferred_bhk.map((bhk, idx) => (
                                <Badge key={idx} variant="outline">{bhk}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {(customerData as CustomerDetails & { property_type?: string }).property_type && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Property Type</p>
                            <Badge variant="outline" className="capitalize">{(customerData as CustomerDetails & { property_type?: string }).property_type}</Badge>
                          </div>
                        )}
                        {customerData.preferred_localities && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-medium text-slate-700 mb-2">Preferred Localities</p>
                            <p className="text-sm text-slate-600">{customerData.preferred_localities}</p>
                          </div>
                        )}
                        {customerData.must_have_features && customerData.must_have_features.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-medium text-slate-700 mb-2">Must Have Features</p>
                            <div className="flex flex-wrap gap-2">
                              {customerData.must_have_features.map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="bg-blue-50">{feature}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {customerData.nice_to_have_features && customerData.nice_to_have_features.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-medium text-slate-700 mb-2">Nice to Have Features</p>
                            <div className="flex flex-wrap gap-2">
                              {customerData.nice_to_have_features.map((feature, idx) => (
                                <Badge key={idx} variant="outline">{feature}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Seller Requirements */}
                {customerData.type === 'owner' || customerData.type === 'both' ? (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-slate-900">Seller Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customerData.expected_price && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Expected Price</p>
                            <p className="text-lg font-semibold text-slate-900">{formatCurrency(customerData.expected_price)}</p>
                          </div>
                        )}
                        {customerData.seller_bhk && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">BHK</p>
                            <Badge variant="outline">{customerData.seller_bhk}</Badge>
                          </div>
                        )}
                        {customerData.seller_area && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Area</p>
                            <p className="text-sm text-slate-600">{customerData.seller_area}</p>
                          </div>
                        )}
                        {customerData.seller_location && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-medium text-slate-700 mb-2">Location</p>
                            <p className="text-sm text-slate-600">{customerData.seller_location}</p>
                          </div>
                        )}
                        {customerData.selling_reason && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-medium text-slate-700 mb-2">Selling Reason</p>
                            <p className="text-sm text-slate-600">{customerData.selling_reason}</p>
                          </div>
                        )}
                        {customerData.urgency_level && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Urgency Level</p>
                            <Badge variant="outline" className="capitalize">{customerData.urgency_level}</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Notes */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900">Notes ({notes.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {notesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loading />
                      </div>
                    ) : notes.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                        <p>No notes available</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            className={`p-4 rounded-lg border ${getNoteTypeColor(note.type)}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {note.type}
                                </Badge>
                                {note.creator && (
                                  <span className="text-xs text-slate-600">
                                    by {note.creator.name}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">
                                {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm">{note.content}</p>
                            {(note as any).Property && (
                              <div className="mt-2 pt-2 border-t border-current/20">
                                <p className="text-xs flex items-center gap-1">
                                  <Home className="h-3 w-3" />
                                  Related to: {(note as any).Property.title}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activities */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900">Activities ({activities.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activitiesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loading />
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Activity className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                        <p>No activities available</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                              {getActivityTypeIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                {activity.creator && (
                                  <span>by {activity.creator.name}</span>
                                )}
                                {activity.date && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(activity.date), 'MMM d, yyyy h:mm a')}
                                  </span>
                                )}
                                {(activity as any).Property && (
                                  <span className="flex items-center gap-1">
                                    <Home className="h-3 w-3" />
                                    {(activity as any).Property.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Linked Properties */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900">Linked Properties ({linkedProperties.length})</CardTitle>
                    <CardDescription>
                      {customerData.type === 'buyer' 
                        ? 'Properties suggested for this buyer' 
                        : customerData.type === 'owner' 
                        ? 'Properties owned by this seller'
                        : 'Properties linked to this customer'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {propertiesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loading />
                      </div>
                    ) : suggestedProperties.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Home className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                        <p>No suggested properties available</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border-0 bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead>Property</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead className="hidden md:table-cell">Details</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Match Score</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {suggestedProperties.map((item: SuggestedProperty) => (
                                <TableRow
                                  key={item.property.id}
                                  className="cursor-pointer hover:bg-slate-50"
                                >
                                  <TableCell className="font-medium">{item.property.title}</TableCell>
                                  <TableCell className="text-slate-600">
                                    {item.property.city || item.property.address || 'N/A'}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell text-slate-600">
                                    <div className="flex items-center gap-3 text-sm">
                                      {item.property.bedrooms !== undefined && item.property.bedrooms > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Bed className="h-3.5 w-3.5" />
                                          <span>{item.property.bedrooms}</span>
                                        </div>
                                      )}
                                      {item.property.bathrooms !== undefined && item.property.bathrooms > 0 && (
                                        <div className="flex items-center gap-1">
                                          <Bath className="h-3.5 w-3.5" />
                                          <span>{item.property.bathrooms}</span>
                                        </div>
                                      )}
                                      {item.property.area && (
                                        <div className="flex items-center gap-1">
                                          <Square className="h-3.5 w-3.5" />
                                          <span>{item.property.area} sq ft</span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {formatCurrency(item.property.price)}
                                  </TableCell>
                                  <TableCell>
                                    {item.match_score !== undefined && item.match_score !== null ? (
                                      <Badge variant="outline" className="font-semibold">
                                        {item.match_score}%
                                      </Badge>
                                    ) : (
                                      <span className="text-slate-400">N/A</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        item.visit_status === 'visited' ? 'success' :
                                        item.visit_status === 'scheduled' ? 'default' :
                                        item.visit_status === 'interested' ? 'default' :
                                        'secondary'
                                      }
                                      className="capitalize"
                                    >
                                      {item.visit_status || 'pending'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

