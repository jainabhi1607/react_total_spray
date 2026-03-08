"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";

interface LogEntry {
  _id: string;
  task?: string;
  dateTime?: string;
  createdAt: string;
  userId?: {
    _id: string;
    name?: string;
    lastName?: string;
  } | null;
}

export default function TicketLogPage() {
  useEffect(() => {
    document.title = "TSC - Support Tickets";
  }, []);

  const params = useParams();
  const ticketId = params.id as string;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [ticketNo, setTicketNo] = useState<string>("");
  const [createdBy, setCreatedBy] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/logs?page=${page}&limit=${limit}`);
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setLogs(d.data || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [ticketId, page]);

  // Fetch ticket info for header
  useEffect(() => {
    async function fetchTicketInfo() {
      try {
        const res = await fetch(`/api/support-tickets/${ticketId}`);
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          setTicketNo(String(d.ticketNo || ""));
          setCreatedBy(d.userId?.name || "");
          setCreatedAt(
            d.createdAt
              ? new Date(d.createdAt).toLocaleDateString("en-AU", {
                  month: "long",
                  day: "2-digit",
                  year: "numeric",
                })
              : ""
          );
        }
      } catch {
        // silent
      }
    }
    fetchTicketInfo();
  }, [ticketId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function formatLogDate(dateStr?: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("en-AU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }) +
      " - " +
      d.toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  }

  if (loading && logs.length === 0) return <PageLoading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Log</h1>
          <p className="text-sm text-gray-400 mt-1">
            Ticket {ticketNo} was created by {createdBy ? `- ${createdBy}` : ""}{createdAt ? ` - ${createdAt}` : ""}
          </p>
        </div>
        <Link href={`/support-tickets/${ticketId}`}>
          <Button variant="outline" className="gap-2">
            Return to Ticket Overview
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-gray-400">No log entries found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const userName = log.userId?.name || "Unknown";
            const date = formatLogDate(log.dateTime || log.createdAt);
            return (
              <Card key={log._id}>
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{date}</p>
                  <p className="text-sm text-gray-600">
                    {userName} - {log.task || "Activity logged"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Page {page} of {totalPages}, showing {logs.length} record(s) out of {total} total
        </p>
      </div>
    </div>
  );
}
