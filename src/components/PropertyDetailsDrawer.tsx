import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Home,
  MapPin,
  Calendar,
  DollarSign,
  Bed,
  Bath,
  Square,
  Building2,
  UsersRound,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Video,
  FileText,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Play,
  Download,
  User,
  Phone,
  Mail,
  Star,
  MapPin as MapPinIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  MessageSquare,
} from 'lucide-react';
import { formatPriceWithCurrency } from '@/utils/priceUtils';
import { propertyService, Property } from '@/services/propertyService';
import { noteService } from '@/services/noteService';
import { activityService } from '@/services/activityService';
import { relationshipService } from '@/services/relationshipService';
import { format } from 'date-fns';

interface PropertyDetailsDrawerProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MediaItem {
  id: string;
  url: string;
  thumbnail_url?: string;
  type: string;
  order?: number;
}

export function PropertyDetailsDrawer({ property, open, onOpenChange }: PropertyDetailsDrawerProps) {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedMediaType, setSelectedMediaType] = useState<'all' | 'images' | 'videos' | 'floor_plans' | 'documents'>('all');

  const { data: propertyDetails, isLoading, error } = useQuery({
    queryKey: ['property-details', property?.id],
    queryFn: () => property?.id ? propertyService.getById(property.id) : Promise.resolve(null),
    enabled: !!property?.id && open,
    retry: false,
  });

  // Fetch property notes
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['property-notes', property?.id],
    queryFn: () => property?.id ? noteService.getPropertyNotes(property.id) : Promise.resolve({ data: [], total: 0, page: 1, limit: 20 }),
    enabled: !!property?.id && open,
    retry: false,
  });

  // Fetch property activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['property-activities', property?.id],
    queryFn: () => property?.id ? activityService.getPropertyActivities(property.id) : Promise.resolve({ data: [], total: 0, page: 1, limit: 20 }),
    enabled: !!property?.id && open,
    retry: false,
  });

  // Fetch suggested customers
  const { data: suggestedCustomersData, isLoading: customersLoading } = useQuery({
    queryKey: ['property-suggested-customers', property?.id],
    queryFn: () => property?.id ? relationshipService.getPropertySuggestedCustomers(property.id) : Promise.resolve({ data: [], customers: [] }),
    enabled: !!property?.id && open,
    retry: false,
  });

  const displayProperty = propertyDetails || property;

  if (!displayProperty) return null;

  // Get linked customers from property details or suggested customers
  const linkedCustomers = (propertyDetails as any)?.linked_customers || 
                          suggestedCustomersData?.data || 
                          suggestedCustomersData?.customers || [];

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Not specified";
    return formatPriceWithCurrency(amount, true); // Use converter format (K, L, Cr)
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
      case "open":
        return "success";
      case "sold":
      case "closed":
        return "secondary";
      case "rented":
        return "default";
      default:
        return "secondary";
    }
  };

  // Get media from property details
  const allMedia: MediaItem[] = (propertyDetails as any)?.media || [];
  const images: MediaItem[] = (propertyDetails as any)?.images || [];
  const videos: MediaItem[] = (propertyDetails as any)?.videos || [];
  const floorPlans: MediaItem[] = (propertyDetails as any)?.floor_plans || [];
  const documents: MediaItem[] = (propertyDetails as any)?.documents || [];

  // Filter media based on selected type
  const getFilteredMedia = () => {
    switch (selectedMediaType) {
      case 'images':
        return images;
      case 'videos':
        return videos;
      case 'floor_plans':
        return floorPlans;
      case 'documents':
        return documents;
      default:
        return allMedia;
    }
  };

  const filteredMedia = getFilteredMedia();
  const hasMedia = allMedia.length > 0;

  // Reset currentImageIndex when filteredMedia changes or becomes empty
  useEffect(() => {
    if (filteredMedia.length === 0) {
      setCurrentImageIndex(0);
    } else if (currentImageIndex >= filteredMedia.length) {
      setCurrentImageIndex(0);
    }
  }, [filteredMedia.length]);

  const handlePreviousImage = () => {
    if (filteredMedia.length === 0) return;
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : filteredMedia.length - 1));
  };

  const handleNextImage = () => {
    if (filteredMedia.length === 0) return;
    setCurrentImageIndex((prev) => (prev < filteredMedia.length - 1 ? prev + 1 : 0));
  };

  const handleImageClick = (index: number) => {
    if (index >= 0 && index < filteredMedia.length) {
      setCurrentImageIndex(index);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[96vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="border-b">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DrawerTitle className="text-2xl">{displayProperty.title}</DrawerTitle>
                  <DrawerDescription className="mt-1">
                    Property details and information
                  </DrawerDescription>
                </div>
              </div>
              <Badge
                variant={getStatusBadgeVariant(displayProperty.status)}
                className="capitalize"
              >
                {displayProperty.status}
              </Badge>
            </div>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : error ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error loading property details. Showing basic information.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Media Gallery */}
                {hasMedia && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Media Gallery</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant={selectedMediaType === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedMediaType('all')}
                          >
                            All ({allMedia.length})
                          </Button>
                          {images.length > 0 && (
                            <Button
                              variant={selectedMediaType === 'images' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedMediaType('images')}
                            >
                              <ImageIcon className="h-4 w-4 mr-1" />
                              Images ({images.length})
                            </Button>
                          )}
                          {videos.length > 0 && (
                            <Button
                              variant={selectedMediaType === 'videos' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedMediaType('videos')}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Videos ({videos.length})
                            </Button>
                          )}
                          {floorPlans.length > 0 && (
                            <Button
                              variant={selectedMediaType === 'floor_plans' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedMediaType('floor_plans')}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Floor Plans ({floorPlans.length})
                            </Button>
                          )}
                          {documents.length > 0 && (
                            <Button
                              variant={selectedMediaType === 'documents' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedMediaType('documents')}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Documents ({documents.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredMedia.length > 0 && filteredMedia[currentImageIndex] ? (
                        <div className="space-y-4">
                          {/* Main Media Display */}
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            {filteredMedia[currentImageIndex]?.type === 'image' || 
                             filteredMedia[currentImageIndex]?.type === 'floor_plan' ? (
                              <img
                                src={filteredMedia[currentImageIndex]?.url || ''}
                                alt={`Media ${currentImageIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : filteredMedia[currentImageIndex]?.type === 'video' ? (
                              <video
                                src={filteredMedia[currentImageIndex]?.url || ''}
                                controls
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <div className="text-center">
                                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-600">Document</p>
                                  {filteredMedia[currentImageIndex]?.url && (
                                    <a
                                      href={filteredMedia[currentImageIndex].url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Navigation Arrows */}
                            {filteredMedia.length > 1 && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                                  onClick={handlePreviousImage}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                                  onClick={handleNextImage}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {/* Media Counter */}
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                              {currentImageIndex + 1} / {filteredMedia.length}
                            </div>

                            {/* Fullscreen Button */}
                            {filteredMedia[currentImageIndex]?.url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                                onClick={() => window.open(filteredMedia[currentImageIndex]?.url, '_blank')}
                              >
                                <Maximize2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {/* Thumbnail Grid */}
                          {filteredMedia.length > 1 && (
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                              {filteredMedia.map((media, index) => (
                                <button
                                  key={media.id}
                                  onClick={() => handleImageClick(index)}
                                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                    index === currentImageIndex
                                      ? 'border-primary ring-2 ring-primary'
                                      : 'border-transparent hover:border-gray-300'
                                  }`}
                                >
                                  {media.type === 'image' || media.type === 'floor_plan' ? (
                                    <img
                                      src={media.thumbnail_url || media.url}
                                      alt={`Thumbnail ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : media.type === 'video' ? (
                                    <div className="relative w-full h-full bg-gray-200">
                                      <img
                                        src={media.thumbnail_url || media.url}
                                        alt={`Video thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover opacity-75"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black/50 rounded-full p-2">
                                          <Play className="h-4 w-4 text-white" />
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                      <FileText className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No {selectedMediaType === 'all' ? '' : selectedMediaType} media available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Property Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Property Type</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {displayProperty.property_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Price</p>
                          <p className="text-sm text-muted-foreground font-semibold">
                            {formatCurrency(displayProperty.price)}
                          </p>
                        </div>
                      </div>
                      {displayProperty.address && (
                        <div className="flex items-start gap-3 md:col-span-2">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Address</p>
                            <p className="text-sm text-muted-foreground">
                              {displayProperty.address}
                              {displayProperty.city && `, ${displayProperty.city}`}
                              {displayProperty.state && `, ${displayProperty.state}`}
                              {displayProperty.zip_code && ` ${displayProperty.zip_code}`}
                            </p>
                          </div>
                        </div>
                      )}
                      {displayProperty.bedrooms !== undefined && (
                        <div className="flex items-start gap-3">
                          <Bed className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Bedrooms</p>
                            <p className="text-sm text-muted-foreground">
                              {displayProperty.bedrooms}
                            </p>
                          </div>
                        </div>
                      )}
                      {displayProperty.bathrooms !== undefined && (
                        <div className="flex items-start gap-3">
                          <Bath className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Bathrooms</p>
                            <p className="text-sm text-muted-foreground">
                              {displayProperty.bathrooms}
                            </p>
                          </div>
                        </div>
                      )}
                      {displayProperty.area && (
                        <div className="flex items-start gap-3">
                          <Square className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Area</p>
                            <p className="text-sm text-muted-foreground">
                              {typeof displayProperty.area === 'number' 
                                ? displayProperty.area.toLocaleString() 
                                : displayProperty.area} sq ft
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Created</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(displayProperty.created_at), 'PPp')}
                          </p>
                        </div>
                      </div>
                    </div>
                    {displayProperty.description && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Description</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {displayProperty.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Owner Information */}
                {(displayProperty.owner_name || displayProperty.owner_phone || displayProperty.owner_email) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Owner Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {displayProperty.owner_name && (
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Name</p>
                            <p className="text-sm text-muted-foreground">{displayProperty.owner_name}</p>
                          </div>
                        </div>
                      )}
                      {displayProperty.owner_phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Phone</p>
                            <a
                              href={`tel:${displayProperty.owner_phone}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {displayProperty.owner_phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {displayProperty.owner_email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <a
                              href={`mailto:${displayProperty.owner_email}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {displayProperty.owner_email}
                            </a>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Features */}
                {displayProperty.features && displayProperty.features.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {displayProperty.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            <Star className="h-3 w-3 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Nearby Places */}
                {displayProperty.nearby_places && displayProperty.nearby_places.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Nearby Places</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {displayProperty.nearby_places.map((place: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{place.name}</p>
                              {place.distance && (
                                <p className="text-xs text-muted-foreground">{place.distance}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Visiting Information */}
                {((displayProperty.visiting_days && displayProperty.visiting_days.length > 0) || displayProperty.visiting_start_time || displayProperty.visiting_notes) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Visiting Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {displayProperty.visiting_days && displayProperty.visiting_days.length > 0 && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Available Days</p>
                            <p className="text-sm text-muted-foreground">
                              {displayProperty.visiting_days.join(', ')}
                            </p>
                          </div>
                        </div>
                      )}
                      {(displayProperty.visiting_start_time || displayProperty.visiting_end_time) && (
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Visiting Hours</p>
                            <p className="text-sm text-muted-foreground">
                              {displayProperty.visiting_start_time || 'N/A'} - {displayProperty.visiting_end_time || 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}
                      {displayProperty.visiting_notes && (
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Notes</p>
                            <p className="text-sm text-muted-foreground">{displayProperty.visiting_notes}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Possession */}
                {displayProperty.possession && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Possession</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{displayProperty.possession}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Notes Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                    <CardDescription>
                      {notesLoading ? 'Loading...' : `${notesData?.data?.length || 0} note(s)`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notesLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loading size="sm" />
                      </div>
                    ) : notesData?.data && notesData.data.length > 0 ? (
                      <div className="space-y-3">
                        {notesData.data.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    note.type === 'positive'
                                      ? 'success'
                                      : note.type === 'issue'
                                      ? 'destructive'
                                      : 'default'
                                  }
                                  className="text-xs"
                                >
                                  {note.type === 'positive' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                  {note.type === 'issue' && <XCircle className="h-3 w-3 mr-1" />}
                                  {note.type === 'general' && <Info className="h-3 w-3 mr-1" />}
                                  {note.type}
                                </Badge>
                                {note.creator && (
                                  <span className="text-xs text-muted-foreground">
                                    by {note.creator.name}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(note.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900">{note.content}</p>
                            {note.Customer && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                  Tagged customer: {note.Customer.name}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-sm text-muted-foreground">
                        No notes available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Activities Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Activities</CardTitle>
                    <CardDescription>
                      {activitiesLoading ? 'Loading...' : `${activitiesData?.data?.length || 0} activity(ies)`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activitiesLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loading size="sm" />
                      </div>
                    ) : activitiesData?.data && activitiesData.data.length > 0 ? (
                      <div className="space-y-3">
                        {activitiesData.data.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="mt-0.5">
                              {activity.type === 'call' && <Phone className="h-4 w-4 text-blue-500" />}
                              {activity.type === 'visit' && <MapPinIcon className="h-4 w-4 text-green-500" />}
                              {activity.type === 'whatsapp' && <MessageSquare className="h-4 w-4 text-green-600" />}
                              {activity.type === 'note' && <FileText className="h-4 w-4 text-purple-500" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {activity.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(activity.date || activity.created_at), 'MMM d, yyyy HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900">{activity.description}</p>
                              {activity.creator && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  by {activity.creator.name}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-sm text-muted-foreground">
                        No activities available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Linked Customers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Linked Customers</CardTitle>
                    <CardDescription>
                      {customersLoading ? 'Loading...' : `${linkedCustomers.length} customer(s) linked to this property`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {customersLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loading size="sm" />
                      </div>
                    ) : linkedCustomers.length > 0 ? (
                      <div className="space-y-3">
                        {linkedCustomers.map((item: any) => {
                          const customer = item.customer || item;
                          return (
                            <div
                              key={customer.id}
                              className="p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => {
                                navigate(`/customers?id=${customer.id}`);
                                onOpenChange(false);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm">{customer.name}</p>
                                    {item.match_score && (
                                      <Badge variant="outline" className="text-xs">
                                        Match: {item.match_score}%
                                      </Badge>
                                    )}
                                  </div>
                                  {customer.email && (
                                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                                  )}
                                  {customer.phone && (
                                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                  )}
                                  {customer.area && customer.city && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {customer.area}, {customer.city}
                                    </p>
                                  )}
                                  {item.notes && (
                                    <p className="text-xs text-muted-foreground mt-1 italic">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-sm text-muted-foreground">
                        No linked customers
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4"
                    onClick={() => {
                      navigate(`/companies?id=${displayProperty.company_id}`);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5" />
                      <span className="font-semibold">View Company</span>
                      <ExternalLink className="h-4 w-4 ml-auto" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      View company details
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4"
                    onClick={() => {
                      navigate(`/customers?property=${displayProperty.id}`);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <UsersRound className="h-5 w-5" />
                      <span className="font-semibold">View Customers</span>
                      <ExternalLink className="h-4 w-4 ml-auto" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      View interested customers
                    </span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
