"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface PortalUser {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  role: number;
  status: number;
  createdAt: string;
}

const ROLE_LABELS: Record<number, string> = {
  4: "Administrator",
  6: "Client User",
};

export default function PortalUsersPage() {
  useEffect(() => { document.title = "TSC - Users"; }, []);
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/portal/users");
        const json = await res.json();
        if (json.success) setUsers(json.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Users ({users.length})</h1>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No users found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      {user.name} {user.lastName || ""}
                    </TableCell>
                    <TableCell className="text-gray-500">{user.email}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {ROLE_LABELS[user.role] || "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.status === 1 ? "bg-green-100 text-green-800" : user.status === 25 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}>
                        {user.status === 1 ? "Active" : user.status === 25 ? "Invited" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-500">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
