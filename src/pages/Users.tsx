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
import { Plus, Search, Edit, MoreVertical, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { userService, User } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@eliteproperties.com',
    company_id: '1',
    role: 'admin',
    is_active: true,
    last_login: '2024-06-15T10:30:00Z',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@deventerprise.com',
    company_id: '2',
    role: 'manager',
    is_active: true,
    last_login: '2024-06-14T15:45:00Z',
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-02-20T00:00:00Z',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@ravalsolution.com',
    company_id: '3',
    role: 'agent',
    is_active: false,
    last_login: '2024-06-10T09:20:00Z',
    created_at: '2024-03-10T00:00:00Z',
    updated_at: '2024-03-10T00:00:00Z',
  },
];

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
      No users found
    </h3>
    <p className="mb-6 text-center text-sm text-slate-500 max-w-sm">
      Get started by creating your first user. Click the button above to add a new user.
    </p>
  </div>
);

export function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, limit, searchQuery],
    queryFn: () => userService.getAll({ page, limit, search: searchQuery }),
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  // Ensure unique users by id to prevent duplicates
  const users = useMemo(() => {
    const rawUsers = data?.users || (error ? mockUsers : []);
    // Deduplicate by id
    const uniqueMap = new Map();
    rawUsers.forEach((user: User) => {
      if (user.id && !uniqueMap.has(user.id)) {
        uniqueMap.set(user.id, user);
      }
    });
    return Array.from(uniqueMap.values());
  }, [data?.users, error]);
  
  const total = data?.total || users.length;
  const totalPages = Math.ceil(total / limit);

  // Paginate users
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return users.slice(start, end);
  }, [users, page, limit]);

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'User created successfully',
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

  const handleCreate = (formData: FormData) => {
    createMutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
      company_id: formData.get('company_id') as string,
    });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    
    // Clean malformed date strings (remove trailing colons or invalid chars)
    const cleaned = typeof dateString === 'string' ? dateString.replace(/:\s*$/, '').trim() : dateString;
    
    try {
      const d = new Date(cleaned);
      if (isNaN(d.getTime())) {
        return cleaned; // Return original if invalid date
      }
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return cleaned;
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
            Users
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Manage all users across all companies
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. They will receive an email invitation.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate(new FormData(e.currentTarget));
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="Enter full name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="user@example.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company_id">Company</Label>
                  <Select name="company_id" required>
                    <SelectTrigger id="company_id">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Elite Properties</SelectItem>
                      <SelectItem value="2">Dev Enterprise Company</SelectItem>
                      <SelectItem value="3">Raval Solution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" required>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {createMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search users..."
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
      ) : users.length === 0 ? (
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
                      Company
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Role
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Status
                    </span>
                  </TableHead>
                  <TableHead className="sticky top-0 z-10 bg-white hidden xl:table-cell">
                    <span className="font-semibold uppercase tracking-wide text-xs text-gray-600">
                      Last Login
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
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-semibold text-gray-900">
                      <TruncatedText text={user.name} maxLength={25} />
                    </TableCell>
                    <TableCell className="text-gray-600 hidden md:table-cell">
                      <TruncatedText text={user.email} maxLength={30} />
                    </TableCell>
                    <TableCell className="text-gray-600 hidden lg:table-cell">
                      Company Name
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role || 'agent'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.is_active ? 'success' : 'secondary'}
                        className="font-medium px-2.5 py-0.5 text-xs min-w-[70px] justify-center"
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm hidden xl:table-cell">
                      {formatDate(user.last_login)}
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
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              Reset Password
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
