"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Pencil,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { AddClientDialog } from "@/components/dialogs/add-client-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Types ---

interface TicketOwner {
  _id: string;
  name: string;
}

interface Ticket {
  _id: string;
  ticketNo: number;
  clientId: { _id: string; companyName: string } | null;
  clientSiteId: { _id: string; siteName: string } | null;
  clientAssetId: { _id: string; machineName: string } | null;
  titleId: { _id: string; title: string } | null;
  ticketStatus: number;
  createdAt: string;
  owners: TicketOwner[];
}

interface Stats {
  open: number;
  working: number;
  onSiteTechnician: number;
  resolved: number;
  total: number;
}

// --- Constants ---

const STATUS_LABELS: Record<number, string> = {
  1: "Open",
  2: "Working",
  3: "On-site Technician",
  4: "Resolved",
};

const STATUS_BADGE_CLASSES: Record<number, string> = {
  1: "bg-blue-500 text-white",
  2: "bg-yellow-400 text-gray-900",
  3: "bg-green-500 text-white",
  4: "bg-green-500 text-white",
};

const TABS = [
  { label: "Unresolved", value: "1,2,3" },
  { label: "Open", value: "1" },
  { label: "Working", value: "2" },
  { label: "On-site Technician", value: "3" },
  { label: "Resolved", value: "4" },
];

// --- Helpers ---

function calculateAge(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 Day";
  return `${days} Days`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// --- Circular Progress Ring ---

function CircularProgress({
  percentage,
  color,
  trackColor = "#e5e7eb",
  textColor = "#6b7280",
  size = 56,
}: {
  percentage: number;
  color: string;
  trackColor?: string;
  textColor?: string;
  size?: number;
}) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
        style={{ color: textColor }}
      >
        {percentage}%
      </span>
    </div>
  );
}

// --- Page Component ---

export default function SupportTicketsPage() {
  useEffect(() => {
    document.title = "TSC - Support Tickets";
  }, []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("ticketStatus") || "1,2,3"
  );
  const [stats, setStats] = useState<Stats>({
    open: 0,
    working: 0,
    onSiteTechnician: 0,
    resolved: 0,
    total: 0,
  });

  // Add Client dialog state
  const [addClientOpen, setAddClientOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/support-tickets/stats");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch {
      // Stats are non-critical
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (activeTab) params.set("ticketStatus", activeTab);

      const res = await fetch(`/api/support-tickets?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error("Failed to load tickets");
      }

      const responseData = json.data;
      setTickets(responseData.data);
      setTotalPages(responseData.totalPages);
      setTotal(responseData.total);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Update URL search params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (activeTab && activeTab !== "1,2,3")
      params.set("ticketStatus", activeTab);

    const qs = params.toString();
    router.replace(`/support-tickets${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [page, activeTab, router]);

  function handleTabChange(value: string) {
    setActiveTab(value);
    setPage(1);
  }

  // Stat card data
  const statCards = [
    {
      label: "Open Tickets",
      count: stats.open,
      percentage:
        stats.total > 0 ? Math.round((stats.open / stats.total) * 100) : 0,
      ringColor: "#f97316", // orange-500
      countColor: "#38bdf8", // sky-400
      trackColor: "#475569", // slate-600
      textColor: "#ffffff",
      dark: true,
      key: "open",
    },
    {
      label: "Working",
      count: stats.working,
      percentage:
        stats.total > 0 ? Math.round((stats.working / stats.total) * 100) : 0,
      ringColor: "#f7cd4b",
      countColor: "#f7cd4b",
      trackColor: "#e5e7eb",
      textColor: "#6b7280",
      dark: false,
      key: "working",
    },
    {
      label: "On-site Technician",
      count: stats.onSiteTechnician,
      percentage:
        stats.total > 0
          ? Math.round((stats.onSiteTechnician / stats.total) * 100)
          : 0,
      ringColor: "#E18230",
      countColor: "#E18230",
      trackColor: "#e5e7eb",
      textColor: "#6b7280",
      dark: false,
      key: "onSiteTechnician",
    },
    {
      label: "Resolved",
      count: stats.resolved,
      percentage:
        stats.total > 0
          ? Math.round((stats.resolved / stats.total) * 100)
          : 0,
      ringColor: "#82cd66",
      countColor: "#82cd66",
      trackColor: "#e5e7eb",
      textColor: "#6b7280",
      dark: false,
      key: "resolved",
    },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddClientOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Client
          </Button>
          <Link href="/clients">
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add Site
            </Button>
          </Link>
          <Link href="/assets">
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add Asset
            </Button>
          </Link>
          <Link href="/support-tickets/add">
            <Button
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.key}
            className={
              card.dark ? "bg-slate-800 border-slate-700" : "bg-white"
            }
          >
            <CardContent className="flex items-center justify-between p-5" style={{ height: 126 }}>
              <div>
                <p
                  className={`text-sm font-medium ${
                    card.dark ? "text-slate-300" : "text-gray-500"
                  }`}
                >
                  {card.label}
                </p>
                <p
                  className="text-3xl font-bold mt-1"
                  style={{ color: card.countColor }}
                >
                  {card.count}
                </p>
              </div>
              <CircularProgress
                percentage={card.percentage}
                color={card.ringColor}
                trackColor={card.trackColor}
                textColor={card.textColor}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mt-4">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`whitespace-nowrap border-b-2 text-sm font-normal transition-colors ${
                activeTab === tab.value
                  ? "border-cyan-500 text-gray-900"
                  : "border-transparent text-gray-900 hover:border-gray-300"
              }`}
              style={{ lineHeight: "30px", paddingLeft: 25, paddingRight: 25, fontSize: 14 }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No tickets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#EBF5FF]">
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Ticket No.
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Client Name
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Client Site
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Asset
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Job Title
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Age
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Owner
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Status
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell className="font-medium">
                        {ticket.ticketNo}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {ticket.clientId?.companyName || "-"}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {ticket.clientSiteId?.siteName || "-"}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {ticket.clientAssetId?.machineName || "-"}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {ticket.titleId?.title || "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-500">
                        {calculateAge(ticket.createdAt)}
                      </TableCell>
                      <TableCell>
                        {ticket.owners && ticket.owners.length > 0 ? (
                          <div className="flex -space-x-2">
                            {ticket.owners.slice(0, 3).map((owner) => (
                              <div
                                key={owner._id}
                                title={owner.name}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-white ring-2 ring-white"
                              >
                                {getInitials(owner.name)}
                              </div>
                            ))}
                            {ticket.owners.length > 3 && (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500 ring-2 ring-white">
                                +{ticket.owners.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
                            STATUS_BADGE_CLASSES[ticket.ticketStatus] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {STATUS_LABELS[ticket.ticketStatus] || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/support-tickets/${ticket._id}`}>
                          <button className="rounded-[10px] p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/support-tickets/${ticket._id}`}>
                          <button className="rounded-[10px] p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} ticket
            {total !== 1 ? "s" : ""})
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

      {/* Add Client Dialog */}
      <AddClientDialog
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
      />
    </div>
  );
}
