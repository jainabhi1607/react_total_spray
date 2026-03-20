"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, RotateCcw, Trash2, User } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

interface LoginEntry {
  _id: string;
  ipAddress?: string;
  city?: string;
  dateTime?: string;
  loginResponse?: string;
}

interface PortalUserDetail {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  position?: string;
  role: number;
  status: number;
  createdAt?: string;
  updatedAt?: string;
  loginHistory: LoginEntry[];
}

const ROLE_LABELS: Record<number, string> = {
  4: "Administrator",
  6: "Client User",
};

export default function PortalUserDetailPage() {
  useEffect(() => { document.title = "TSC - Portal User"; }, []);
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<PortalUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editRole, setEditRole] = useState(6);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset password
  const [resetting, setResetting] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/users/${userId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load user");
      setUser(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  function openEditDialog() {
    if (!user) return;
    setEditName(user.name || "");
    setEditLastName(user.lastName || "");
    setEditEmail(user.email || "");
    setEditPhone(user.phone || "");
    setEditPosition(user.position || "");
    setEditRole(user.role);
    setEditOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/portal/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          lastName: editLastName,
          email: editEmail,
          phone: editPhone,
          position: editPosition,
          role: editRole,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setUser((prev) => prev ? { ...prev, ...json.data, loginHistory: prev.loginHistory } : prev);
        setEditOpen(false);
      } else {
        alert(json.error || "Failed to save");
      }
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/portal/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 0 }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        router.push("/portal-users");
      } else {
        alert(json.error || "Failed to deactivate user");
      }
    } catch {
      alert("Failed to deactivate user");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  function getAccessBadge(response?: string) {
    if (!response) return null;
    const lower = response.toLowerCase();
    if (lower === "success" || lower === "ok") {
      return (
        <span className="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-3 py-0.5 text-[12px] font-medium text-green-700">
          Success
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-red-300 bg-red-50 px-3 py-0.5 text-[12px] font-medium text-red-600">
        {response}
      </span>
    );
  }

  if (loading) return <PageLoading />;

  if (error || !user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Unable to load user</p>
          <p className="mt-1 text-sm text-gray-500">{error || "User not found."}</p>
          <Button variant="outline" className="mt-4 rounded-[10px]" asChild>
            <Link href="/portal-users">Back to Portal Users</Link>
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${user.name}${user.lastName ? ` ${user.lastName}` : ""}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/portal-users" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
        <span className="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-4 py-1 text-[13px] font-medium text-green-700">
          {ROLE_LABELS[user.role] || "User"}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* LEFT — Profile Card */}
        <div className="w-[340px] shrink-0">
          <div className="rounded-[10px] border border-gray-200 bg-white">
            {/* Avatar */}
            <div className="flex justify-center pt-8 pb-6">
              <div className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-gray-100">
                <User className="h-16 w-16 text-gray-300" />
              </div>
            </div>

            {/* User Details Header */}
            <div className="flex items-center justify-between px-8 pb-4">
              <h3 className="text-[15px] font-semibold text-gray-900">User Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={openEditDialog}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Send a password reset email to ${user.email}?`)) return;
                    setResetting(true);
                    try {
                      const res = await fetch(`/api/portal/users/${userId}/reset-password`, { method: "POST" });
                      const json = await res.json();
                      if (res.ok && json.success) {
                        alert("Password reset link sent to " + user.email);
                      } else {
                        alert(json.error || "Failed to send reset email");
                      }
                    } catch {
                      alert("Failed to send reset email");
                    } finally {
                      setResetting(false);
                    }
                  }}
                  disabled={resetting}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
                  title="Reset Password"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
                  title="Deactivate"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Details List */}
            <div className="px-8 pb-8 space-y-4">
              {[
                { label: "Name", value: fullName },
                { label: "Email", value: user.email },
                { label: "Phone", value: user.phone || "Not set" },
                { label: "Position", value: user.position || "Not set" },
                { label: "User Groups", value: ROLE_LABELS[user.role] || "User" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-400">{item.label}</span>
                  <span className={`text-[13px] ${item.value === "Not set" ? "text-gray-400" : "text-gray-900"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Login History */}
        <div className="flex-1">
          <div className="rounded-[10px] border border-gray-200 bg-white p-8">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Login History</h3>
            {user.loginHistory.length === 0 ? (
              <p className="text-[13px] text-gray-400 py-4">No login history available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.loginHistory.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell className="text-[13px] text-gray-900">
                        {entry.dateTime ? formatDateTime(entry.dateTime) : "-"}
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-900">
                        {entry.ipAddress || "-"}
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-900">
                        {entry.city || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {getAccessBadge(entry.loginResponse)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4">
            <DialogTitle className="text-lg font-bold">Edit User</DialogTitle>
            <DialogDescription className="sr-only">Edit portal user details</DialogDescription>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="px-6 py-5 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[13px] text-gray-700 mb-1 block">First Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-[10px] text-[13px]" />
              </div>
              <div className="flex-1">
                <label className="text-[13px] text-gray-700 mb-1 block">Last Name</label>
                <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="rounded-[10px] text-[13px]" />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-gray-700 mb-1 block">Email</label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="rounded-[10px] text-[13px]" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[13px] text-gray-700 mb-1 block">Phone</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="rounded-[10px] text-[13px]" />
              </div>
              <div className="flex-1">
                <label className="text-[13px] text-gray-700 mb-1 block">Position</label>
                <Input value={editPosition} onChange={(e) => setEditPosition(e.target.value)} className="rounded-[10px] text-[13px]" />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-gray-700 mb-1 block">Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(Number(e.target.value))}
                className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value={4}>Administrator</option>
                <option value={6}>Client User</option>
              </select>
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-3 px-6 py-4">
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
            <button onClick={() => setEditOpen(false)} className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4">
            <DialogTitle className="text-lg font-bold">Deactivate User</DialogTitle>
            <DialogDescription className="sr-only">Confirm user deactivation</DialogDescription>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="px-6 py-5">
            <p className="text-[14px] text-gray-600">
              Are you sure you want to deactivate <strong>{fullName}</strong>? They will no longer be able to log in.
            </p>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-3 px-6 py-4">
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white rounded-[10px]">
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Deactivate
            </Button>
            <button onClick={() => setDeleteOpen(false)} className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
