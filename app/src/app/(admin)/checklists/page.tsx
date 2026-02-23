"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
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
import { formatDate } from "@/lib/utils";

// --- Types ---

interface ChecklistTag {
  _id: string;
  name: string;
}

interface ChecklistTemplate {
  _id: string;
  title: string;
  createdBy: string | { name?: string; firstName?: string; lastName?: string };
  tags: ChecklistTag[];
  createdAt: string;
}

interface ChecklistsResponse {
  success: boolean;
  data: {
    data: ChecklistTemplate[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

// --- Helpers ---

function getCreatedByName(
  createdBy: string | { name?: string; firstName?: string; lastName?: string }
): string {
  if (typeof createdBy === "string") return createdBy;
  if (createdBy?.name) return createdBy.name;
  if (createdBy?.firstName)
    return `${createdBy.firstName} ${createdBy.lastName || ""}`.trim();
  return "-";
}

// --- Page ---

export default function ChecklistsPage() {
  useEffect(() => { document.title = "TSC - Checklists"; }, []);
  const [checklists, setChecklists] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchChecklists = useCallback(async () => {
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
      const res = await fetch(`/api/checklists?${params.toString()}`);
      const json: ChecklistsResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load checklists");
      }

      setChecklists(json.data.data);
      setTotalPages(json.data.totalPages);
      setTotal(json.data.total);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this checklist template?"))
      return;

    try {
      const res = await fetch(`/api/checklists/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete checklist");
      }
      fetchChecklists();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading && checklists.length === 0) {
    return <PageLoading />;
  }

  if (error && checklists.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load checklists
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
          <h1 className="text-2xl font-bold text-gray-900">
            Checklist Templates
          </h1>
        </div>
        <Link href="/checklists/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by title..."
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
          {checklists.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">
                No checklist templates found
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklists.map((checklist) => (
                  <TableRow key={checklist._id}>
                    <TableCell className="font-medium">
                      {checklist.title}
                    </TableCell>
                    <TableCell>
                      {getCreatedByName(checklist.createdBy)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {checklist.tags && checklist.tags.length > 0 ? (
                          checklist.tags.map((tag) => (
                            <Badge
                              key={tag._id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-500">
                      {formatDate(checklist.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/checklists/${checklist._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/checklists/${checklist._id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(checklist._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            {Math.min(page * 20, total)} of {total} templates
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
