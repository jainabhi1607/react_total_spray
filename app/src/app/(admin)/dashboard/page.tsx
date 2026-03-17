"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
import {
  formatDate,
  formatLongDate,
  TICKET_STATUS_LABELS,
  JOB_CARD_STATUS_LABELS,
} from "@/lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// --- Types ---

interface RecentTicket {
  _id: string;
  ticketNo: string;
  clientId: { companyName: string };
  description?: string;
  ticketStatus: number;
  createdAt: string;
}

interface RecentJobCard {
  _id: string;
  ticketNo: string;
  clientId: { companyName: string };
  jobCardStatus: number;
  createdAt: string;
}

interface StatusCount {
  _id: number;
  count: number;
}

interface AdminDashboardData {
  activeClients: number;
  openTickets: number;
  openJobCards: number;
  activeTechnicians: number;
  recentTickets: RecentTicket[];
  recentJobCards: RecentJobCard[];
  ticketsByStatus: StatusCount[];
  jobCardsByStatus: StatusCount[];
}

interface PortalDashboardData {
  isPortal: true;
  sites: number;
  assets: number;
  openTickets: number;
  openJobCards: number;
  contacts: number;
  activeUsers: number;
  totalMaintenanceActions: number;
  machineWithMostInteractions: string | null;
  nextServiceDate: string | null;
  nextServiceSite: string | null;
  upcomingServiceSites: { siteName: string; totalJobs: number }[];
  mostMaintenanceActions: string | null;
  maintenanceByMonth: number[];
  maintenanceByType: { title: string; count: number }[];
  recentTickets: RecentTicket[];
  recentJobCards: RecentJobCard[];
  ticketsByStatus: StatusCount[];
  jobCardsByStatus: StatusCount[];
}

type DashboardData = AdminDashboardData | PortalDashboardData;

// --- Status color helpers ---

function getTicketStatusColor(status: number): string {
  switch (status) {
    case 1: return "bg-blue-100 text-blue-800";
    case 2: return "bg-yellow-100 text-yellow-800";
    case 3: return "bg-orange-100 text-orange-800";
    case 4: return "bg-green-100 text-green-800";
    case 5: return "bg-gray-100 text-gray-800";
    case 6: return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getJobCardStatusColor(status: number): string {
  switch (status) {
    case 0: return "bg-gray-100 text-gray-800";
    case 1: return "bg-blue-100 text-blue-800";
    case 2: return "bg-yellow-100 text-yellow-800";
    case 3: return "bg-green-100 text-green-800";
    case 4: return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getTicketStatusBarColor(status: number): string {
  switch (status) {
    case 1: return "bg-blue-500";
    case 2: return "bg-yellow-500";
    case 3: return "bg-orange-500";
    case 4: return "bg-green-500";
    case 5: return "bg-gray-400";
    case 6: return "bg-purple-500";
    default: return "bg-gray-400";
  }
}

function getJobCardStatusBarColor(status: number): string {
  switch (status) {
    case 0: return "bg-gray-400";
    case 1: return "bg-blue-500";
    case 2: return "bg-yellow-500";
    case 3: return "bg-green-500";
    case 4: return "bg-red-500";
    default: return "bg-gray-400";
  }
}

// --- Stat card configs ---

const adminStatCards = [
  { key: "activeClients" as const, label: "Active Clients", iconSrc: "/clients.svg", iconBg: "bg-blue-100" },
  { key: "openTickets" as const, label: "Open Tickets", iconSrc: "/support_tickets.svg", iconBg: "bg-orange-100" },
  { key: "openJobCards" as const, label: "Open Job Cards", iconSrc: "/briefcase.svg", iconBg: "bg-green-100" },
  { key: "activeTechnicians" as const, label: "Active Technicians", iconSrc: "/tool.svg", iconBg: "bg-purple-100" },
];

// --- Portal info box component ---

function PortalBox({
  title,
  value,
  href,
  cyan,
}: {
  title: string;
  value: string | number | null;
  href?: string;
  cyan?: boolean;
}) {
  const content = (
    <div
      className={`rounded-[10px] border border-gray-200 p-5 flex flex-col justify-between h-full ${
        cyan ? "bg-[#00AEEF] text-white" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <p className={`text-[14px] font-medium ${cyan ? "text-white" : "text-gray-700"}`}>
          {title}
        </p>
        {href && (
          <ChevronRight className={`h-5 w-5 shrink-0 ${cyan ? "text-white" : "text-gray-400"}`} />
        )}
      </div>
      <p className={`text-[28px] font-bold mt-3 ${cyan ? "text-white" : "text-gray-900"}`}>
        {value ?? "-"}
      </p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// --- Page component ---

export default function DashboardPage() {
  useEffect(() => { document.title = "TSC - Dashboard"; }, []);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load dashboard data");
        }
        setData(json.data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <PageLoading />;

  if (error || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Unable to load dashboard</p>
          <p className="mt-1 text-sm text-gray-500">{error || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  const isPortal = "isPortal" in data && data.isPortal;

  if (isPortal) {
    const d = data as PortalDashboardData;
    return <PortalDashboard data={d} />;
  }

  return <AdminDashboard data={data as AdminDashboardData} />;
}

// --- Portal Dashboard ---

function PortalDashboard({ data }: { data: PortalDashboardData }) {
  return (
    <div className="space-y-6">
      {/* Row 1: Number of Assets (tall cyan) + 2x2 grid + Most Upcoming Services */}
      <div className="grid grid-cols-4 gap-4" style={{ gridTemplateRows: "auto auto" }}>
        {/* Number of Assets - spans 2 rows */}
        <div className="row-span-2">
          <Link href="/assets" className="block h-full">
            <div className="rounded-[10px] bg-[#00AEEF] p-5 flex flex-col justify-between h-full min-h-[220px]">
              <div className="flex items-start justify-between">
                <p className="text-[14px] font-medium text-white">Number of Assets</p>
                <ChevronRight className="h-5 w-5 text-white shrink-0" />
              </div>
              <p className="text-[40px] font-bold text-white">{data.assets}</p>
            </div>
          </Link>
        </div>

        {/* New Support Tickets */}
        <PortalBox title="New Support Tickets" value={data.openTickets} href="/support-tickets" />

        {/* Next Service Date */}
        <PortalBox
          title="Next Service Date"
          value={data.nextServiceDate ? formatLongDate(data.nextServiceDate) : null}
        />

        {/* Most Upcoming Services - spans 2 rows */}
        <div className="row-span-2">
          <Link href="/job-cards" className="block h-full">
            <div className="rounded-[10px] border border-gray-200 bg-white p-5 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <p className="text-[14px] font-medium text-gray-700">Most Upcoming Services</p>
                <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
              </div>
              {data.upcomingServiceSites.length === 0 ? (
                <p className="text-sm text-gray-400">No upcoming services</p>
              ) : (
                <div className="space-y-3 flex-1">
                  {data.upcomingServiceSites.map((site, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-gray-900">{site.siteName || "-"}</span>
                        <span className="text-[13px] font-semibold text-gray-900">{site.totalJobs}</span>
                      </div>
                      {i < data.upcomingServiceSites.length - 1 && (
                        <hr className="mt-3 border-gray-200" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Machine With Most Interactions */}
        <PortalBox
          title="Machine With Most Interactions"
          value={data.machineWithMostInteractions}
        />

        {/* Next Service Site */}
        <PortalBox title="Next Service Site" value={data.nextServiceSite} />
      </div>

      {/* Row 2: Charts + Recent Support Tickets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Maintenance action per month - bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[16px]">
              Maintenance action per month ({new Date().getFullYear()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceBarChart data={data.maintenanceByMonth} />
          </CardContent>
        </Card>

        {/* Recent Support Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[16px]">Recent Support Tickets</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {data.recentTickets.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No tickets found</p>
            ) : (
              <div className="space-y-0">
                {data.recentTickets.map((ticket) => (
                  <Link
                    key={ticket._id}
                    href={`/support-tickets/${ticket._id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-6 text-[13px] text-gray-700">
                      <span>{formatDate(ticket.createdAt)}</span>
                      <span className="font-medium">{ticket.ticketNo}</span>
                      <span>{ticket.clientId?.companyName || "-"}</span>
                      <span className="text-gray-500 truncate max-w-[150px]">
                        {ticket.description || "-"}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Maintenance breakdown + Sites/Contacts/Active Users/Most Maintenance */}
      <div className="grid grid-cols-3 gap-4">
        {/* Maintenance action Breakdown by Type */}
        <Card className="row-span-2">
          <CardHeader>
            <CardTitle className="text-[16px]">Maintenance action Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceTypeBreakdown
              types={data.maintenanceByType}
              total={data.totalMaintenanceActions}
            />
          </CardContent>
        </Card>

        {/* Sites */}
        <PortalBox title="Sites" value={data.sites} href="/sites" />

        {/* Contacts */}
        <PortalBox title="Contacts" value={data.contacts} href="/contacts" />

        {/* Active Users */}
        <PortalBox title="Active Users" value={data.activeUsers} />

        {/* Most maintenance Actions */}
        <PortalBox title="Most maintenance Actions" value={data.mostMaintenanceActions} href="/assets" />
      </div>
    </div>
  );
}

// --- Chart components ---

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TYPE_COLORS = [
  "#1c58ff", "#f89700", "#fdc700", "#21d59b", "#c5f800", "#00bef0",
  "#7c40fe", "#22358d", "#e91bf3", "#ff400b", "#880410",
];

function MaintenanceBarChart({ data }: { data: number[] }) {
  const maxValue = Math.max(...data, 5);
  const stepSize = Math.max(1, Math.floor(maxValue / 5));

  return (
    <Bar
      data={{
        labels: MONTH_LABELS,
        datasets: [
          {
            label: "Maintenance",
            data,
            backgroundColor: "#03A9F4",
            barThickness: 15,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: maxValue,
            ticks: { stepSize },
          },
          x: {},
        },
      }}
    />
  );
}

function MaintenanceTypeBreakdown({
  types,
  total,
}: {
  types: { title: string; count: number }[];
  total: number;
}) {
  const totalForPct = total || 1;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[14px] text-cyan-500">Total Maintenance Actions</span>
        <span className="text-[16px] font-bold text-gray-900">{total}</span>
      </div>

      {types.length > 0 ? (
        <div className="flex gap-6">
          {/* Doughnut chart */}
          <div className="w-[120px] h-[120px] shrink-0">
            <Doughnut
              data={{
                labels: types.map((t) => t.title),
                datasets: [
                  {
                    data: types.map((t) => (t.count / totalForPct) * 100),
                    backgroundColor: TYPE_COLORS.slice(0, types.length),
                    hoverOffset: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                cutout: "85%",
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#FFF",
                    bodyColor: "#000",
                    titleColor: "#000",
                    displayColors: false,
                    callbacks: {
                      title: () => "",
                      label: (ctx) => `${ctx.label}: ${(ctx.raw as number).toFixed(1)}%`,
                    },
                  },
                },
              }}
            />
          </div>

          {/* Legend list */}
          <div className="flex-1 space-y-2">
            {types.map((t, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }}
                  />
                  <span className="text-[13px] text-gray-700">{t.title}</span>
                </div>
                <span className="text-[13px] font-medium text-gray-900">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 mt-4">No data available</p>
      )}
    </div>
  );
}

// --- Admin Dashboard ---

function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const ticketsByStatus = data.ticketsByStatus || [];
  const jobCardsByStatus = data.jobCardsByStatus || [];
  const recentTickets = data.recentTickets || [];
  const recentJobCards = data.recentJobCards || [];

  const ticketTotal = ticketsByStatus.reduce((s, i) => s + i.count, 0);
  const jobCardTotal = jobCardsByStatus.reduce((s, i) => s + i.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adminStatCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] ${card.iconBg}`}>
                <img src={card.iconSrc} alt="" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{(data as any)[card.key]}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent tickets & job cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No tickets found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTickets.map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell>
                        <Link href={`/support-tickets/${ticket._id}`} className="font-medium text-blue-600 hover:underline">
                          {ticket.ticketNo}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">{ticket.clientId?.companyName || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getTicketStatusColor(ticket.ticketStatus)}>
                          {TICKET_STATUS_LABELS[ticket.ticketStatus] || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-500">{formatDate(ticket.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Job Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobCards.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No job cards found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobCards.map((job) => (
                    <TableRow key={job._id}>
                      <TableCell>
                        <Link href={`/job-cards/${job._id}`} className="font-medium text-blue-600 hover:underline">
                          {job.ticketNo}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">{job.clientId?.companyName || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getJobCardStatusColor(job.jobCardStatus)}>
                          {JOB_CARD_STATUS_LABELS[job.jobCardStatus] || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-500">{formatDate(job.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketsByStatus.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No data available</p>
            ) : (
              <div className="space-y-3">
                {ticketsByStatus.map((item) => {
                  const pct = ticketTotal > 0 ? Math.round((item.count / ticketTotal) * 100) : 0;
                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{TICKET_STATUS_LABELS[item._id] || "Unknown"}</span>
                        <span className="text-gray-500">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${getTicketStatusBarColor(item._id)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Cards by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {jobCardsByStatus.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">No data available</p>
            ) : (
              <div className="space-y-3">
                {jobCardsByStatus.map((item) => {
                  const pct = jobCardTotal > 0 ? Math.round((item.count / jobCardTotal) * 100) : 0;
                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{JOB_CARD_STATUS_LABELS[item._id] || "Unknown"}</span>
                        <span className="text-gray-500">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${getJobCardStatusBarColor(item._id)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
