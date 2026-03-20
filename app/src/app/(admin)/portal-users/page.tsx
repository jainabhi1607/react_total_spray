"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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

interface PortalUser {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  role: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

const ROLE_LABELS: Record<number, string> = {
  4: "Administrator",
  6: "Client User",
};

export default function PortalUsersPage() {
  useEffect(() => { document.title = "TSC - Portal Users"; }, []);
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/users");
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteError("");
    setInviting(true);
    try {
      const res = await fetch("/api/portal/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setInviteOpen(false);
        setInviteEmail("");
        fetchUsers();
      } else {
        setInviteError(json.error || "Failed to send invitation");
      }
    } catch {
      setInviteError("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Portal Users</h1>
        <Button
          onClick={() => { setInviteEmail(""); setInviteError(""); setInviteOpen(true); }}
          className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]"
        >
          Invite User
        </Button>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">No users found</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Role</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-normal text-gray-900">
                  {user.name}{user.lastName ? ` ${user.lastName}` : ""}
                </TableCell>
                <TableCell className="font-normal text-gray-900">
                  {user.email}
                </TableCell>
                <TableCell className="font-normal text-gray-900">
                  {user.updatedAt ? formatDateTime(user.updatedAt) : "-"}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-0.5 text-[12px] font-medium text-green-700 border border-green-200">
                    {ROLE_LABELS[user.role] || "User"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/portal-users/${user._id}`} className="inline-flex items-center gap-1 text-[13px] text-gray-900 hover:text-cyan-500 cursor-pointer">
                    View <ChevronRight className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(v) => { if (!v) { setInviteOpen(false); setInviteEmail(""); setInviteError(""); } }}>
        <DialogContent className="max-w-md rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4">
            <DialogTitle className="text-lg font-bold">Invite User</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">Send an invitation to a new user</DialogDescription>
          <hr className="border-gray-200" />
          <div className="px-6 py-5">
            <div className="space-y-1">
              <Label className="text-[13px] text-gray-700">Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                placeholder="Enter email address"
                className="rounded-[10px] text-[13px]"
              />
              {inviteError && (
                <p className="text-[12px] text-red-500 mt-1">{inviteError}</p>
              )}
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-3 px-6 py-4">
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]"
            >
              {inviting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Send Invitation
            </Button>
            <button
              onClick={() => { setInviteOpen(false); setInviteEmail(""); setInviteError(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
