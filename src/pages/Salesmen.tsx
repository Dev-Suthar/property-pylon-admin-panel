import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  User as UserIcon,
  Eye,
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { salesmanService, Salesman } from '@/services/salesmanService';
import { useToast } from '@/hooks/use-toast';
import { SalesmanDetailsDrawer } from '@/components/SalesmanDetailsDrawer';

// Skeleton loader component
const TableSkeleton = () => (
  <div className="space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
    ))}
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 p-8 shadow-lg">
      <UserIcon className="h-16 w-16 text-indigo-600" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-900">
      No salesmen found
    </h3>
    <p className="mb-6 text-center text-sm text-slate-500 max-w-sm">
      Get started by creating your first salesman. Click the button above to add a new salesman.
    </p>
  </div>
);

export function Salesmen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);
  const [editIsActive, setEditIsActive] = useState<string>('true');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editConfirmPassword, setEditConfirmPassword] = useState<string>('');
  const [editPasswordError, setEditPasswordError] = useState<string>('');
  const [editConfirmPasswordError, setEditConfirmPasswordError] = useState<string>('');
  const [deletingSalesman, setDeletingSalesman] = useState<Salesman | null>(null);
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['salesmen', page, limit, searchQuery],
    queryFn: () => salesmanService.getAll({ page, limit, search: searchQuery }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const salesmen = useMemo(() => {
    return data?.salesmen || [];
  }, [data?.salesmen]);
  
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Paginate salesmen
  const paginatedSalesmen = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return salesmen.slice(start, end);
  }, [salesmen, page, limit]);

  const createMutation = useMutation({
    mutationFn: salesmanService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salesmen'] });
      setIsCreateDialogOpen(false);
      setPasswordError('');
      setConfirmPasswordError('');
      toast({
        title: 'Success',
        description: data.password 
          ? `Salesman created successfully. Password: ${data.password}`
          : 'Salesman created successfully',
        duration: 10000, // Show longer so user can copy password
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      salesmanService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salesmen'] });
      setIsEditDialogOpen(false);
      setEditingSalesman(null);
      toast({
        title: 'Success',
        description: data.password 
          ? `Salesman updated successfully. New password: ${data.password}`
          : 'Salesman updated successfully',
        duration: data.password ? 10000 : 5000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: salesmanService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesmen'] });
      setDeletingSalesman(null);
      toast({
        title: 'Success',
        description: 'Salesman deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = (formData.get('password') as string)?.trim();
    const confirmPassword = (formData.get('confirmPassword') as string)?.trim();

    // Reset errors
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate password
    if (!password || password.length === 0) {
      setPasswordError('Password is required');
      return;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    // Validate confirm password
    if (!confirmPassword || confirmPassword.length === 0) {
      setConfirmPasswordError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    createMutation.mutate({
      name: (formData.get('name') as string).trim(),
      email: (formData.get('email') as string).trim(),
      phone: (formData.get('phone') as string)?.trim() || undefined,
      password: password,
    });
  };

  const handleEdit = (salesman: Salesman) => {
    setEditingSalesman(salesman);
    setEditIsActive(salesman.is_active ? 'true' : 'false');
    setEditPassword('');
    setEditConfirmPassword('');
    setEditPasswordError('');
    setEditConfirmPasswordError('');
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (formData: FormData) => {
    if (!editingSalesman) return;
    
    // Reset errors
    setEditPasswordError('');
    setEditConfirmPasswordError('');
    
    const phone = (formData.get('phone') as string)?.trim();
    const password = editPassword.trim();
    const confirmPassword = editConfirmPassword.trim();
    
    const updateData: any = {
      name: (formData.get('name') as string).trim(),
      email: (formData.get('email') as string).trim(),
      phone: phone && phone.length > 0 ? phone : undefined,
      is_active: editIsActive === 'true',
    };
    
    // Only include password if it's provided
    if (password.length > 0) {
      if (password.length < 8) {
        setEditPasswordError('Password must be at least 8 characters long');
        return;
      }
      
      if (password !== confirmPassword) {
        setEditConfirmPasswordError('Passwords do not match');
        return;
      }
      
      updateData.password = password;
    }
    
    updateMutation.mutate({
      id: editingSalesman.id,
      data: updateData,
    });
  };

  const handleDelete = (salesman: Salesman) => {
    setDeletingSalesman(salesman);
  };

  const confirmDelete = () => {
    if (deletingSalesman) {
      deleteMutation.mutate(deletingSalesman.id);
    }
  };

  const handleViewDetails = (salesman: Salesman) => {
    setSelectedSalesman(salesman);
    setIsDrawerOpen(true);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) {
        return dateString;
      }
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Text truncation component with tooltip
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Salesmen
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Manage salesmen who can onboard new companies
          </p>
        </div>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setPasswordError('');
              setConfirmPasswordError('');
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add Salesman
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Salesman</DialogTitle>
              <DialogDescription>
                Add a new salesman to the system. They will be able to onboard companies.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="Enter full name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="salesman@example.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter password (min 8 characters)"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  {passwordError && (
                    <p className="text-xs text-red-600">{passwordError}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Password must be at least 8 characters long
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  {confirmPasswordError && (
                    <p className="text-xs text-red-600">{confirmPasswordError}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setPasswordError('');
                    setConfirmPasswordError('');
                  }}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Salesman'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingSalesman(null);
            setEditIsActive('true');
            setEditPassword('');
            setEditConfirmPassword('');
            setEditPasswordError('');
            setEditConfirmPasswordError('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Salesman</DialogTitle>
            <DialogDescription>
              Update salesman information
            </DialogDescription>
          </DialogHeader>
          {editingSalesman && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(new FormData(e.currentTarget));
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingSalesman.name}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingSalesman.email}
                    placeholder="salesman@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    type="tel"
                    defaultValue={editingSalesman.phone || ''}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-password">New Password (Optional)</Label>
                  <Input
                    id="edit-password"
                    name="password"
                    type="password"
                    value={editPassword}
                    onChange={(e) => {
                      setEditPassword(e.target.value);
                      setEditPasswordError('');
                    }}
                    placeholder="Leave empty to keep current password"
                    minLength={8}
                    autoComplete="new-password"
                  />
                  {editPasswordError && (
                    <p className="text-xs text-red-600">{editPasswordError}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Leave empty to keep current password. Minimum 8 characters if updating.
                  </p>
                </div>
                {editPassword.length > 0 && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-confirm-password">Confirm New Password</Label>
                    <Input
                      id="edit-confirm-password"
                      name="confirmPassword"
                      type="password"
                      value={editConfirmPassword}
                      onChange={(e) => {
                        setEditConfirmPassword(e.target.value);
                        setEditConfirmPasswordError('');
                      }}
                      placeholder="Confirm new password"
                      minLength={8}
                      autoComplete="new-password"
                    />
                    {editConfirmPasswordError && (
                      <p className="text-xs text-red-600">{editConfirmPasswordError}</p>
                    )}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="edit-is_active">Status</Label>
                  <Select
                    value={editIsActive}
                    onValueChange={setEditIsActive}
                  >
                    <SelectTrigger id="edit-is_active">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingSalesman(null);
                    setEditIsActive('true');
                  }}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Updating...' : 'Update Salesman'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingSalesman}
        onOpenChange={(open) => !open && setDeletingSalesman(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the salesman
              {deletingSalesman && ` "${deletingSalesman.name}"`}. If they have created any companies,
              you'll need to handle those first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search salesmen..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-11 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-200"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border-0 bg-white shadow-lg p-4">
          <TableSkeleton />
        </div>
      ) : salesmen.length === 0 ? (
        <div className="rounded-xl border-0 bg-white shadow-lg">
          <EmptyState />
        </div>
      ) : (
        <div className="rounded-xl border-0 bg-white shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Name
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden md:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Email
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden lg:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Phone
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden xl:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Password
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Companies
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Status
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden xl:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Created
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
                {paginatedSalesmen.map((salesman) => (
                  <TableRow key={salesman.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-semibold text-gray-900">
                      <TruncatedText text={salesman.name} maxLength={25} />
                    </TableCell>
                    <TableCell className="text-gray-600 hidden md:table-cell">
                      <TruncatedText text={salesman.email} maxLength={30} />
                    </TableCell>
                    <TableCell className="text-gray-600 hidden lg:table-cell">
                      {salesman.phone || '-'}
                    </TableCell>
                    <TableCell className="text-gray-600 hidden xl:table-cell">
                      {salesman.password ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                            {salesman.password}
                          </code>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        <span className="font-medium text-indigo-600">
                          {salesman.companies_count || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={salesman.is_active ? 'success' : 'secondary'}
                        className="font-medium px-2.5 py-0.5 text-xs min-w-[70px] justify-center"
                      >
                        {salesman.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm hidden xl:table-cell">
                      {formatDate(salesman.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
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
                              onClick={() => handleViewDetails(salesman)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleEdit(salesman)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              onClick={() => handleDelete(salesman)}
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

      <SalesmanDetailsDrawer
        salesman={selectedSalesman}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}

