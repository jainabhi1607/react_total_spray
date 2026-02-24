"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Clock,
  MessageSquare,
  Paperclip,
  Users,
  FileText,
  Loader2,
  Trash2,
  Upload,
  Plus,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  formatDateTime,
  TICKET_STATUS,
  TICKET_STATUS_LABELS,
} from "@/lib/utils";

// --- Types ---

interface TicketDetail {
  _id: string;
  ticketNo: string;
  ticketStatus: number;
  description: string;
  rootCause?: string;
  resolution?: string;
  resolvedComments?: string;
  warranty: boolean;
  partsRequired: boolean;
  productionImpact: boolean;
  onSiteTechnicianRequired: boolean;
  createdAt: string;
  updatedAt: string;
  clientId: { _id: string; companyName: string } | null;
  siteId: { _id: string; siteName: string } | null;
  assetId: { _id: string; assetName: string; assetNo?: string } | null;
  contactId: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
  titleId: { _id: string; name: string } | null;
}

interface Comment {
  _id: string;
  comment: string;
  visibility: number;
  createdAt: string;
  userId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    image?: string;
  } | null;
}

interface Attachment {
  _id: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
}

interface Technician {
  _id: string;
  technicianId: {
    _id: string;
    companyName?: string;
    email?: string;
  } | null;
  onSite: boolean;
}

interface TimeEntry {
  _id: string;
  hours: number;
  minutes: number;
  date: string;
  description: string;
  entryType?: string;
  userId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  } | null;
}

interface TechnicianOption {
  _id: string;
  companyName: string;
  email?: string;
}

interface TicketFullResponse {
  success: boolean;
  data: {
    ticket: TicketDetail;
    comments: Comment[];
    attachments: Attachment[];
    technicians: Technician[];
    time: TimeEntry[];
  };
}

// --- Status helpers ---

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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// --- Page component ---

export default function SupportTicketDetailPage() {
  useEffect(() => { document.title = "TSC - Support Ticket Details"; }, []);
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  // Main data
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment form
  const [commentText, setCommentText] = useState("");
  const [commentVisibility, setCommentVisibility] = useState("1");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Resolve dialog
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveData, setResolveData] = useState({
    resolvedComments: "",
    rootCause: "",
    resolution: "",
  });
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // Add technician dialog
  const [techDialogOpen, setTechDialogOpen] = useState(false);
  const [techOptions, setTechOptions] = useState<TechnicianOption[]>([]);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [submittingTech, setSubmittingTech] = useState(false);

  // Time entry form
  const [timeForm, setTimeForm] = useState({
    hours: "0",
    minutes: "0",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    entryType: "general",
  });
  const [submittingTime, setSubmittingTime] = useState(false);

  // Status change
  const [changingStatus, setChangingStatus] = useState(false);

  // Fetch ticket data
  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}`);
      const json: TicketFullResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error("Failed to load ticket");
      }

      setTicket(json.data.ticket);
      setComments(json.data.comments || []);
      setAttachments(json.data.attachments || []);
      setTechnicians(json.data.technicians || []);
      setTimeEntries(json.data.time || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // --- Status change ---
  async function handleStatusChange(newStatus: string) {
    if (!ticket) return;
    setChangingStatus(true);

    try {
      const res = await fetch(`/api/support-tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketStatus: Number(newStatus) }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update status");
      }

      setTicket((prev) =>
        prev ? { ...prev, ticketStatus: Number(newStatus) } : prev
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setChangingStatus(false);
    }
  }

  // --- Comment submission ---
  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: commentText.trim(),
          visibility: Number(commentVisibility),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add comment");
      }

      setCommentText("");
      // Refetch to get the latest comments
      await fetchTicket();
    } catch (err: any) {
      alert(err.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  // --- Resolve ticket ---
  async function handleResolve() {
    setSubmittingResolve(true);

    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resolveData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to resolve ticket");
      }

      setResolveOpen(false);
      await fetchTicket();
    } catch (err: any) {
      alert(err.message || "Failed to resolve ticket");
    } finally {
      setSubmittingResolve(false);
    }
  }

  // --- Add technician ---
  async function openTechDialog() {
    setTechDialogOpen(true);
    try {
      const res = await fetch("/api/technicians");
      const json = await res.json();
      if (json.success) {
        setTechOptions(json.data || []);
      }
    } catch {
      // Keep options empty
    }
  }

  async function handleAddTechnician() {
    if (!selectedTechId) return;
    setSubmittingTech(true);

    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/technicians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: selectedTechId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add technician");
      }

      setTechDialogOpen(false);
      setSelectedTechId("");
      await fetchTicket();
    } catch (err: any) {
      alert(err.message || "Failed to add technician");
    } finally {
      setSubmittingTech(false);
    }
  }

  // --- Add time entry ---
  async function handleTimeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingTime(true);

    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: Number(timeForm.hours),
          minutes: Number(timeForm.minutes),
          date: timeForm.date,
          description: timeForm.description.trim(),
          entryType: timeForm.entryType,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add time entry");
      }

      setTimeForm({
        hours: "0",
        minutes: "0",
        date: new Date().toISOString().slice(0, 10),
        description: "",
        entryType: "general",
      });
      await fetchTicket();
    } catch (err: any) {
      alert(err.message || "Failed to add time entry");
    } finally {
      setSubmittingTime(false);
    }
  }

  // --- Delete attachment ---
  async function handleDeleteAttachment(attachmentId: string) {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      const res = await fetch(
        `/api/support-tickets/${ticketId}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete attachment");
      }

      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
    } catch (err: any) {
      alert(err.message || "Failed to delete attachment");
    }
  }

  // --- Render ---

  if (loading) {
    return <PageLoading />;
  }

  if (error || !ticket) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load ticket
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {error || "Ticket not found"}
          </p>
          <Link href="/support-tickets">
            <Button className="mt-4" variant="outline">
              Back to Tickets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/support-tickets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {ticket.ticketNo}
              </h1>
              <Badge className={getTicketStatusColor(ticket.ticketStatus)}>
                {TICKET_STATUS_LABELS[ticket.ticketStatus] || "Unknown"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Created {formatDateTime(ticket.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status change dropdown */}
          <Select
            value={String(ticket.ticketStatus)}
            onValueChange={handleStatusChange}
            disabled={changingStatus}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link href={`/support-tickets/${ticketId}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Ticket Info Card */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-gray-500">Client</p>
            <p className="mt-1 text-sm text-gray-900">
              {ticket.clientId?.companyName || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Site</p>
            <p className="mt-1 text-sm text-gray-900">
              {ticket.siteId?.siteName || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Asset</p>
            <p className="mt-1 text-sm text-gray-900">
              {ticket.assetId
                ? `${ticket.assetId.assetName}${ticket.assetId.assetNo ? ` (${ticket.assetId.assetNo})` : ""}`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Contact</p>
            <p className="mt-1 text-sm text-gray-900">
              {ticket.contactId
                ? `${ticket.contactId.firstName} ${ticket.contactId.lastName}`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Title / Category
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {ticket.titleId?.name || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Created</p>
            <p className="mt-1 text-sm text-gray-900">
              {formatDateTime(ticket.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Warranty</p>
              <Badge
                className={
                  ticket.warranty
                    ? "mt-1 bg-green-100 text-green-800"
                    : "mt-1 bg-gray-100 text-gray-800"
                }
              >
                {ticket.warranty ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Parts Required</p>
            <Badge
              className={
                ticket.partsRequired
                  ? "mt-1 bg-blue-100 text-blue-800"
                  : "mt-1 bg-gray-100 text-gray-800"
              }
            >
              {ticket.partsRequired ? "Yes" : "No"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Production Impact
            </p>
            <Badge
              className={
                ticket.productionImpact
                  ? "mt-1 bg-red-100 text-red-800"
                  : "mt-1 bg-gray-100 text-gray-800"
              }
            >
              {ticket.productionImpact ? "Yes" : "No"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-1.5">
            <Paperclip className="h-4 w-4" />
            Attachments ({attachments.length})
          </TabsTrigger>
          <TabsTrigger value="technicians" className="gap-1.5">
            <Users className="h-4 w-4" />
            Technicians ({technicians.length})
          </TabsTrigger>
          <TabsTrigger value="time" className="gap-1.5">
            <Clock className="h-4 w-4" />
            Time Log ({timeEntries.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardContent className="space-y-6 p-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Description
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                  {ticket.description || "No description provided."}
                </p>
              </div>

              {ticket.rootCause && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Root Cause
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                    {ticket.rootCause}
                  </p>
                </div>
              )}

              {ticket.resolution && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Resolution
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                    {ticket.resolution}
                  </p>
                </div>
              )}

              {ticket.resolvedComments && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Resolved Comments
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                    {ticket.resolvedComments}
                  </p>
                </div>
              )}

              {/* Show resolve button if ticket is not resolved or closed */}
              {ticket.ticketStatus !== TICKET_STATUS.RESOLVED &&
                ticket.ticketStatus !== TICKET_STATUS.CLOSED && (
                  <div className="pt-2">
                    <Button onClick={() => setResolveOpen(true)}>
                      <CheckCircle className="h-4 w-4" />
                      Resolve Ticket
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <Card>
            <CardContent className="space-y-6 p-6">
              {/* Comments list */}
              {comments.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No comments yet
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="rounded-[10px] border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {comment.userId?.image ? (
                            <img
                              src={comment.userId.image}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                              {(
                                comment.userId?.firstName?.[0] ||
                                comment.userId?.name?.[0] ||
                                "?"
                              ).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {comment.userId?.firstName
                                ? `${comment.userId.firstName} ${comment.userId.lastName || ""}`
                                : comment.userId?.name || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            comment.visibility === 2
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {comment.visibility === 2
                            ? "Client Visible"
                            : "Internal"}
                        </Badge>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment form */}
              <form
                onSubmit={handleCommentSubmit}
                className="space-y-4 border-t border-gray-200 pt-6"
              >
                <h3 className="text-sm font-medium text-gray-900">
                  Add Comment
                </h3>
                <Textarea
                  placeholder="Write a comment..."
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <Select
                    value={commentVisibility}
                    onValueChange={setCommentVisibility}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Internal</SelectItem>
                      <SelectItem value="2">Client Visible</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                  >
                    {submittingComment && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Add Comment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments">
          <Card>
            <CardContent className="space-y-4 p-6">
              {attachments.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No attachments yet
                </p>
              ) : (
                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment._id}
                      className="flex items-center justify-between rounded-[10px] border border-gray-200 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-gray-100">
                          <Paperclip className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.fileSize)} &middot;{" "}
                            {formatDate(attachment.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteAttachment(attachment._id)
                        }
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload placeholder */}
              <div className="rounded-[10px] border-2 border-dashed border-gray-300 p-8 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  File upload functionality
                </p>
                <p className="text-xs text-gray-400">
                  Drag and drop files here or click to browse
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  Assigned Technicians
                </h3>
                <Button size="sm" onClick={openTechDialog}>
                  <Plus className="h-4 w-4" />
                  Add Technician
                </Button>
              </div>

              {technicians.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No technicians assigned
                </p>
              ) : (
                <div className="space-y-3">
                  {technicians.map((tech) => (
                    <div
                      key={tech._id}
                      className="flex items-center justify-between rounded-[10px] border border-gray-200 p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tech.technicianId?.companyName || "Unknown"}
                        </p>
                        {tech.technicianId?.email && (
                          <p className="text-xs text-gray-500">
                            {tech.technicianId.email}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={
                          tech.onSite
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {tech.onSite ? "On-site" : "Remote"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Log Tab */}
        <TabsContent value="time">
          <Card>
            <CardContent className="space-y-6 p-6">
              {/* Time entries table */}
              {timeEntries.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No time entries yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Minutes</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(entry.date)}
                        </TableCell>
                        <TableCell>{entry.hours}</TableCell>
                        <TableCell>{entry.minutes}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {entry.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gray-100 text-gray-800">
                            {entry.entryType || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entry.userId?.firstName
                            ? `${entry.userId.firstName} ${entry.userId.lastName || ""}`
                            : entry.userId?.name || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Add time entry form */}
              <form
                onSubmit={handleTimeSubmit}
                className="space-y-4 border-t border-gray-200 pt-6"
              >
                <h3 className="text-sm font-medium text-gray-900">
                  Add Time Entry
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="time-hours">Hours</Label>
                    <Input
                      id="time-hours"
                      type="number"
                      min="0"
                      value={timeForm.hours}
                      onChange={(e) =>
                        setTimeForm({ ...timeForm, hours: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time-minutes">Minutes</Label>
                    <Input
                      id="time-minutes"
                      type="number"
                      min="0"
                      max="59"
                      value={timeForm.minutes}
                      onChange={(e) =>
                        setTimeForm({ ...timeForm, minutes: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time-date">Date</Label>
                    <Input
                      id="time-date"
                      type="date"
                      value={timeForm.date}
                      onChange={(e) =>
                        setTimeForm({ ...timeForm, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time-type">Type</Label>
                    <Select
                      value={timeForm.entryType}
                      onValueChange={(val) =>
                        setTimeForm({ ...timeForm, entryType: val })
                      }
                    >
                      <SelectTrigger id="time-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="on-site">On-site</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time-desc">Description</Label>
                  <Textarea
                    id="time-desc"
                    placeholder="What was done..."
                    rows={2}
                    value={timeForm.description}
                    onChange={(e) =>
                      setTimeForm({ ...timeForm, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={submittingTime}>
                    {submittingTime && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Add Entry
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
            <DialogDescription>
              Provide resolution details for this ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolve-comments">Resolved Comments</Label>
              <Textarea
                id="resolve-comments"
                rows={3}
                value={resolveData.resolvedComments}
                onChange={(e) =>
                  setResolveData({
                    ...resolveData,
                    resolvedComments: e.target.value,
                  })
                }
                placeholder="Comments about the resolution..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="root-cause">Root Cause</Label>
              <Textarea
                id="root-cause"
                rows={3}
                value={resolveData.rootCause}
                onChange={(e) =>
                  setResolveData({
                    ...resolveData,
                    rootCause: e.target.value,
                  })
                }
                placeholder="What was the root cause..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Textarea
                id="resolution"
                rows={3}
                value={resolveData.resolution}
                onChange={(e) =>
                  setResolveData({
                    ...resolveData,
                    resolution: e.target.value,
                  })
                }
                placeholder="How was the issue resolved..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={submittingResolve}>
              {submittingResolve && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Technician Dialog */}
      <Dialog open={techDialogOpen} onOpenChange={setTechDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Technician</DialogTitle>
            <DialogDescription>
              Select a technician to assign to this ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Technician</Label>
              <Select
                value={selectedTechId}
                onValueChange={setSelectedTechId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {techOptions.map((tech) => (
                    <SelectItem key={tech._id} value={tech._id}>
                      {tech.companyName}
                      {tech.email ? ` (${tech.email})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTechDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTechnician}
              disabled={submittingTech || !selectedTechId}
            >
              {submittingTech && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
