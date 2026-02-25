"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight, Eye, Pencil } from "lucide-react";
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
import {
  TechnicianDialog,
  type TechnicianData,
} from "@/components/dialogs/technician-dialog";

// --- Types ---

interface TagData {
  _id: string;
  title: string;
}

interface Technician {
  _id: string;
  companyName: string;
  email?: string;
  phone?: string;
  abn?: string;
  address?: string;
  licenceNumber?: string;
  licenceExpiry?: string;
  insuranceStatus?: number;
  tags?: TagData[];
}

// --- Helpers ---

function getInsuranceBadge(status?: number) {
  switch (status) {
    case 1:
      return <Badge variant="success">Valid</Badge>;
    case 0:
      return <Badge variant="destructive">Invalid</Badge>;
    default:
      return <Badge variant="secondary">N/A</Badge>;
  }
}

// --- Page ---

export default function TechniciansPage() {
  useEffect(() => {
    document.title = "TSC - Technicians";
  }, []);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTechnician, setEditTechnician] = useState<
    TechnicianData | undefined
  >(undefined);

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
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to load technicians");
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

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  function handleAdd() {
    setEditTechnician(undefined);
    setDialogOpen(true);
  }

  function handleEdit(tech: Technician) {
    setEditTechnician({
      ...tech,
      assignedTagIds: (tech.tags || []).map((t) => t._id),
    });
    setDialogOpen(true);
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
        <Button
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" />
          Add Technician
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by company name or email..."
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
                  <TableHead>Company</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicians.map((tech) => (
                  <TableRow key={tech._id}>
                    <TableCell className="font-medium">
                      {tech.companyName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(tech.tags || []).map((tag) => (
                          <span
                            key={tag._id}
                            className="rounded-full border border-gray-300 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {tag.title}
                          </span>
                        ))}
                        {(!tech.tags || tech.tags.length === 0) && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{tech.email || "-"}</TableCell>
                    <TableCell>{tech.phone || "-"}</TableCell>
                    <TableCell>
                      {getInsuranceBadge(tech.insuranceStatus)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/technicians/${tech._id}`}>
                          <button className="rounded-[10px] p-1.5 text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-600">
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleEdit(tech)}
                          className="rounded-[10px] p-1.5 text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
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

      {/* Add/Edit Technician Dialog */}
      <TechnicianDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchTechnicians}
        technician={editTechnician}
      />
    </div>
  );
}
