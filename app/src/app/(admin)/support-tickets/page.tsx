"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
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
import {
  formatDate,
  TICKET_STATUS,
  TICKET_STATUS_LABELS,
} from "@/lib/utils";

// --- Types ---

interface Ticket {
  _id: string;
  ticketNo: string;
  clientId: { _id: string; companyName: string } | null;
  siteId: { _id: string; siteName: string } | null;
  ticketStatus: number;
  warranty: boolean;
  createdAt: string;
}

interface TicketResponse {
  success: boolean;
  data: Ticket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// --- Status color helper ---

function getTicketStatusColor(status: number): string {
  switch (status) {
    case TICKET_STATUS.OPEN:
      return "bg-blue-100 text-blue-800";
    case TICKET_STATUS.IN_PROGRESS:
      return "bg-yellow-100 text-yellow-800";
    case TICKET_STATUS.ON_HOLD:
      return "bg-orange-100 text-orange-800";
    case TICKET_STATUS.RESOLVED:
      return "bg-green-100 text-green-800";
    case TICKET_STATUS.CLOSED:
      return "bg-gray-100 text-gray-800";
    case TICKET_STATUS.TO_INVOICE:
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// --- Status filter tabs ---

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Open", value: String(TICKET_STATUS.OPEN) },
  { label: "In Progress", value: String(TICKET_STATUS.IN_PROGRESS) },
  { label: "On Hold", value: String(TICKET_STATUS.ON_HOLD) },
  { label: "Resolved", value: String(TICKET_STATUS.RESOLVED) },
  { label: "Closed", value: String(TICKET_STATUS.CLOSED) },
  { label: "To Invoice", value: String(TICKET_STATUS.TO_INVOICE) },
];

// --- Page component ---

export default function SupportTicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [activeStatus, setActiveStatus] = useState(
    searchParams.get("ticketStatus") || ""
  );

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (search) params.set("q", search);
      if (activeStatus) params.set("ticketStatus", activeStatus);

      const res = await fetch(`/api/support-tickets?${params.toString()}`);
      const json: TicketResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error("Failed to load tickets");
      }

      setTickets(json.data);
      setTotalPages(json.pagination.totalPages);
      setTotal(json.pagination.total);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, search, activeStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Update URL search params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (search) params.set("q", search);
    if (activeStatus) params.set("ticketStatus", activeStatus);

    const qs = params.toString();
    router.replace(`/support-tickets${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [page, search, activeStatus, router]);

  function handleStatusChange(value: string) {
    setActiveStatus(value);
    setPage(1);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  }

  if (loading && tickets.length === 0) {
    return <PageLoading />;
  }

  if (error && tickets.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load tickets
          </p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <Button className="mt-4" onClick={fetchTickets}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} ticket{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/support-tickets/add">
          <Button>
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusChange(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No tickets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Warranty</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket._id}>
                    <TableCell>
                      <Link
                        href={`/support-tickets/${ticket._id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {ticket.ticketNo}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {ticket.clientId?.companyName || "-"}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {ticket.siteId?.siteName || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTicketStatusColor(ticket.ticketStatus)}>
                        {TICKET_STATUS_LABELS[ticket.ticketStatus] || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          ticket.warranty
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {ticket.warranty ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-500">
                      {formatDate(ticket.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/support-tickets/${ticket._id}`}>
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
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
