"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Briefcase,
  User,
  Send,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoading, InlineLoading } from "@/components/ui/loading";
import { formatDate, ROLE_LABELS } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserDetail {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  position?: string;
  role: number;
  status: number;
  clientId?: string | { _id: string; companyName: string };
  createdAt?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function getStatusInfo(status: number) {
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

export default function UserDetailPage() {
  useEffect(() => { document.title = "TSC - User Details"; }, []);
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to load user");
        setUser(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleInvite = async () => {
    setInviting(true);
    try {
      const res = await fetch(`/api/users/${userId}/invite`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to send invite");
      alert("Invitation sent successfully.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviting(false);
    }
  };

  if (loading) return <PageLoading />;

  if (error || !user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Unable to load user</p>
          <p className="mt-1 text-sm text-gray-500">{error || "User not found."}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/users">Back to Users</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(user.status);
  const clientName =
    typeof user.clientId === "object" ? user.clientId?.companyName : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.name} {user.lastName || ""}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.status === 25 && (
            <Button variant="outline" onClick={handleInvite} disabled={inviting}>
              {inviting ? <InlineLoading /> : <Send className="h-4 w-4" />}
              Send Invite
            </Button>
          )}
          <Button asChild>
            <Link href={`/users/${userId}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* User card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile overview */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              {user.name} {user.lastName || ""}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge className={getRoleBadgeColor(user.role)}>
                {ROLE_LABELS[user.role] || "Unknown"}
              </Badge>
              <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Mail className="h-4 w-4" /> Email
                </dt>
                <dd className="text-sm text-gray-900">{user.email}</dd>
              </div>
              <div className="space-y-1">
                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Phone className="h-4 w-4" /> Phone
                </dt>
                <dd className="text-sm text-gray-900">{user.phone || "-"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Briefcase className="h-4 w-4" /> Position
                </dt>
                <dd className="text-sm text-gray-900">{user.position || "-"}</dd>
              </div>
              {clientName && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">Client</dt>
                  <dd className="text-sm text-gray-900">{clientName}</dd>
                </div>
              )}
              {user.createdAt && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
                </div>
              )}
              {user.updatedAt && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">{formatDate(user.updatedAt)}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
