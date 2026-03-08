"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageLoading, InlineLoading } from "@/components/ui/loading";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_ROLES = [
  { value: "3", label: "Administrator" },
  { value: "2", label: "Support Admin" },
];

const ROLE_DISPLAY: Record<number, string> = {
  1: "Super Admin",
  2: "Support Admin",
  3: "Administrator",
};

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "3", label: "Administrator" },
  { value: "2", label: "Support Admin" },
];

function getRoleBadgeColor(role: number): string {
  switch (role) {
    case 2:
      return "bg-indigo-100 text-indigo-800";
    case 3:
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusBadge(status: number) {
  switch (status) {
    case 1:
      return { label: "Active", className: "bg-green-100 text-green-800" };
    case 0:
      return { label: "Deactive", className: "bg-gray-100 text-gray-800" };
    default:
      return { label: "Unknown", className: "bg-gray-100 text-gray-800" };
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserItem {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  position?: string;
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
// Page
// ---------------------------------------------------------------------------

export default function UsersPage() {
  useEffect(() => { document.title = "TSC - Users"; }, []);

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

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

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

  function openAddDialog() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEditDialog(user: UserItem) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add User
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
          <div className="relative w-full sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {ROLE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
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
                          {ROLE_DISPLAY[user.role] || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
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

      {/* Add/Edit User Dialog */}
      <AddEditUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingUser={editingUser}
        onSuccess={() => {
          setDialogOpen(false);
          fetchUsers();
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add/Edit User Dialog
// ---------------------------------------------------------------------------

function AddEditUserDialog({
  open,
  onOpenChange,
  editingUser,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: UserItem | null;
  onSuccess: () => void;
}) {
  const isEdit = !!editingUser;

  const [form, setForm] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    position: "",
    role: "",
    status: "1",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingUser, setLoadingUser] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    setError("");
    setSaving(false);

    if (editingUser) {
      // For edit, fetch full user data to get all fields
      setLoadingUser(true);
      (async () => {
        try {
          const res = await fetch(`/api/users/${editingUser._id}`);
          const json = await res.json();
          if (json.success) {
            const u = json.data;
            setForm({
              name: u.name || "",
              lastName: u.lastName || "",
              email: u.email || "",
              password: "",
              phone: u.phone || "",
              position: u.position || "",
              role: String(u.role),
              status: String(u.status),
            });
          }
        } catch {
          // fallback to basic data
          setForm({
            name: editingUser.name || "",
            lastName: editingUser.lastName || "",
            email: editingUser.email || "",
            password: "",
            phone: editingUser.phone || "",
            position: editingUser.position || "",
            role: String(editingUser.role),
            status: String(editingUser.status),
          });
        } finally {
          setLoadingUser(false);
        }
      })();
    } else {
      setForm({
        name: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        position: "",
        role: "",
        status: "1",
      });
    }
  }, [open, editingUser]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit() {
    setError("");

    if (!form.name.trim()) { setError("First name is required"); return; }
    if (!form.email.trim()) { setError("Email is required"); return; }
    if (!isEdit && !form.password) { setError("Password is required"); return; }
    if (!form.role) { setError("Role is required"); return; }

    setSaving(true);
    try {
      const body: Record<string, any> = {
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        position: form.position.trim(),
        role: Number(form.role),
        status: Number(form.status),
      };
      if (form.password) body.password = form.password;

      const url = isEdit ? `/api/users/${editingUser._id}` : "/api/users";
      const method = isEdit ? "PUT" : "POST";

      if (!isEdit) {
        body.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || json.error || "Failed");

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>
        <hr />

        {loadingUser ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
          </div>
        ) : (
          <>
            <div className="space-y-4 px-2">
              {error && (
                <div className="rounded-[10px] bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
              )}

              {/* First Name */}
              <div className="flex items-center gap-4">
                <Label className="w-[120px] shrink-0 text-sm text-gray-600">
                  First Name <span className="text-cyan-500">(required)</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="John"
                  className="flex-1"
                />
              </div>

              {/* Last Name */}
              <div className="flex items-center gap-4">
                <Label className="w-[120px] shrink-0 text-sm text-gray-600">Last Name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Doe"
                  className="flex-1"
                />
              </div>

              {/* Email */}
              <div className="flex items-center gap-4">
                <Label className="w-[120px] shrink-0 text-sm text-gray-600">
                  Email <span className="text-cyan-500">(required)</span>
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john@example.com"
                  className="flex-1"
                />
              </div>

              {/* Password */}
              <div className="flex items-center gap-4">
                <Label className="w-[120px] shrink-0 text-sm text-gray-600">
                  Password {!isEdit && <span className="text-cyan-500">(required)</span>}
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={isEdit ? "Leave blank to keep current" : "Enter password"}
                  className="flex-1"
                />
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4">
                <Label className="w-[120px] shrink-0 text-sm text-gray-600">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+61 400 000 000"
                  className="flex-1"
                />
              </div>

              {/* Position */}
              <div className="flex items-center gap-4">
                <Label className="w-[120px] shrink-0 text-sm text-gray-600">Position</Label>
                <Input
                  value={form.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  placeholder="Manager"
                  className="flex-1"
                />
              </div>

              {/* Role */}
              <div className="flex items-center gap-4">
                <Label className="w-[120px] shrink-0 text-sm text-gray-600">
                  Role <span className="text-cyan-500">(required)</span>
                </Label>
                <div className="relative flex-1">
                  <select
                    value={form.role}
                    onChange={(e) => handleChange("role", e.target.value)}
                    className="w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select Role</option>
                    {USER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4">
                <Label className="w-[120px] shrink-0 text-sm text-gray-600">Status</Label>
                <div className="relative flex-1">
                  <select
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="1">Active</option>
                    <option value="0">Deactive</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-2 pt-3">
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Create User"}
              </Button>
              <button
                onClick={() => onOpenChange(false)}
                className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
