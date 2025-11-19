import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SalesmanDetails } from '@/services/salesmanService';
import { salesmanService } from '@/services/salesmanService';

interface SalesmanDetailsDrawerProps {
  salesman: SalesmanDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalesmanDetailsDrawer({
  salesman,
  open,
  onOpenChange,
}: SalesmanDetailsDrawerProps) {
  const [companiesPage, setCompaniesPage] = useState(1);
  const [displayedPassword, setDisplayedPassword] = useState<string | null>(
    salesman?.password || null
  );
  const limit = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: salesmanData, refetch: refetchSalesman } = useQuery({
    queryKey: ['salesman', salesman?.id],
    queryFn: () => salesmanService.getById(salesman!.id),
    enabled: !!salesman?.id && open,
  });

  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['salesman-companies', salesman?.id, companiesPage, limit],
    queryFn: () =>
      salesmanService.getCompanies(salesman?.id || '', {
        page: companiesPage,
        limit,
      }),
    enabled: !!salesman?.id && open,
  });

  // Use salesmanData if available, otherwise use prop
  const currentSalesman = salesmanData || salesman;

  const resetPasswordMutation = useMutation({
    mutationFn: () => salesmanService.resetPassword(currentSalesman!.id),
    onSuccess: (data) => {
      setDisplayedPassword(data.password);
      queryClient.invalidateQueries({ queryKey: ['salesmen'] });
      refetchSalesman(); // Refetch to get updated data
      toast({
        title: 'Password Reset',
        description: 'Password has been reset successfully. New password is displayed below.',
        duration: 5000,
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

  const handleCopyPassword = () => {
    if (displayedPassword) {
      navigator.clipboard.writeText(displayedPassword);
      toast({
        title: 'Copied',
        description: 'Password copied to clipboard',
        duration: 2000,
      });
    }
  };

  // Update displayed password when salesman changes
  useEffect(() => {
    if (currentSalesman?.password) {
      setDisplayedPassword(currentSalesman.password);
    } else {
      setDisplayedPassword(null);
    }
  }, [currentSalesman?.password]);

  // Refetch salesman data when drawer opens
  useEffect(() => {
    if (open && salesman?.id) {
      refetchSalesman();
    }
  }, [open, salesman?.id, refetchSalesman]);

  if (!currentSalesman) return null;

  const companies = companiesData?.companies || currentSalesman.companies || [];
  const totalCompanies = companiesData?.total || currentSalesman.companies_count || 0;
  const totalPages = Math.ceil(totalCompanies / limit);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Salesman Details
          </SheetTitle>
          <SheetDescription>
            View detailed information about the salesman and companies they've onboarded
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Salesman Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Personal Information
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Name</p>
                  <p className="font-medium text-slate-900">{currentSalesman.name}</p>
                </div>
                <Badge
                  variant={currentSalesman.is_active ? 'success' : 'secondary'}
                  className="shrink-0"
                >
                  {currentSalesman.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Email</p>
                  <p className="font-medium text-slate-900">{currentSalesman.email}</p>
                </div>
              </div>

              {currentSalesman.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-1">Phone</p>
                    <p className="font-medium text-slate-900">{currentSalesman.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-500">Password</p>
                    <div className="flex items-center gap-2">
                      {displayedPassword && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyPassword}
                          className="h-7 text-xs"
                          title="Copy password"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetPasswordMutation.mutate()}
                        disabled={resetPasswordMutation.isPending}
                        className="h-7 text-xs"
                      >
                        {resetPasswordMutation.isPending ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reset
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {displayedPassword ? (
                    <p className="font-medium text-slate-900 font-mono">{displayedPassword}</p>
                  ) : (
                    <p className="font-medium text-slate-900">-</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Created At</p>
                  <p className="font-medium text-slate-900">
                    {new Date(currentSalesman.created_at).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {currentSalesman.last_login && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-1">Last Login</p>
                    <p className="font-medium text-slate-900">
                      {new Date(currentSalesman.last_login).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Companies Onboarded */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Companies Onboarded
              </h3>
              <Badge variant="outline" className="text-sm">
                {totalCompanies} {totalCompanies === 1 ? 'Company' : 'Companies'}
              </Badge>
            </div>

            {isLoadingCompanies ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : companies.length === 0 ? (
              <div className="bg-slate-50 rounded-lg p-8 text-center">
                <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No companies onboarded yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  This salesman hasn't onboarded any companies
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold">Company Name</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">
                            Email
                          </TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold hidden lg:table-cell">
                            Created
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.map((company) => (
                          <TableRow key={company.id} className="hover:bg-slate-50">
                            <TableCell className="font-medium text-slate-900">
                              {company.name}
                            </TableCell>
                            <TableCell className="text-slate-600 hidden md:table-cell">
                              {company.email}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={company.is_active ? 'success' : 'secondary'}
                                className="text-xs"
                              >
                                {company.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-600 text-sm hidden lg:table-cell">
                              {new Date(company.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Showing {((companiesPage - 1) * limit) + 1} to{' '}
                      {Math.min(companiesPage * limit, totalCompanies)} of {totalCompanies}{' '}
                      companies
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompaniesPage((p) => Math.max(1, p - 1))}
                        disabled={companiesPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCompaniesPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={companiesPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

