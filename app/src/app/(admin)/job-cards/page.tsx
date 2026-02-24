"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoading } from "@/components/ui/loading";
import { formatDate, JOB_CARD_STATUS_LABELS } from "@/lib/utils";

// --- Types ---

interface JobCardClient {
  _id: string;
  companyName: string;
}

interface JobCardSite {
  _id: string;
  siteName: string;
}

interface JobCard {
  _id: string;
  ticketNo: string;
  uniqueId?: string;
  clientId: JobCardClient;
  siteId?: JobCardSite;
  jobCardStatus: number;
  jobDate?: string;
  warranty?: boolean;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Status helpers ---

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Open", value: "1" },
  { label: "In Progress", value: "2" },
  { label: "Completed", value: "3" },
  { label: "Cancelled", value: "4" },
];

function getJobCardStatusColor(status: number): string {
  switch (status) {
    case 0:
      return "bg-gray-100 text-gray-800";
    case 1:
      return "bg-blue-100 text-blue-800";
    case 2:
      return "bg-yellow-100 text-yellow-800";
    case 3:
      return "bg-green-100 text-green-800";
    case 4:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// --- Page component ---

export default function JobCardsListPage() {
  useEffect(() => { document.title = "TSC - Job Cards"; }, []);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const fetchJobCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter) params.set("jobCardStatus", statusFilter);

      const res = await fetch(`/api/job-cards?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load job cards");
      }

      const responseData = json.data;
      setJobCards(responseData.data || []);
      setPagination({
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 20,
        totalPages: responseData.totalPages || 1,
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Cards</h1>
        </div>
        <Link href="/job-cards/add">
          <Button>
            <Plus className="h-4 w-4" />
            New Job Card
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Status tabs */}
            <div className="flex flex-wrap gap-1 rounded-[10px] bg-gray-100 p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
                    statusFilter === tab.value
                      ? "bg-white text-gray-950 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative sm:ml-auto sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search job cards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <PageLoading />
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-lg font-medium text-gray-900">
                Unable to load job cards
              </p>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchJobCards}
              >
                Try Again
              </Button>
            </div>
          ) : jobCards.length === 0 ? (
            <div className="py-20 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                No job cards found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {search || statusFilter
                  ? "Try adjusting your search or filters."
                  : "Get started by creating a new job card."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Job Date</TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobCards.map((job) => (
                    <TableRow key={job._id}>
                      <TableCell>
                        <Link
                          href={`/job-cards/${job._id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {job.ticketNo || job.uniqueId || "-"}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {job.clientId?.companyName || "-"}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {job.siteId?.siteName || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getJobCardStatusColor(job.jobCardStatus)}
                        >
                          {JOB_CARD_STATUS_LABELS[job.jobCardStatus] ||
                            "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-500">
                        {job.jobDate ? formatDate(job.jobDate) : "-"}
                      </TableCell>
                      <TableCell>
                        {job.warranty ? (
                          <Badge variant="success">Yes</Badge>
                        ) : (
                          <span className="text-sm text-gray-400">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/job-cards/${job._id}`}>
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                  <p className="text-sm text-gray-500">
                    Showing{" "}
                    {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
