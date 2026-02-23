"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Mail,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoading, InlineLoading } from "@/components/ui/loading";
import { ROLE_LABELS } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserItem {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  role: number;
  status: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "1", label: "Super Admin" },
  { value: "2", label: "Sub Admin" },
  { value: "3", label: "Admin" },
  { value: "4", label: "Client Admin" },
  { value: "6", label: "Client User" },
  { value: "7", label: "Tech Company" },
  { value: "9", label: "Tech User" },
];

function getRoleBadgeColor(role: number): string {
  switch (role) {
    case 1:
      return "bg-purple-100 text-purple-800";
    case 2:
      return "bg-indigo-100 text-indigo-800";
    case 3:
      return "bg-blue-100 text-blue-800";
    case 4:
      return "bg-teal-100 text-teal-800";
    case 6:
      return "bg-cyan-100 text-cyan-800";
    case 7:
      return "bg-orange-100 text-orange-800";
    case 9:
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusBadge(status: number) {
  switch (status) {
    case 1:
      return { label: "Active", className: "bg-green-100 text-green-800" };
    case 0:
      return { label: "Inactive", className: "bg-gray-100 text-gray-800" };
    case 2:
      return { label: "Deleted", className: "bg-red-100 text-red-800" };
    case 25:
      return { label: "Pending", className: "bg-yellow-100 text-yellow-800" };
    default:
      return { label: "Unknown", className: "bg-gray-100 text-gray-800" };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UsersPage() {
  useEffect(() => { document.title = "TSC - Users"; }, []);
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search.trim()) params.set("q", search.trim());
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/users?${params}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to load users");

      const responseData = json.data;
      setUsers(responseData.data || []);
      setMeta({
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 20,
        totalPages: responseData.totalPages || 1,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  const handleInvite = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}/invite`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to send invite");
      alert("Invite sent successfully.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete "${userName}"?`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete user");
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        </div>
        <Button asChild>
          <Link href="/users/add">
            <Plus className="h-4 w-4" />
            Add User
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <PageLoading />
      ) : error ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Unable to load users</p>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchUsers}>
              Retry
            </Button>
          </div>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">No users found</p>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const statusInfo = getStatusBadge(user.status);
                  return (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">
                        {user.name} {user.lastName || ""}
                      </TableCell>
                      <TableCell className="text-gray-500">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {ROLE_LABELS[user.role] || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/users/${user._id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/users/${user._id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          {user.status === 25 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={actionLoading === user._id}
                              onClick={() => handleInvite(user._id)}
                            >
                              {actionLoading === user._id ? (
                                <InlineLoading />
                              ) : (
                                <Mail className="h-4 w-4 text-blue-500" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={actionLoading === user._id}
                            onClick={() =>
                              handleDelete(
                                user._id,
                                `${user.name} ${user.lastName || ""}`.trim()
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * meta.limit + 1} to{" "}
            {Math.min(page * meta.limit, meta.total)} of {meta.total} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
