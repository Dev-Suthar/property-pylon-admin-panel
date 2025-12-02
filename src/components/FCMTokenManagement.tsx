import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  notificationService,
  UserWithToken,
} from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Send, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface FCMTokenManagementProps {
  companyId: string;
}

export function FCMTokenManagement({ companyId }: FCMTokenManagementProps) {
  const [page, setPage] = useState(1);
  const [hasTokenFilter, setHasTokenFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["users-with-tokens", companyId, page, hasTokenFilter],
    queryFn: () =>
      notificationService.getUsersWithTokens(companyId, {
        page,
        limit,
        has_token:
          hasTokenFilter !== "all" ? hasTokenFilter === "true" : undefined,
      }),
    enabled: !!companyId,
  });

  const testNotificationMutation = useMutation({
    mutationFn: (userId: string) =>
      notificationService.sendTestNotification({
        company_id: companyId,
        user_id: userId,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test notification sent successfully",
      });
      setSelectedUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>FCM Token Management</CardTitle>
        <CardDescription>
          View and manage FCM tokens for company users. Test notifications can
          be sent to users with registered tokens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <div className="grid gap-2 w-48">
              <Label htmlFor="token-filter">Token Status</Label>
              <Select
                value={hasTokenFilter}
                onValueChange={(value) => {
                  setHasTokenFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="true">Has Token</SelectItem>
                  <SelectItem value="false">No Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-slate-500">
              Error loading users
            </div>
          ) : !data || data.users.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No users found</div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Token Status</TableHead>
                      <TableHead>Token Preview</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-slate-500">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.Role ? (
                            <Badge variant="outline">{user.Role.name}</Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.fcm_token_preview ? (
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Has Token
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="mr-1 h-3 w-3" />
                              No Token
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {user.fcm_token_preview || (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDate(user.updated_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? "default" : "secondary"}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.fcm_token_preview ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                testNotificationMutation.mutate(user.id);
                              }}
                              disabled={
                                testNotificationMutation.isPending &&
                                selectedUserId === user.id
                              }
                            >
                              {testNotificationMutation.isPending &&
                              selectedUserId === user.id ? (
                                <>Sending...</>
                              ) : (
                                <>
                                  <Send className="mr-2 h-3 w-3" />
                                  Test
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              No token
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.total > limit && (
                <div className="flex justify-center pt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {[...Array(Math.ceil(data.total / limit))].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === Math.ceil(data.total / limit) ||
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
                        } else if (
                          pageNum === page - 2 ||
                          pageNum === page + 2
                        ) {
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
                          onClick={() =>
                            setPage((p) =>
                              Math.min(Math.ceil(data.total / limit), p + 1)
                            )
                          }
                          className={
                            page === Math.ceil(data.total / limit)
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
