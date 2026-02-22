"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, TicketCheck, ClipboardList, Wrench } from "lucide-react";
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
  TICKET_STATUS_LABELS,
  JOB_CARD_STATUS_LABELS,
} from "@/lib/utils";

// --- Types ---

interface RecentTicket {
  _id: string;
  ticketNo: string;
  clientId: { companyName: string };
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

interface DashboardData {
  clientCount: number;
  ticketCount: number;
  jobCardCount: number;
  technicianCount: number;
  recentTickets: RecentTicket[];
  recentJobCards: RecentJobCard[];
  ticketsByStatus: StatusCount[];
  jobCardsByStatus: StatusCount[];
}

// --- Status color helpers ---

function getTicketStatusColor(status: number): string {
  switch (status) {
    case 1: return "bg-blue-100 text-blue-800";       // Open
    case 2: return "bg-yellow-100 text-yellow-800";    // In Progress
    case 3: return "bg-orange-100 text-orange-800";    // On Hold
    case 4: return "bg-green-100 text-green-800";      // Resolved
    case 5: return "bg-gray-100 text-gray-800";        // Closed
    case 6: return "bg-purple-100 text-purple-800";    // To Invoice
    default: return "bg-gray-100 text-gray-800";
  }
}

function getJobCardStatusColor(status: number): string {
  switch (status) {
    case 0: return "bg-gray-100 text-gray-800";        // Draft
    case 1: return "bg-blue-100 text-blue-800";        // Open
    case 2: return "bg-yellow-100 text-yellow-800";    // In Progress
    case 3: return "bg-green-100 text-green-800";      // Completed
    case 4: return "bg-red-100 text-red-800";          // Cancelled
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

// --- Stat card config ---

const statCards = [
  {
    key: "clientCount" as const,
    label: "Active Clients",
    icon: Building2,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    key: "ticketCount" as const,
    label: "Open Tickets",
    icon: TicketCheck,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    key: "jobCardCount" as const,
    label: "Open Job Cards",
    icon: ClipboardList,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    key: "technicianCount" as const,
    label: "Active Technicians",
    icon: Wrench,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

// --- Page component ---

export default function DashboardPage() {
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

  if (loading) {
    return <PageLoading />;
  }

  if (error || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load dashboard
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {error || "An unexpected error occurred."}
          </p>
        </div>
      </div>
    );
  }

  const ticketTotal = data.ticketsByStatus.reduce((s, i) => s + i.count, 0);
  const jobCardTotal = data.jobCardsByStatus.reduce((s, i) => s + i.count, 0);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your system activity
        </p>
      </div>

      {/* Stats cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {data[card.key]}
                  </p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent tickets & job cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Support Tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTickets.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                No tickets found
              </p>
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
                  {data.recentTickets.map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell>
                        <Link
                          href={`/support-tickets/${ticket._id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {ticket.ticketNo}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {ticket.clientId?.companyName || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getTicketStatusColor(ticket.ticketStatus)}
                        >
                          {TICKET_STATUS_LABELS[ticket.ticketStatus] ||
                            "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Job Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Job Cards</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentJobCards.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                No job cards found
              </p>
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
                  {data.recentJobCards.map((job) => (
                    <TableRow key={job._id}>
                      <TableCell>
                        <Link
                          href={`/job-cards/${job._id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {job.ticketNo}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {job.clientId?.companyName || "-"}
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
                        {formatDate(job.createdAt)}
                      </TableCell>
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
        {/* Tickets by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tickets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {data.ticketsByStatus.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                No data available
              </p>
            ) : (
              <div className="space-y-3">
                {data.ticketsByStatus.map((item) => {
                  const pct =
                    ticketTotal > 0
                      ? Math.round((item.count / ticketTotal) * 100)
                      : 0;
                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {TICKET_STATUS_LABELS[item._id] || "Unknown"}
                        </span>
                        <span className="text-gray-500">
                          {item.count} ({pct}%)
                        </span>
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

        {/* Job Cards by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Cards by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {data.jobCardsByStatus.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                No data available
              </p>
            ) : (
              <div className="space-y-3">
                {data.jobCardsByStatus.map((item) => {
                  const pct =
                    jobCardTotal > 0
                      ? Math.round((item.count / jobCardTotal) * 100)
                      : 0;
                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {JOB_CARD_STATUS_LABELS[item._id] || "Unknown"}
                        </span>
                        <span className="text-gray-500">
                          {item.count} ({pct}%)
                        </span>
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
