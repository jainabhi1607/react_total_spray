"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { QuickAddButtons, cyanBtnStyle } from "@/components/quick-add-buttons";
import { AddJobCardDialog } from "@/components/dialogs/add-job-card-dialog";
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

interface JobCard {
  _id: string;
  ticketNo: number;
  uniqueId?: string;
  clientId: { _id: string; companyName: string } | null;
  clientSiteId: { _id: string; siteName: string } | null;
  clientAssetId: { _id: string; machineName: string } | null;
  titleId: { _id: string; title: string } | null;
  jobCardStatus: number;
  jobDate?: string;
  jobCardSendDate?: string;
  createdAt: string;
}

interface Stats {
  open: number;
  inProgress: number;
  completed: number;
  total: number;
}

// --- Constants ---

const STATUS_BADGE_CONFIG: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: "Date Allocated", bg: "#F7CE4A", text: "#FFFFFF" },
  2: { label: "Date Confirmed", bg: "#83CE67", text: "#FFFFFF" },
  3: { label: "Assigned Technicians", bg: "#E18230", text: "#FFFFFF" },
  4: { label: "Technician Avail. Conf.", bg: "#D514A1", text: "#FFFFFF" },
  5: { label: "Client Date Confirmed", bg: "#A114D5", text: "#FFFFFF" },
  6: { label: "Job Card Sent", bg: "#00AEEF", text: "#FFFFFF" },
  7: { label: "Checklist Complete", bg: "#F7CE4A", text: "#FFFFFF" },
  8: { label: "Internal Review", bg: "#2B790E", text: "#FFFFFF" },
  9: { label: "Job Invoiced", bg: "#000000", text: "#FFFFFF" },
};

const TABS = [
  { label: "Active", value: "active" },
  { label: "Complete", value: "complete" },
  { label: "Recurring", value: "recurring" },
];

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

export default function JobCardsListPage() {
  useEffect(() => {
    document.title = "TSC - Job Cards";
  }, []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "active"
  );
  const [addJobCardOpen, setAddJobCardOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    open: 0,
    inProgress: 0,
    completed: 0,
    total: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/job-cards/stats");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch {
      // Stats are non-critical
    }
  }, []);

  const fetchJobCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (activeTab) params.set("tab", activeTab);

      const res = await fetch(`/api/job-cards?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error("Failed to load job cards");
      }

      const responseData = json.data;
      setJobCards(responseData.data);
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
    fetchJobCards();
  }, [fetchJobCards]);

  // Update URL search params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (activeTab && activeTab !== "active") params.set("tab", activeTab);

    const qs = params.toString();
    router.replace(`/job-cards${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [page, activeTab, router]);

  function handleTabChange(value: string) {
    setActiveTab(value);
    setPage(1);
  }

  // Stat card data
  const statCards = [
    {
      label: "Open Job Cards",
      count: stats.open,
      percentage:
        stats.total > 0 ? Math.round((stats.open / stats.total) * 100) : 0,
      ringColor: "#38bdf8",
      countColor: "#38bdf8",
      trackColor: "#475569",
      textColor: "#ffffff",
      dark: true,
      key: "open",
    },
    {
      label: "In Progress",
      count: stats.inProgress,
      percentage:
        stats.total > 0
          ? Math.round((stats.inProgress / stats.total) * 100)
          : 0,
      ringColor: "#f7cd4b",
      countColor: "#f7cd4b",
      trackColor: "#e5e7eb",
      textColor: "#6b7280",
      dark: false,
      key: "inProgress",
    },
    {
      label: "Completed",
      count: stats.completed,
      percentage:
        stats.total > 0
          ? Math.round((stats.completed / stats.total) * 100)
          : 0,
      ringColor: "#82cd66",
      countColor: "#82cd66",
      trackColor: "#e5e7eb",
      textColor: "#6b7280",
      dark: false,
      key: "completed",
    },
  ];

  if (loading && jobCards.length === 0) {
    return <PageLoading />;
  }

  if (error && jobCards.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load job cards
          </p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <Button className="mt-4" onClick={fetchJobCards}>
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
        <h1 className="text-2xl font-bold text-gray-900">Job Cards</h1>
        <div className="flex items-center gap-2">
          <QuickAddButtons />
          <Link href="/job-cards/add?recurring=1">
            <button
              style={cyanBtnStyle}
              className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Recurring
            </button>
          </Link>
          <button
            style={cyanBtnStyle}
            className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
            onClick={() => setAddJobCardOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Job Card
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card
            key={card.key}
            className={
              card.dark ? "bg-slate-800 border-slate-700" : "bg-white"
            }
          >
            <CardContent
              className="flex items-center justify-between p-5"
              style={{ height: 126 }}
            >
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
              className={`whitespace-nowrap border-b-2 text-sm font-normal cursor-pointer transition-colors ${
                activeTab === tab.value
                  ? "border-[#00AEEF] text-[#00AEEF]"
                  : "border-transparent text-gray-900 hover:border-gray-300"
              }`}
              style={{
                lineHeight: "30px",
                paddingLeft: 25,
                paddingRight: 25,
                fontSize: 14,
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {jobCards.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No job cards found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Ticket No
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Client
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Site
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
                        Date Allocated
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Date Created
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Job Type
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobCards.map((job) => {
                    const statusConfig = STATUS_BADGE_CONFIG[job.jobCardStatus];
                    return (
                      <TableRow key={job._id}>
                        <TableCell className="font-medium">
                          {job.ticketNo || "-"}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate">
                          {job.clientId?.companyName || "-"}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate">
                          {job.clientSiteId?.siteName || "-"}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate">
                          {job.clientAssetId?.machineName || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-gray-500">
                          {job.jobDate ? formatDate(job.jobDate) : ""}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-gray-500">
                          {formatDate(job.createdAt)}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate">
                          {job.titleId?.title || ""}
                        </TableCell>
                        <TableCell>
                          {statusConfig && job.jobCardStatus > 1 ? (
                            <span
                              className="inline-flex items-center px-3 py-1 text-xs font-medium whitespace-nowrap"
                              style={{
                                backgroundColor: statusConfig.bg,
                                color: statusConfig.text,
                                borderRadius: 5,
                              }}
                            >
                              {statusConfig.label}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/job-cards/${job._id}`}>
                            <button className="rounded-[10px] p-1.5 text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-600">
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
            Page {page} of {totalPages} ({total} job card
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

      <AddJobCardDialog
        open={addJobCardOpen}
        onOpenChange={setAddJobCardOpen}
        onSuccess={() => {
          fetchJobCards();
          fetchStats();
        }}
      />
    </div>
  );
}
