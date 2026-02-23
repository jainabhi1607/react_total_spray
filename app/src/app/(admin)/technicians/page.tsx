"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Types ---

interface Technician {
  _id: string;
  companyName: string;
  email: string;
  phone: string;
  licenceNumber: string;
  insuranceStatus?: string;
}

interface TechniciansResponse {
  success: boolean;
  data: {
    data: Technician[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

// --- Helpers ---

function getInsuranceBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case "valid":
      return <Badge variant="success">Valid</Badge>;
    case "expired":
      return <Badge variant="destructive">Expired</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

// --- Page ---

export default function TechniciansPage() {
  useEffect(() => { document.title = "TSC - Technicians"; }, []);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTechnicians = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search.trim()) {
        params.set("q", search.trim());
      }
      const res = await fetch(`/api/technicians?${params.toString()}`);
      const json: TechniciansResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load technicians");
      }

      setTechnicians(json.data.data);
      setTotalPages(json.data.totalPages);
      setTotal(json.data.total);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  // Debounced search: reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  if (loading && technicians.length === 0) {
    return <PageLoading />;
  }

  if (error && technicians.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load technicians
          </p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
        </div>
        <Link href="/technicians/add">
          <Button>
            <Plus className="h-4 w-4" />
            Add Technician
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by company name, email, or licence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {technicians.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No technicians found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Licence #</TableHead>
                  <TableHead>Insurance Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicians.map((tech) => (
                  <TableRow key={tech._id}>
                    <TableCell className="font-medium">
                      {tech.companyName}
                    </TableCell>
                    <TableCell>{tech.email || "-"}</TableCell>
                    <TableCell>{tech.phone || "-"}</TableCell>
                    <TableCell>{tech.licenceNumber || "-"}</TableCell>
                    <TableCell>
                      {getInsuranceBadge(tech.insuranceStatus)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/technicians/${tech._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1} to{" "}
            {Math.min(page * 20, total)} of {total} technicians
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
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
