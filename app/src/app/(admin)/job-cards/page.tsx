"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
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
import { PageLoading, PageError } from "@/components/ui/loading";
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
import { CircularProgress } from "@/components/ui/circular-progress";

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
  jobCardType?: { _id: string; title: string } | null;
  recurringJob?: number;
  recurringPeriod?: number;
  recurringRange?: number;
  nextRecurringDate?: string;
  contractApprove?: number;
  startDate?: string;
  totalAssets?: number;
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

// Portal-specific status labels (only show for status 7 and 8)
const CLIENT_STATUS_LABELS: Record<number, string> = {
  7: "Job Confirmed",
  8: "Internal Review",
};

const ADMIN_TABS = [
  { label: "Active", value: "active" },
  { label: "Complete", value: "complete" },
  { label: "Recurring", value: "recurring" },
];

const PORTAL_TABS = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
];

// --- Page Component ---

export default function JobCardsListPage() {
  return (
    <Suspense>
      <JobCardsContent />
    </Suspense>
  );
}

function JobCardsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "");
  const [addJobCardOpen, setAddJobCardOpen] = useState(false);
  const [addRecurringOpen, setAddRecurringOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({ open: 0, inProgress: 0, completed: 0, total: 0 });
  const [userRole, setUserRole] = useState<number | null>(null);

  const isPortal = userRole === 4 || userRole === 6;

  // Fetch session to determine role
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        const json = await res.json();
        const role = json?.user?.role;
        if (role) {
          setUserRole(role);
          // Set default tab based on role if not already set
          if (!searchParams.get("tab")) {
            setActiveTab([4, 6].includes(role) ? "upcoming" : "active");
          }
        }
      } catch {
        setUserRole(3); // fallback to admin
      }
    }
    fetchSession();
  }, [searchParams]);

  useEffect(() => {
    document.title = isPortal ? "Services" : "Job Cards";
  }, [isPortal]);

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
    if (!activeTab) return; // Wait for tab to be set
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
    if (!activeTab) return;
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    const defaultTab = isPortal ? "upcoming" : "active";
    if (activeTab && activeTab !== defaultTab) params.set("tab", activeTab);

    const qs = params.toString();
    router.replace(`/job-cards${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [page, activeTab, router, isPortal]);

  function handleTabChange(value: string) {
    setActiveTab(value);
    setPage(1);
  }

  // Stat card data
  const statCards = [
    {
      label: "Open Job Cards",
      count: stats.open,
      percentage: stats.total > 0 ? Math.round((stats.open / stats.total) * 100) : 0,
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
      percentage: stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0,
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
      percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      ringColor: "#82cd66",
      countColor: "#82cd66",
      trackColor: "#e5e7eb",
      textColor: "#6b7280",
      dark: false,
      key: "completed",
    },
  ];

  if (userRole === null || (loading && jobCards.length === 0)) {
    return <PageLoading />;
  }

  if (error && jobCards.length === 0) {
    return (
      <PageError
        message={isPortal ? "Unable to load services" : "Unable to load job cards"}
        detail={error}
        onRetry={fetchJobCards}
      />
    );
  }

  const tabs = isPortal ? PORTAL_TABS : ADMIN_TABS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isPortal ? "Services" : "Job Cards"}
        </h1>
        {!isPortal && (
          <div className="flex items-center gap-2">
            <QuickAddButtons />
            <button
              style={cyanBtnStyle}
              className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
              onClick={() => setAddRecurringOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Recurring
            </button>
            <button
              style={cyanBtnStyle}
              className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
              onClick={() => setAddJobCardOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Job Card
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards - admin only */}
      {!isPortal && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <Card
              key={card.key}
              className={card.dark ? "bg-slate-800 border-slate-700" : "bg-white"}
            >
              <CardContent
                className="flex items-center justify-between p-5"
                style={{ height: 126 }}
              >
                <div>
                  <p className={`text-sm font-medium ${card.dark ? "text-slate-300" : "text-gray-500"}`}>
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold mt-1" style={{ color: card.countColor }}>
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
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mt-4">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
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
              <p className="text-sm text-gray-500">
                {isPortal
                  ? activeTab === "upcoming"
                    ? "You have no upcoming services scheduled."
                    : "No completed services found."
                  : "No job cards found"}
              </p>
            </div>
          ) : isPortal ? (
            /* Portal: Upcoming / Completed table */
            <PortalTable
              jobCards={jobCards}
              activeTab={activeTab}
            />
          ) : activeTab === "recurring" ? (
            /* Admin: Recurring tab */
            <RecurringTable jobCards={jobCards} fetchJobCards={fetchJobCards} />
          ) : (
            /* Admin: Active/Complete tabs */
            <AdminTable jobCards={jobCards} />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total}{" "}
            {isPortal ? "service" : "job card"}
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

      {!isPortal && (
        <>
          <AddJobCardDialog
            open={addJobCardOpen}
            onOpenChange={setAddJobCardOpen}
            onSuccess={() => { fetchJobCards(); fetchStats(); }}
          />
          <AddJobCardDialog
            open={addRecurringOpen}
            onOpenChange={setAddRecurringOpen}
            recurring
            onSuccess={() => { fetchJobCards(); fetchStats(); }}
          />
        </>
      )}
    </div>
  );
}

// --- Portal Table ---

function PortalTable({ jobCards, activeTab }: { jobCards: JobCard[]; activeTab: string }) {
  return (
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
            // Asset column: show "Multiple" if totalAssets > 1
            const assetDisplay =
              (job.totalAssets || 0) > 1
                ? "Multiple"
                : job.clientAssetId?.machineName || "-";

            // Status: only show for status 7 (Job Confirmed) and 8 (Internal Review)
            const clientStatus = CLIENT_STATUS_LABELS[job.jobCardStatus];
            const statusConfig = STATUS_BADGE_CONFIG[job.jobCardStatus];

            return (
              <TableRow key={job._id}>
                <TableCell className="font-medium">
                  {job.ticketNo || "-"}
                </TableCell>
                <TableCell className="max-w-[140px] truncate">
                  {job.clientSiteId?.siteName || "-"}
                </TableCell>
                <TableCell className="max-w-[140px] truncate">
                  {assetDisplay}
                </TableCell>
                <TableCell className="whitespace-nowrap text-gray-500">
                  {job.jobDate ? formatDate(job.jobDate) : ""}
                </TableCell>
                <TableCell className="max-w-[140px] truncate">
                  {job.jobCardType?.title || ""}
                </TableCell>
                <TableCell>
                  {clientStatus && statusConfig ? (
                    <span
                      className="inline-flex items-center px-3 py-1 text-xs font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: statusConfig.bg,
                        color: statusConfig.text,
                        borderRadius: 5,
                      }}
                    >
                      {clientStatus}
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
  );
}

// --- Admin Table ---

function AdminTable({ jobCards }: { jobCards: JobCard[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Ticket No <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </span>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Client <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </span>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Site <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </span>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Asset <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </span>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Date Allocated <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </span>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Date Created <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </span>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Job Type <ArrowUpDown className="h-3 w-3 text-gray-400" />
              </span>
            </TableHead>
            <TableHead>
              <span className="inline-flex items-center gap-1">
                Status <ArrowUpDown className="h-3 w-3 text-gray-400" />
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
                <TableCell className="font-medium">{job.ticketNo || "-"}</TableCell>
                <TableCell className="max-w-[160px] truncate">{job.clientId?.companyName || "-"}</TableCell>
                <TableCell className="max-w-[140px] truncate">{job.clientSiteId?.siteName || "-"}</TableCell>
                <TableCell className="max-w-[140px] truncate">{job.clientAssetId?.machineName || "-"}</TableCell>
                <TableCell className="whitespace-nowrap text-gray-500">
                  {job.jobDate ? formatDate(job.jobDate) : ""}
                </TableCell>
                <TableCell className="whitespace-nowrap text-gray-500">{formatDate(job.createdAt)}</TableCell>
                <TableCell className="max-w-[140px] truncate">{job.jobCardType?.title || ""}</TableCell>
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
  );
}

// --- Recurring Table ---

function RecurringTable({ jobCards, fetchJobCards }: { jobCards: JobCard[]; fetchJobCards: () => void }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Recurring Period</TableHead>
            <TableHead>Next Date</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobCards.map((job) => {
            const hasRecurringData = !!(job.recurringPeriod && job.recurringRange && job.nextRecurringDate);
            const periodLabels: Record<number, string> = { 1: "Years", 2: "Months", 3: "Weeks" };
            const periodText = hasRecurringData
              ? `${job.recurringRange} ${periodLabels[job.recurringPeriod!] || ""}`
              : "";
            const nextDate = job.nextRecurringDate ? new Date(job.nextRecurringDate) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysUntilNext = nextDate
              ? Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              : Infinity;
            const showApprove = hasRecurringData && daysUntilNext <= 45;

            return (
              <TableRow key={job._id}>
                <TableCell className="font-medium">{job.clientId?.companyName || "-"}</TableCell>
                <TableCell>{job.clientSiteId?.siteName || "-"}</TableCell>
                <TableCell>{job.clientAssetId?.machineName || "-"}</TableCell>
                <TableCell>{periodText}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {nextDate ? formatDate(job.nextRecurringDate!) : ""}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {showApprove && (
                      job.contractApprove === 1 ? (
                        <span
                          className="inline-flex items-center px-4 py-1.5 text-xs font-medium rounded-[10px] border"
                          style={{ color: "#22c55e", borderColor: "#22c55e" }}
                        >
                          Auto Approve
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            if (!confirm("Approve this recurring job for the next date?")) return;
                            try {
                              const res = await fetch(`/api/job-cards/${job._id}/recurring/approve`, { method: "POST" });
                              const json = await res.json();
                              if (res.ok && json.success) fetchJobCards();
                              else alert(json.error || "Failed to approve");
                            } catch { alert("Failed to approve"); }
                          }}
                          className="inline-flex items-center px-4 py-1.5 text-xs font-medium text-white rounded-[10px] cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: "#22c55e" }}
                        >
                          Approve
                        </button>
                      )
                    )}
                    {hasRecurringData && (
                      <button
                        onClick={async () => {
                          if (!confirm("Dismiss and skip to the next recurring date?")) return;
                          try {
                            const res = await fetch(`/api/job-cards/${job._id}/recurring/dismiss`, { method: "POST" });
                            const json = await res.json();
                            if (res.ok && json.success) fetchJobCards();
                            else alert(json.error || "Failed to dismiss");
                          } catch { alert("Failed to dismiss"); }
                        }}
                        className="inline-flex items-center px-4 py-1.5 text-xs font-medium text-white rounded-[10px] cursor-pointer hover:opacity-80"
                        style={{ backgroundColor: "#F29C38" }}
                      >
                        Dismiss
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (!confirm("Cancel this recurring job card?")) return;
                        try {
                          const res = await fetch(`/api/job-cards/${job._id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: 2 }),
                          });
                          const json = await res.json();
                          if (res.ok && json.success) fetchJobCards();
                        } catch { /* silent */ }
                      }}
                      className="inline-flex items-center px-4 py-1.5 text-xs font-medium text-white rounded-[10px] cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: "#ef4444" }}
                    >
                      Cancel
                    </button>
                    <Link href={`/job-cards/${job._id}`}>
                      <button className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 hover:text-gray-700">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
