"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Archive, RotateCcw, TicketCheck, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoading, InlineLoading } from "@/components/ui/loading";
import {
  formatDate,
  TICKET_STATUS_LABELS,
  JOB_CARD_STATUS_LABELS,
} from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArchivedTicket {
  _id: string;
  ticketNo?: string;
  title?: string;
  subject?: string;
  clientId?: string | { _id: string; companyName: string };
  ticketStatus?: number;
  status?: number;
  createdAt?: string;
}

interface ArchivedJobCard {
  _id: string;
  ticketNo?: string;
  jobCardNo?: string;
  title?: string;
  clientId?: string | { _id: string; companyName: string };
  jobCardStatus?: number;
  status?: number;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ArchivePage() {
  useEffect(() => { document.title = "TSC - Archive"; }, []);
  const [tickets, setTickets] = useState<ArchivedTicket[]>([]);
  const [jobCards, setJobCards] = useState<ArchivedJobCard[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingJobCards, setLoadingJobCards] = useState(true);
  const [errorTickets, setErrorTickets] = useState<string | null>(null);
  const [errorJobCards, setErrorJobCards] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    setErrorTickets(null);
    try {
      const res = await fetch("/api/support-tickets?status=2");
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to load archived tickets");
      setTickets(json.data?.data || json.data || []);
    } catch (err: any) {
      setErrorTickets(err.message);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  const fetchJobCards = useCallback(async () => {
    setLoadingJobCards(true);
    setErrorJobCards(null);
    try {
      const res = await fetch("/api/job-cards?status=2");
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to load archived job cards");
      setJobCards(json.data?.data || json.data || []);
    } catch (err: any) {
      setErrorJobCards(err.message);
    } finally {
      setLoadingJobCards(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchJobCards();
  }, [fetchTickets, fetchJobCards]);

  const restoreTicket = async (id: string) => {
    setRestoringId(id);
    try {
      const res = await fetch(`/api/support-tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 1 }),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to restore ticket");
      await fetchTickets();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const restoreJobCard = async (id: string) => {
    setRestoringId(id);
    try {
      const res = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 1 }),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to restore job card");
      await fetchJobCards();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const getClientName = (
    clientId?: string | { _id: string; companyName: string }
  ): string => {
    if (!clientId) return "-";
    if (typeof clientId === "object") return clientId.companyName || "-";
    return "-";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Archive</h1>
      </div>

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets" className="gap-1.5">
            <TicketCheck className="h-4 w-4" />
            Archived Tickets
            {tickets.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {tickets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="job-cards" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Archived Job Cards
            {jobCards.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {jobCards.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Archived Tickets */}
        <TabsContent value="tickets" className="mt-4">
          {loadingTickets ? (
            <PageLoading />
          ) : errorTickets ? (
            <div className="flex h-[30vh] items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  Unable to load archived tickets
                </p>
                <p className="mt-1 text-sm text-gray-500">{errorTickets}</p>
                <Button variant="outline" className="mt-4" onClick={fetchTickets}>
                  Retry
                </Button>
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Archive className="h-12 w-12 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-900">
                  No archived tickets
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Archived support tickets will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                            {ticket.ticketNo || "-"}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {ticket.title || ticket.subject || "-"}
                        </TableCell>
                        <TableCell>{getClientName(ticket.clientId)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {ticket.ticketStatus
                              ? TICKET_STATUS_LABELS[ticket.ticketStatus] || "Archived"
                              : "Archived"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-gray-500">
                          {ticket.createdAt ? formatDate(ticket.createdAt) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={restoringId === ticket._id}
                            onClick={() => restoreTicket(ticket._id)}
                          >
                            {restoringId === ticket._id ? (
                              <InlineLoading />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Archived Job Cards */}
        <TabsContent value="job-cards" className="mt-4">
          {loadingJobCards ? (
            <PageLoading />
          ) : errorJobCards ? (
            <div className="flex h-[30vh] items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  Unable to load archived job cards
                </p>
                <p className="mt-1 text-sm text-gray-500">{errorJobCards}</p>
                <Button variant="outline" className="mt-4" onClick={fetchJobCards}>
                  Retry
                </Button>
              </div>
            </div>
          ) : jobCards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Archive className="h-12 w-12 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-900">
                  No archived job cards
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Archived job cards will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Card #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobCards.map((jc) => (
                      <TableRow key={jc._id}>
                        <TableCell>
                          <Link
                            href={`/job-cards/${jc._id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {jc.jobCardNo || jc.ticketNo || "-"}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {jc.title || "-"}
                        </TableCell>
                        <TableCell>{getClientName(jc.clientId)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {jc.jobCardStatus
                              ? JOB_CARD_STATUS_LABELS[jc.jobCardStatus] || "Archived"
                              : "Archived"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-gray-500">
                          {jc.createdAt ? formatDate(jc.createdAt) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={restoringId === jc._id}
                            onClick={() => restoreJobCard(jc._id)}
                          >
                            {restoringId === jc._id ? (
                              <InlineLoading />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
