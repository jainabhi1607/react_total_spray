"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoading } from "@/components/ui/loading";

interface Client {
  _id: string;
  companyName: string;
  abn?: string;
  address?: string;
  status: number;
}

interface PaginatedResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ClientsPage() {
  useEffect(() => { document.title = "TSC - Clients"; }, []);
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchTerm) {
        params.set("q", searchTerm);
      }

      const res = await fetch(`/api/clients?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to fetch clients");
      }

      const result: PaginatedResponse = json.data;
      setClients(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  if (loading && clients.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        </div>
        <Link href="/clients/add">
          <Button>
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>ABN / GST No.</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client._id}>
                    <TableCell className="font-medium">
                      {client.companyName}
                    </TableCell>
                    <TableCell>{client.abn || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {client.address || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={client.status === 1 ? "success" : "destructive"}
                      >
                        {client.status === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/clients/${client._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1} to{" "}
            {Math.min(page * 20, total)} of {total} clients
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
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
