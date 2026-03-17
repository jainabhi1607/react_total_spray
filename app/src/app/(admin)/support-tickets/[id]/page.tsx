"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Clock,
  Loader2,
  Plus,
  X,
  ChevronDown,
  Play,
  Square,
  Archive,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
} from "lucide-react";
import { TrashIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatDate,
  formatDateTime,
  TICKET_STATUS,
  TICKET_STATUS_LABELS,
  formatCommentDate,
} from "@/lib/utils";
import { TicketHistorySection } from "@/components/ticket-history-section";

// ─── Types ──────────────────────────────────────────────────────────────

interface PopulatedClient {
  _id: string;
  companyName: string;
  address?: string;
}

interface PopulatedSite {
  _id: string;
  siteName: string;
  address?: string;
  clientId?: string;
}

interface PopulatedAsset {
  _id: string;
  machineName: string;
  serialNo?: string;
  clientSiteId?: string;
}

interface PopulatedContact {
  _id: string;
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
  position?: string;
}

interface PopulatedTitle {
  _id: string;
  name: string;
}

interface PopulatedUser {
  _id: string;
  name?: string;
  lastName?: string;
  email?: string;
}

interface TicketData {
  _id: string;
  ticketNo: number;
  ticketStatus: number;
  warranty?: number;
  parts?: number;
  productionImpact?: number;
  timeIssueHours?: number;
  timeIssueMinutes?: number;
  timeIssueAmpm?: number;
  onSiteTechnicianRequired?: number;
  clientId: PopulatedClient | null;
  clientSiteId: PopulatedSite | null;
  clientAssetId: PopulatedAsset | null;
  clientContactId: PopulatedContact | null;
  titleId: PopulatedTitle | null;
  userId: PopulatedUser | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetail {
  _id: string;
  description?: string;
  supportingEvidence1?: string;
  supportingEvidence2?: string;
  supportingEvidence3?: string;
  supportingEvidenceName1?: string;
  supportingEvidenceName2?: string;
  supportingEvidenceName3?: string;
  resolvedComments?: string;
  rootCause?: string;
  rootCauseUserId?: PopulatedUser | null;
  rootCauseDateTime?: string;
  resolution?: string;
  resolutionUserId?: PopulatedUser | null;
  resolutionDateTime?: string;
}

interface Comment {
  _id: string;
  comments?: string;
  commentType?: number;
  visibility?: number;
  createdAt: string;
  userId: PopulatedUser | null;
}

interface Attachment {
  _id: string;
  documentName?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  visibility?: number;
  createdAt: string;
}

interface TimeEntry {
  _id: string;
  timeHours?: number;
  timeMinutes?: number;
  timeDate?: string;
  description?: string;
  timeType?: number;
  userId?: PopulatedUser | null;
  createdAt: string;
}

interface Technician {
  _id: string;
  technicianId: {
    _id: string;
    companyName?: string;
    email?: string;
    phone?: string;
  } | null;
  onSite?: boolean;
}

// Edit dialog types
interface ClientOption {
  _id: string;
  companyName: string;
}

interface SiteOption {
  _id: string;
  siteName: string;
}

interface AssetOption {
  _id: string;
  machineName: string;
  serialNo?: string;
  clientSiteId?: string;
}

interface ContactOption {
  _id: string;
  name: string;
  lastName?: string;
  email?: string;
  clientSiteId?: string;
}

// ─── Status Progress Steps ──────────────────────────────────────────────

const STATUS_STEPS = [
  { status: TICKET_STATUS.OPEN, label: "Open" },
  { status: TICKET_STATUS.IN_PROGRESS, label: "Working" },
  { status: TICKET_STATUS.ON_HOLD, label: "On-site Technician" },
  { status: TICKET_STATUS.RESOLVED, label: "Resolved" },
];

// Active step colors (by step index)
const STEP_ACTIVE_COLORS = ["#00aeef", "#f9d444", "#f07c00", "#68d057"];
// Non-active steps get numbered 1,2,3 in position order (skipping active)
const STEP_INACTIVE_GRAYS = ["#C7D2D7", "#B3BFC4", "#99AAAF"];

function getStepIndex(ticketStatus: number): number {
  const idx = STATUS_STEPS.findIndex((s) => s.status === ticketStatus);
  return idx >= 0 ? idx : 0;
}

function getStepColor(stepIdx: number, activeIdx: number): string {
  if (stepIdx === activeIdx) return STEP_ACTIVE_COLORS[activeIdx];
  let rank = 0;
  for (let i = 0; i < 4; i++) {
    if (i === activeIdx) continue;
    if (i === stepIdx) return STEP_INACTIVE_GRAYS[rank];
    rank++;
  }
  return STEP_INACTIVE_GRAYS[2];
}

// ─── Page Component ─────────────────────────────────────────────────────

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  // Main data
  const [ticket, setTicket] = useState<TicketData | null>(null);

  useEffect(() => {
    document.title = ticket
      ? `ST - ${ticket.ticketNo}`
      : "TSC - Support Tickets";
  }, [ticket]);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [owners, setOwners] = useState<{ _id: string; userId: { _id: string; name: string; lastName?: string; email: string } }[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  // Ticket history (handled by TicketHistorySection component)

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment form
  const [commentText, setCommentText] = useState("");
  const [commentPublic, setCommentPublic] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit comment
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Edit ticket dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Edit contact dialog
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    clientSiteId: "",
    name: "",
    lastName: "",
    position: "",
    email: "",
    phone: "",
  });
  const [contactSites, setContactSites] = useState<{ _id: string; siteName: string }[]>([]);
  const [savingContact, setSavingContact] = useState(false);

  // Edit description dialog
  const [editDescOpen, setEditDescOpen] = useState(false);
  const [descText, setDescText] = useState("");
  const [savingDesc, setSavingDesc] = useState(false);

  // Edit root cause / resolution dialog
  const [editRootCauseOpen, setEditRootCauseOpen] = useState(false);
  const [rootCauseText, setRootCauseText] = useState("");
  const [resolutionText, setResolutionText] = useState("");
  const [onSiteTechChecked, setOnSiteTechChecked] = useState(false);
  const [savingRootCause, setSavingRootCause] = useState(false);

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit filename dialog
  const [editFilenameAttId, setEditFilenameAttId] = useState<string | null>(null);
  const [editFilenameName, setEditFilenameName] = useState("");
  const [savingFilename, setSavingFilename] = useState(false);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Add time dialog
  const [addTimeOpen, setAddTimeOpen] = useState(false);
  const [viewTimeOpen, setViewTimeOpen] = useState(false);
  const [timeForm, setTimeForm] = useState({ hours: "00", minutes: "00", date: new Date().toISOString().slice(0, 10), description: "" });
  const [submittingTime, setSubmittingTime] = useState(false);
  const [savingTimer, setSavingTimer] = useState(false);

  // Status change
  const [changingStatus, setChangingStatus] = useState(false);

  // Claim ticket dialog
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimUsers, setClaimUsers] = useState<{ _id: string; name: string; lastName?: string }[]>([]);
  const [claimSelectedIds, setClaimSelectedIds] = useState<Set<string>>(new Set());
  const [claimCurrentUser, setClaimCurrentUser] = useState<{ id: string; name: string; lastName?: string } | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  // Resolve ticket dialog
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveComment, setResolveComment] = useState("");
  const [resolveSendNotification, setResolveSendNotification] = useState(false);
  const [submittingResolve, setSubmittingResolve] = useState(false);
  const [resolveGeneralContacts, setResolveGeneralContacts] = useState<{ _id: string; name: string; lastName?: string }[]>([]);
  const [resolveSiteContacts, setResolveSiteContacts] = useState<{ _id: string; name: string; lastName?: string }[]>([]);
  const [resolveSelectedContactIds, setResolveSelectedContactIds] = useState<Set<string>>(new Set());
  const [resolveContactsLoading, setResolveContactsLoading] = useState(false);

  // Add Job Card dialog
  const [addJobCardOpen, setAddJobCardOpen] = useState(false);
  const [addJobCardSaving, setAddJobCardSaving] = useState(false);
  const [linkedJobCards, setLinkedJobCards] = useState<{ _id: string; ticketNo: number; jobCardStatus: number; createdAt: string }[]>([]);

  // ─── Fetch ────────────────────────────────────────────────────────────

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error("Failed to load ticket");
      }

      const d = json.data;
      // The API spreads ticket fields + detail/comments/attachments etc
      setTicket({
        _id: d._id,
        ticketNo: d.ticketNo,
        ticketStatus: d.ticketStatus,
        warranty: d.warranty,
        parts: d.parts,
        productionImpact: d.productionImpact,
        timeIssueHours: d.timeIssueHours,
        timeIssueMinutes: d.timeIssueMinutes,
        timeIssueAmpm: d.timeIssueAmpm,
        onSiteTechnicianRequired: d.onSiteTechnicianRequired,
        clientId: d.clientId,
        clientSiteId: d.clientSiteId,
        clientAssetId: d.clientAssetId,
        clientContactId: d.clientContactId,
        titleId: d.titleId,
        userId: d.userId,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      });
      setDetail(d.detail || null);
      setComments(d.comments || []);
      setAttachments(d.attachments || []);
      setTechnicians(d.technicians || []);
      setOwners(d.owners || []);
      setTimeEntries(d.timeLogs || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // ─── Fetch linked job cards ──────────────────────────────────────────
  const fetchLinkedJobCards = useCallback(async () => {
    try {
      const res = await fetch(`/api/job-cards?supportTicketId=${ticketId}&limit=100`);
      const json = await res.json();
      if (json.success) {
        const raw = json.data;
        setLinkedJobCards(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
      }
    } catch {
      setLinkedJobCards([]);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchLinkedJobCards();
  }, [fetchLinkedJobCards]);

  // ─── Add Job Card from support ticket ──────────────────────────────
  async function handleAddJobCard() {
    if (!ticket) return;
    setAddJobCardSaving(true);
    try {
      // Create job card with ticket details
      const res = await fetch("/api/job-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: ticket.clientId?._id,
          clientSiteId: ticket.clientSiteId?._id,
          clientContactId: ticket.clientContactId?._id,
          titleId: ticket.titleId?._id,
          description: detail?.description || "",
          warranty: 0,
          supportTicketId: ticket._id,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        // Mark ticket as On-Site Technician (status 3)
        await fetch(`/api/support-tickets/${ticketId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onSiteTechnicianRequired: 1,
            ticketStatus: 3,
          }),
        });
        setAddJobCardOpen(false);
        fetchTicket();
        fetchLinkedJobCards();
      } else {
        alert(json.error || "Failed to create job card");
      }
    } catch {
      alert("Failed to create job card");
    } finally {
      setAddJobCardSaving(false);
    }
  }

  // ─── Ticket History (handled by TicketHistorySection component) ──────

  // ─── Timer ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  // Warn user if timer is running and they try to leave the page
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (timerRunning || timerSeconds > 0) {
        e.preventDefault();
        return "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [timerRunning, timerSeconds]);

  function toggleTimer() {
    if (timerRunning) {
      // Pause
      setTimerRunning(false);
    } else if (timerSeconds > 0) {
      // Resume
      setTimerRunning(true);
    } else {
      // Start fresh
      setTimerSeconds(0);
      setTimerRunning(true);
    }
  }

  async function saveTimerEntry() {
    if (timerSeconds === 0) return;
    setTimerRunning(false);
    setSavingTimer(true);

    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const secs = timerSeconds % 60;
    // Round up if there are remaining seconds
    const finalMinutes = secs > 0 ? minutes + 1 : minutes;

    try {
      await fetch(`/api/support-tickets/${ticketId}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeHours: hours, timeMinutes: finalMinutes, description: "Timer entry" }),
      });
      setTimerSeconds(0);
      fetchTicket();
    } catch {
      alert("Failed to save time");
    } finally {
      setSavingTimer(false);
    }
  }

  const timerDisplay = `${String(Math.floor(timerSeconds / 3600)).padStart(2, "0")}:${String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;

  // ─── Total time calculation ───────────────────────────────────────────

  const totalHours = timeEntries.reduce((sum, e) => sum + (e.timeHours || 0), 0);
  const totalMinutes = timeEntries.reduce((sum, e) => sum + (e.timeMinutes || 0), 0);
  const displayHours = totalHours + Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;

  // ─── Status change ────────────────────────────────────────────────────

  // Non-clickable statuses (auto-set by conditions)
  const NON_CLICKABLE_STATUSES: number[] = [TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.ON_HOLD];

  function handleStatusClick(newStatus: number) {
    if (!ticket || ticket.ticketStatus === newStatus) return;
    if (NON_CLICKABLE_STATUSES.includes(newStatus)) return;

    if (newStatus === TICKET_STATUS.RESOLVED) {
      setResolveComment("");
      setResolveSendNotification(false);
      setResolveGeneralContacts([]);
      setResolveSiteContacts([]);
      setResolveSelectedContactIds(new Set());
      setResolveDialogOpen(true);
      return;
    }

    // For other statuses (e.g. Open), update directly
    updateTicketStatus(newStatus);
  }

  async function updateTicketStatus(newStatus: number) {
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketStatus: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setTicket((prev) => (prev ? { ...prev, ticketStatus: newStatus } : prev));
    } catch {
      alert("Failed to update status");
    } finally {
      setChangingStatus(false);
    }
  }

  async function fetchResolveContacts() {
    if (!ticket?.clientId?._id) return;
    setResolveContactsLoading(true);
    try {
      const res = await fetch(`/api/clients/${ticket.clientId._id}/contacts`);
      const json = await res.json();
      if (res.ok && json.success) {
        const contacts = json.data?.data || json.data || [];
        const siteId = ticket.clientSiteId?._id;
        // General: no clientSiteId
        setResolveGeneralContacts(contacts.filter((c: any) => !c.clientSiteId));
        // Site: matching ticket's site
        setResolveSiteContacts(siteId ? contacts.filter((c: any) => c.clientSiteId === siteId) : []);
      }
    } catch {
      // silent
    } finally {
      setResolveContactsLoading(false);
    }
  }

  function handleResolveSendNotificationToggle(checked: boolean) {
    setResolveSendNotification(checked);
    if (checked && resolveGeneralContacts.length === 0 && resolveSiteContacts.length === 0) {
      fetchResolveContacts();
    }
    if (!checked) {
      setResolveSelectedContactIds(new Set());
    }
  }

  function toggleResolveContact(contactId: string) {
    setResolveSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  }

  async function handleResolveSubmit() {
    if (!resolveComment.trim()) return;
    setSubmittingResolve(true);
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: resolveComment.trim(),
          notifyContactIds: resolveSendNotification ? Array.from(resolveSelectedContactIds) : [],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed to resolve");

      setTicket((prev) => (prev ? { ...prev, ticketStatus: TICKET_STATUS.RESOLVED } : prev));
      setResolveDialogOpen(false);
      fetchTicket();
    } catch {
      alert("Failed to resolve ticket");
    } finally {
      setSubmittingResolve(false);
    }
  }

  // ─── Claim ticket ──────────────────────────────────────────────────────

  async function openClaimDialog() {
    setClaimDialogOpen(true);
    setClaimLoading(true);
    try {
      // Fetch current session, admin users, and existing owners in parallel
      const [sessionRes, usersRes, ownersRes] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/users?role=1,2,3&limit=100&status=1"),
        fetch(`/api/support-tickets/${ticketId}/owners`),
      ]);
      const sessionJson = await sessionRes.json();
      const usersJson = await usersRes.json();
      const ownersJson = await ownersRes.json();

      const sessionUser = sessionJson?.user;
      const currentUserId = sessionUser?.id || "";
      const currentUserEmail = sessionUser?.email || "";

      // Find the current user in the full users list to get their _id
      const raw = usersJson.data?.data || usersJson.data || [];
      const users = Array.isArray(raw) ? raw : [];
      const meFromList = users.find((u: any) =>
        String(u._id) === String(currentUserId) || u.email === currentUserEmail
      );

      const currentUser = meFromList
        ? { id: meFromList._id, name: meFromList.name, lastName: meFromList.lastName }
        : sessionUser
          ? { id: currentUserId, name: sessionUser.name, lastName: sessionUser.lastName }
          : null;
      setClaimCurrentUser(currentUser);

      // Exclude the current user from "Others" list
      const meId = meFromList?._id;
      setClaimUsers(meId
        ? users.filter((u: any) => String(u._id) !== String(meId))
        : currentUserEmail
          ? users.filter((u: any) => u.email !== currentUserEmail)
          : users);

      // Pre-select existing owners
      const existingOwnerIds = (ownersJson.data || []).map((o: any) =>
        typeof o.userId === "object" ? o.userId._id : o.userId
      );
      setClaimSelectedIds(new Set(existingOwnerIds));
    } catch {
      // silent
    } finally {
      setClaimLoading(false);
    }
  }

  async function handleClaimSubmit() {
    const selectedIds = Array.from(claimSelectedIds);
    if (selectedIds.length === 0) return;
    setClaimSubmitting(true);
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/owners`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedIds }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setClaimDialogOpen(false);
      fetchTicket();
    } catch {
      alert("Failed to assign ticket");
    } finally {
      setClaimSubmitting(false);
    }
  }

  function toggleClaimUser(userId: string) {
    setClaimSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  // ─── Toggle fields (warranty, parts, productionImpact) ────────────────

  async function handleToggle(field: string, newVal: number) {
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newVal }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTicket((prev) => (prev ? { ...prev, [field]: newVal } : prev));
      }
    } catch {
      // silent
    }
  }

  // ─── Comment submission ───────────────────────────────────────────────

  async function handleCommentSubmit() {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comments: commentText.trim(),
          visibility: commentPublic ? 2 : 1,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setCommentText("");
      setCommentPublic(false);
      await fetchTicket();
    } catch {
      alert("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  // ─── Comment actions (edit, delete, toggle visibility) ─────────────────

  async function handleEditComment() {
    if (!editingCommentId || !editCommentText.trim()) return;
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/comments/${editingCommentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: editCommentText.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      // Optimistic update
      setComments((prev) =>
        prev.map((c) => (c._id === editingCommentId ? { ...c, comments: editCommentText.trim() } : c))
      );
      setEditingCommentId(null);
      setEditCommentText("");
    } catch {
      alert("Failed to edit comment");
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/comments/${commentId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      await fetchTicket();
    } catch {
      alert("Failed to delete comment");
    }
  }

  async function handleToggleCommentVisibility(commentId: string, currentVisibility: number | undefined) {
    const newVisibility = currentVisibility === 2 ? 1 : 2;
    // Optimistic update — no page reload
    setComments((prev) =>
      prev.map((c) => (c._id === commentId ? { ...c, visibility: newVisibility } : c))
    );
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        // Revert on failure
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, visibility: currentVisibility } : c))
        );
      }
    } catch {
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, visibility: currentVisibility } : c))
      );
    }
  }

  // ─── Edit Contact ──────────────────────────────────────────────────────

  async function openEditContact() {
    if (!ticket?.clientContactId || !ticket?.clientId) return;
    const c = ticket.clientContactId;
    setContactForm({
      clientSiteId: "",
      name: c.name || "",
      lastName: c.lastName || "",
      position: c.position || "",
      email: c.email || "",
      phone: c.phone || "",
    });
    // Fetch sites for dropdown
    try {
      const res = await fetch(`/api/clients/${ticket.clientId._id}/sites`);
      const json = await res.json();
      if (json.success) {
        const raw = json.data?.data || json.data || [];
        setContactSites(Array.isArray(raw) ? raw : []);
      }
    } catch {
      // silent
    }
    // Try to set current site from ticket
    if (ticket.clientSiteId?._id) {
      setContactForm((prev) => ({ ...prev, clientSiteId: ticket.clientSiteId?._id || "" }));
    }
    setEditContactOpen(true);
  }

  async function handleSaveContact() {
    if (!ticket?.clientId?._id || !ticket?.clientContactId?._id) return;
    setSavingContact(true);
    try {
      const res = await fetch(
        `/api/clients/${ticket.clientId._id}/contacts/${ticket.clientContactId._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: contactForm.name.trim(),
            lastName: contactForm.lastName.trim(),
            position: contactForm.position.trim(),
            email: contactForm.email.trim(),
            phone: contactForm.phone.trim(),
            clientSiteId: contactForm.clientSiteId || null,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setEditContactOpen(false);
      fetchTicket();
    } catch {
      alert("Failed to update contact");
    } finally {
      setSavingContact(false);
    }
  }

  // ─── Save description (symptoms) ─────────────────────────────────────

  async function handleSaveDesc() {
    setSavingDesc(true);
    try {
      // Update detail description
      const res = await fetch(`/api/support-tickets/${ticketId}/detail`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: descText }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setEditDescOpen(false);
      fetchTicket();
    } catch {
      alert("Failed to save description");
    } finally {
      setSavingDesc(false);
    }
  }

  // ─── Save root cause / resolution ────────────────────────────────────

  async function handleSaveRootCause() {
    setSavingRootCause(true);
    try {
      // Save root cause/resolution to detail
      const detailRes = await fetch(`/api/support-tickets/${ticketId}/detail`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootCause: rootCauseText, resolution: resolutionText }),
      });
      const detailJson = await detailRes.json();
      if (!detailRes.ok || !detailJson.success) throw new Error("Failed");

      // Save onSiteTechnicianRequired to ticket (and update status if checked)
      const ticketUpdate: Record<string, any> = {
        onSiteTechnicianRequired: onSiteTechChecked ? 1 : 0,
      };
      if (onSiteTechChecked) {
        ticketUpdate.ticketStatus = TICKET_STATUS.ON_HOLD; // On-site Technician
      }
      const ticketRes = await fetch(`/api/support-tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketUpdate),
      });
      const ticketJson = await ticketRes.json();
      if (!ticketRes.ok || !ticketJson.success) throw new Error("Failed to update ticket");

      setEditRootCauseOpen(false);
      await fetchTicket();
    } catch {
      alert("Failed to save");
    } finally {
      setSavingRootCause(false);
    }
  }

  // ─── Add time ─────────────────────────────────────────────────────────

  async function handleAddTime() {
    setSubmittingTime(true);
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeHours: Number(timeForm.hours) || 0,
          timeMinutes: Number(timeForm.minutes) || 0,
          timeDate: new Date().toISOString(),
          description: timeForm.description.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setAddTimeOpen(false);
      setTimeForm({ hours: "00", minutes: "00", date: new Date().toISOString().slice(0, 10), description: "" });
      fetchTicket();
    } catch {
      alert("Failed to add time");
    } finally {
      setSubmittingTime(false);
    }
  }

  // ─── Upload files ──────────────────────────────────────────────────────

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
    // Reset so same file can be selected again
    e.target.value = "";
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUploadFiles() {
    if (pendingFiles.length === 0) return;
    setUploading(true);

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      const key = `${file.name}-${i}`;
      setUploadProgress((prev) => ({ ...prev, [key]: 0 }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "ticket-attachments");

        // Upload with real progress tracking via XMLHttpRequest
        const uploadJson: any = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 80); // 0-80% for upload
              setUploadProgress((prev) => ({ ...prev, [key]: pct }));
            }
          });
          xhr.addEventListener("load", () => {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Invalid response"));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

        if (uploadJson.success) {
          setUploadProgress((prev) => ({ ...prev, [key]: 90 }));
          // Create attachment record
          await fetch(`/api/support-tickets/${ticketId}/attachments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentName: file.name,
              fileName: uploadJson.data.url,
              fileSize: file.size,
              visibility: 1,
            }),
          });
          setUploadProgress((prev) => ({ ...prev, [key]: 100 }));
        } else {
          setUploadProgress((prev) => ({ ...prev, [key]: -1 }));
        }
      } catch {
        // Mark as failed but continue
        setUploadProgress((prev) => ({ ...prev, [key]: -1 }));
      }
    }

    setUploading(false);
    // Wait briefly so user can see 100% bars, then close
    setTimeout(() => {
      setPendingFiles([]);
      setUploadProgress({});
      setUploadDialogOpen(false);
      fetchTicket();
    }, 800);
  }

  // ─── Attachment actions ──────────────────────────────────────────────

  async function handleToggleAttachmentVisibility(attId: string, currentVisibility: number | undefined) {
    const newVisibility = currentVisibility === 2 ? 1 : 2;
    // Optimistic update
    setAttachments((prev) =>
      prev.map((a) => (a._id === attId ? { ...a, visibility: newVisibility } : a))
    );
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/attachments/${attId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
    } catch {
      // Revert on failure
      setAttachments((prev) =>
        prev.map((a) => (a._id === attId ? { ...a, visibility: currentVisibility } : a))
      );
    }
  }

  async function handleMakeAllPublic() {
    // Optimistic update
    setAttachments((prev) => prev.map((a) => ({ ...a, visibility: 2 })));
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/attachments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: 2 }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
    } catch {
      await fetchTicket();
    }
  }

  async function handleDeleteAttachment(attId: string) {
    if (!confirm("Are you sure you want to delete this attachment?")) return;
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/attachments/${attId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setAttachments((prev) => prev.filter((a) => a._id !== attId));
    } catch {
      alert("Failed to delete attachment");
    }
  }

  async function handleSaveFilename() {
    if (!editFilenameAttId || !editFilenameName.trim()) return;
    setSavingFilename(true);
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}/attachments/${editFilenameAttId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentName: editFilenameName.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setAttachments((prev) =>
        prev.map((a) => (a._id === editFilenameAttId ? { ...a, documentName: editFilenameName.trim() } : a))
      );
      setEditFilenameAttId(null);
      setEditFilenameName("");
    } catch {
      alert("Failed to update filename");
    } finally {
      setSavingFilename(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────

  if (loading) return <PageLoading />;

  if (error || !ticket) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Unable to load ticket</p>
          <p className="mt-1 text-sm text-gray-500">{error || "Ticket not found"}</p>
          <Link href="/support-tickets">
            <Button className="mt-4" variant="outline">Back to Tickets</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(ticket.ticketStatus);
  const contactName = ticket.clientContactId
    ? `${ticket.clientContactId.name}${ticket.clientContactId.lastName ? ` ${ticket.clientContactId.lastName}` : ""}`
    : "-";

  // Time issue display
  const timeIssue = ticket.timeIssueHours != null || ticket.timeIssueMinutes != null
    ? `${ticket.timeIssueHours || 0}:${String(ticket.timeIssueMinutes || 0).padStart(2, "0")} ${ticket.timeIssueAmpm === 1 ? "PM" : "AM"}`
    : "-";

  // Attachment evidence from detail
  const evidenceFiles = [
    detail?.supportingEvidence1 ? { url: detail.supportingEvidence1, name: detail.supportingEvidenceName1 || "Evidence 1" } : null,
    detail?.supportingEvidence2 ? { url: detail.supportingEvidence2, name: detail.supportingEvidenceName2 || "Evidence 2" } : null,
    detail?.supportingEvidence3 ? { url: detail.supportingEvidence3, name: detail.supportingEvidenceName3 || "Evidence 3" } : null,
  ].filter(Boolean) as { url: string; name: string }[];

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/support-tickets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Support Ticket #{ticket.ticketNo}
            </h1>
            <p className="text-sm text-gray-500">
              Created: {formatDateTime(ticket.createdAt)}
              <span className="ml-4">
                {owners.length > 0 ? (
                  <>
                    Claimed by:{" "}
                    {owners.map((o, i) => (
                      <span key={o._id}>
                        {i > 0 && ", "}
                        {o.userId?.name || "Unknown"}{o.userId?.lastName ? ` ${o.userId.lastName}` : ""}
                      </span>
                    ))}
                    {"  "}
                    <button onClick={openClaimDialog} className="text-cyan-500 underline cursor-pointer">Edit</button>
                  </>
                ) : (
                  <button onClick={openClaimDialog} className="text-cyan-500 underline cursor-pointer">Claim Ticket</button>
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={async () => {
              if (!confirm("Are you sure you want to archive this ticket?")) return;
              try {
                const res = await fetch(`/api/support-tickets/${ticketId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: 2 }),
                });
                const json = await res.json();
                if (json.success) {
                  router.push("/support-tickets");
                }
              } catch {
                // silent
              }
            }}
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
          <Link href={`/support-tickets/${ticketId}/log`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              Ticket Log
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Status Progress Bar ─────────────────────────────────── */}
      <div className="flex w-full" style={{ listStyle: "none" }}>
        {STATUS_STEPS.map((step, idx) => {
          const stepColor = getStepColor(idx, currentStepIdx);
          const nextColor = idx < 3 ? getStepColor(idx + 1, currentStepIdx) : undefined;
          const isFirst = idx === 0;
          const isLast = idx === STATUS_STEPS.length - 1;

          const isClickable = !NON_CLICKABLE_STATUSES.includes(step.status) && step.status !== ticket.ticketStatus;

          return (
            <div
              key={step.status}
              className={`relative ${isClickable ? "cursor-pointer" : "cursor-default"}`}
              style={{ width: "25%", float: "left" }}
              onClick={() => isClickable && !changingStatus && handleStatusClick(step.status)}
            >
              <span
                className="block text-center text-white text-sm font-medium"
                style={{
                  backgroundColor: stepColor,
                  padding: "13px",
                  borderRadius: isFirst ? "5px 0 0 5px" : isLast ? "0 5px 5px 0" : undefined,
                }}
              >
                {step.label}
              </span>
              {!isLast && nextColor && (
                <span
                  className="block"
                  style={{
                    borderTop: `23px solid ${nextColor}`,
                    borderBottom: `23px solid ${nextColor}`,
                    borderLeft: `15px solid ${stepColor}`,
                    float: "right",
                    marginTop: "-46px",
                    position: "relative",
                    zIndex: 1,
                  }}
                />
              )}
            </div>
          );
        })}
        <div style={{ clear: "both" }} />
      </div>

      {/* ─── Two Column Layout ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ─── LEFT COLUMN ─────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Client Info Card */}
          <Card>
            <CardContent className="p-10 space-y-5">
              {/* Client name + Edit Ticket */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{ticket.clientId?.companyName || "-"}</h2>
                  {ticket.clientSiteId && (
                    <p className="text-sm text-gray-600 mt-1">
                      {ticket.clientSiteId.siteName}
                      {ticket.clientSiteId.address && ` - ${ticket.clientSiteId.address}`}
                    </p>
                  )}
                  {ticket.clientContactId && (
                    <div className="mt-2 space-y-0.5">
                      <p className="text-sm text-gray-700">{contactName}</p>
                      {ticket.clientContactId.phone && (
                        <p className="text-sm text-gray-700">{ticket.clientContactId.phone}</p>
                      )}
                      {ticket.clientContactId.email && (
                        <p className="text-sm text-gray-700">{ticket.clientContactId.email}</p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={openEditContact}
                    className="text-sm text-cyan-500 underline cursor-pointer mt-1"
                  >
                    Edit Contact
                  </button>
                </div>
                <button
                  onClick={() => setEditDialogOpen(true)}
                  className="text-sm text-cyan-500 underline cursor-pointer shrink-0"
                >
                  Edit Ticket
                </button>
              </div>

              <hr style={{ borderTop: "1px solid #D4E3EB" }} />

              {/* Sites row */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Sites</p>
                {ticket.clientSiteId ? (
                  <Link
                    href={`/clients/${ticket.clientId?._id}?siteId=${ticket.clientSiteId._id}`}
                    className="text-sm font-medium text-black underline"
                  >
                    {ticket.clientSiteId.siteName}
                  </Link>
                ) : (
                  <p className="text-sm text-gray-700">-</p>
                )}
              </div>

              <hr style={{ borderTop: "1px solid #D4E3EB" }} />

              {/* Asset row */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Asset</p>
                {ticket.clientAssetId ? (
                  <Link
                    href={`/assets/${ticket.clientAssetId._id}`}
                    className="text-sm font-medium text-black underline"
                  >
                    {ticket.clientAssetId.machineName}
                    {ticket.clientAssetId.serialNo && ` - ${ticket.clientAssetId.serialNo}`}
                  </Link>
                ) : (
                  <p className="text-sm text-gray-700">-</p>
                )}
              </div>

              <hr style={{ borderTop: "1px solid #D4E3EB" }} />

              {/* Warranty row */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Warranty</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle("warranty", ticket.warranty === 1 ? 0 : 1)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${ticket.warranty === 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}
                  >
                    Warranty
                  </button>
                  <button
                    onClick={() => handleToggle("warranty", ticket.warranty === 2 ? 0 : 2)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${ticket.warranty === 2 ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-400"}`}
                  >
                    Out of Warranty
                  </button>
                  <button
                    onClick={() => handleToggle("warranty", ticket.warranty === 3 ? 0 : 3)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${ticket.warranty === 3 ? "bg-cyan-500 text-white" : "bg-gray-200 text-gray-400"}`}
                  >
                    FOC
                  </button>
                </div>
              </div>

              <hr style={{ borderTop: "1px solid #D4E3EB" }} />

              {/* Parts row */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Parts</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle("parts", ticket.parts === 1 ? 0 : 1)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${ticket.parts === 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}
                  >
                    Parts Required
                  </button>
                  <button
                    onClick={() => handleToggle("parts", ticket.parts === 2 ? 0 : 2)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${ticket.parts === 2 ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-400"}`}
                  >
                    No Parts
                  </button>
                </div>
              </div>

              <hr style={{ borderTop: "1px solid #D4E3EB" }} />

              {/* Production Impact row */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Production Impact</p>
                <p className="text-sm font-medium text-gray-900">
                  {ticket.productionImpact === 1 ? "High impact / High urgency" : ticket.productionImpact === 2 ? "Low impact / Low urgency" : "-"}
                </p>
              </div>

              <hr style={{ borderTop: "1px solid #D4E3EB" }} />

              {/* Time Issue Occurred row */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Time issue occured</p>
                <p className="text-sm font-medium text-gray-900">{timeIssue}</p>
              </div>

              <hr style={{ borderTop: "1px solid #D4E3EB" }} />

              {/* Title */}
              <div>
                <p className="text-base font-bold text-gray-900 mb-2">Title</p>
                <div className="relative">
                  <select
                    value={ticket.titleId?._id || ""}
                    onChange={async (e) => {
                      try {
                        await fetch(`/api/support-tickets/${ticketId}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ titleId: e.target.value || null }),
                        });
                        fetchTicket();
                      } catch { /* silent */ }
                    }}
                    className="w-full rounded-[10px] border border-gray-200 px-3 py-2.5 text-sm text-gray-700 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select</option>
                    {ticket.titleId && (
                      <option value={ticket.titleId._id}>{ticket.titleId.name}</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Symptoms */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-bold text-gray-900">Symptoms</p>
                  <button
                    onClick={() => {
                      setDescText(detail?.description || "");
                      setEditDescOpen(true);
                    }}
                    className="p-1 text-gray-400 cursor-pointer hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <div className="rounded-[10px] bg-gray-50 p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {detail?.description || "No symptoms recorded."}
                  </p>
                </div>
              </div>

              <hr style={{ borderTop: "1px solid #D4E3EB" }} />

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-base font-bold text-gray-900">Attachments</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleMakeAllPublic}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-cyan-600 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      Make All Images Public
                    </button>
                    <button
                      onClick={() => { setPendingFiles([]); setUploadProgress({}); setUploadDialogOpen(true); }}
                      className="p-1.5 text-gray-500 cursor-pointer hover:text-gray-700"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {(() => {
                  const imageAttachments = attachments.filter((att) => {
                    const url = att.fileName || att.fileUrl || "";
                    return /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(url);
                  });
                  const docAttachments = attachments.filter((att) => {
                    const url = att.fileName || att.fileUrl || "";
                    return !/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(url);
                  });

                  if (evidenceFiles.length === 0 && attachments.length === 0) {
                    return <p className="text-sm text-gray-400">No attachments</p>;
                  }

                  return (
                    <div className="space-y-4">
                      {/* Document rows */}
                      {docAttachments.length > 0 && (
                        <div className="space-y-3">
                          {docAttachments.map((att) => {
                            const url = att.fileName || att.fileUrl || "";
                            const isPublic = att.visibility === 2;
                            return (
                              <div key={att._id} className="flex items-center justify-between py-1">
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-cyan-600 truncate min-w-0">
                                  {att.documentName || att.fileName || "Document"}
                                </a>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                  {/* Visibility toggle */}
                                  <button
                                    onClick={() => handleToggleAttachmentVisibility(att._id, att.visibility)}
                                    className="cursor-pointer hover:opacity-80"
                                    title={isPublic ? "Make Private" : "Make Public"}
                                  >
                                    {isPublic ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#83CE67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#465868" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    )}
                                  </button>
                                  {/* Open in new tab */}
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700" title="Open in new tab">
                                    <ExternalLink className="h-5 w-5" />
                                  </a>
                                  {/* Edit/Rename */}
                                  <button
                                    onClick={() => {
                                      setEditFilenameAttId(att._id);
                                      setEditFilenameName(att.documentName || att.fileName || "");
                                    }}
                                    className="text-gray-500 hover:text-gray-700 cursor-pointer"
                                    title="Edit filename"
                                  >
                                    <Pencil className="h-5 w-5" />
                                  </button>
                                  {/* Delete */}
                                  <button onClick={() => handleDeleteAttachment(att._id)} className="text-gray-500 hover:text-red-500 cursor-pointer" title="Delete">
                                    <TrashIcon />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Image grid */}
                      {(evidenceFiles.length > 0 || imageAttachments.length > 0) && (
                        <div className="flex flex-wrap gap-4">
                          {evidenceFiles.map((ev, i) => {
                            const isImg = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(ev.url);
                            return (
                              <div key={`ev-${i}`} className="w-[140px] rounded-[10px] border border-gray-200 overflow-hidden">
                                <div className="h-[120px] bg-gray-50">
                                  {isImg ? (
                                    <a href={ev.url} target="_blank" rel="noopener noreferrer">
                                      <img src={ev.url} alt={ev.name} className="h-full w-full object-cover" />
                                    </a>
                                  ) : (
                                    <div className="flex items-center justify-center h-full">
                                      <ImageIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {imageAttachments.map((att) => {
                            const url = att.fileName || att.fileUrl || "";
                            const isPublic = att.visibility === 2;
                            return (
                              <div key={att._id} className="w-[140px] rounded-[10px] border border-gray-200 overflow-hidden">
                                {/* Icons row on top */}
                                <div className="flex items-center gap-2 px-3 py-2 bg-white">
                                  <button
                                    onClick={() => handleToggleAttachmentVisibility(att._id, att.visibility)}
                                    className="cursor-pointer hover:opacity-80"
                                    title={isPublic ? "Make Private" : "Make Public"}
                                  >
                                    {isPublic ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#83CE67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#465868" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    )}
                                  </button>
                                  <a href={url} download className="text-gray-500 hover:text-gray-700" title="Download">
                                    <Download className="h-4 w-4" />
                                  </a>
                                  <button onClick={() => handleDeleteAttachment(att._id)} className="text-gray-500 hover:text-red-500 cursor-pointer" title="Delete">
                                    <TrashIcon />
                                  </button>
                                </div>
                                {/* Image */}
                                <a href={url} target="_blank" rel="noopener noreferrer" className="block h-[120px] bg-gray-50">
                                  <img src={url} alt={att.documentName || ""} className="h-full w-full object-cover" />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Ticket History */}
          <TicketHistorySection
            currentId={ticketId}
            assetId={ticket.clientAssetId?._id}
            siteId={ticket.clientSiteId?._id}
            apiListUrl="/api/support-tickets"
            detailPathPrefix="/support-tickets"
            statusLabels={TICKET_STATUS_LABELS}
          />
        </div>

        {/* ─── RIGHT COLUMN (1/3) ────────────────────────────────── */}
        <div className="space-y-6">
          {/* Total Time Card */}
          <Card>
            <CardContent className="p-10">
              <div className="flex items-start justify-between mb-3">
                <p className="text-base font-semibold text-gray-900">Total Time</p>
                {/* Timer controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTimer}
                    className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5 fill-gray-700 text-gray-700" />
                    {timerRunning || timerSeconds > 0 ? timerDisplay : "Start Timer"}
                  </button>
                  <button
                    onClick={saveTimerEntry}
                    disabled={timerSeconds === 0 || savingTimer}
                    className={`flex h-[34px] w-[34px] items-center justify-center rounded-[10px] cursor-pointer transition-colors ${
                      timerSeconds > 0
                        ? "bg-gray-700 text-white hover:bg-gray-800"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    title="Save timer"
                  >
                    {savingTimer ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Square className="h-3.5 w-3.5 fill-current" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setTimeForm({ hours: "00", minutes: "00", date: new Date().toISOString().slice(0, 10), description: "" });
                      setAddTimeOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-[10px] border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Time
                  </button>
                </div>
              </div>

              {/* Total display - green */}
              <p className="text-2xl font-bold text-green-500 mb-1">
                {displayHours}hrs {displayMinutes}mins
              </p>

              <button
                onClick={() => setViewTimeOpen(true)}
                className="text-sm text-cyan-500 underline cursor-pointer"
              >
                View Time
              </button>
            </CardContent>
          </Card>

          {/* Job Cards */}
          <Card>
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-semibold text-gray-900">Job Cards</p>
                <button
                  onClick={() => setAddJobCardOpen(true)}
                  className="flex items-center gap-1.5 rounded-[10px] border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Job Card
                </button>
              </div>
              {linkedJobCards.length === 0 ? (
                <p className="text-sm text-gray-400 py-2 text-center">No job cards</p>
              ) : (
                <div className="space-y-2">
                  {linkedJobCards.map((jc) => (
                    <Link
                      key={jc._id}
                      href={`/job-cards/${jc._id}`}
                      className="flex items-center justify-between rounded-[10px] border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-cyan-500 underline font-medium">
                        #{jc.ticketNo}
                      </span>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Root Cause / Resolution Card */}
          <Card>
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-semibold text-gray-900">Root cause / resolution</p>
                <button
                  onClick={() => {
                    setRootCauseText(detail?.rootCause || "");
                    setResolutionText(detail?.resolution || "");
                    setOnSiteTechChecked(ticket.onSiteTechnicianRequired === 1);
                    setEditRootCauseOpen(true);
                  }}
                  className="rounded-[10px] p-1.5 text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              {/* On-Site Technician Required indicator */}
              {ticket.onSiteTechnicianRequired === 1 && (
                <div className="flex items-center gap-2 mb-4">
                  <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="10" cy="10" r="8" />
                    <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm text-gray-700">On-Site Technician Required</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Root Cause block */}
                {detail?.rootCause ? (
                  <div className="rounded-[10px] bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      Root Cause
                      {detail.rootCauseDateTime && (
                        <span className="font-normal text-gray-500"> - {formatDate(detail.rootCauseDateTime)}</span>
                      )}
                      {detail.rootCauseUserId && (
                        <span className="font-normal text-gray-500"> - {detail.rootCauseUserId.name || ""}{(detail.rootCauseUserId as any).lastName ? ` ${(detail.rootCauseUserId as any).lastName}` : ""}</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{detail.rootCause}</p>
                  </div>
                ) : (
                  <div className="rounded-[10px] bg-gray-50 p-4">
                    <p className="text-sm text-gray-400 italic">No root cause recorded</p>
                  </div>
                )}

                {/* Resolution block */}
                {detail?.resolution ? (
                  <div className="rounded-[10px] bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      Resolution
                      {detail.resolutionDateTime && (
                        <span className="font-normal text-gray-500"> - {formatDate(detail.resolutionDateTime)}</span>
                      )}
                      {detail.resolutionUserId && (
                        <span className="font-normal text-gray-500"> - {detail.resolutionUserId.name || ""}{(detail.resolutionUserId as any).lastName ? ` ${(detail.resolutionUserId as any).lastName}` : ""}</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{detail.resolution}</p>
                  </div>
                ) : (
                  <div className="rounded-[10px] bg-gray-50 p-4">
                    <p className="text-sm text-gray-400 italic">No resolution recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments / Updates Card */}
          <Card>
            <CardContent className="p-10">
              <p className="text-base font-semibold text-gray-900 mb-4">Comments / Updates</p>

              {/* Add comment - textarea first */}
              <div className="mb-5">
                <Textarea
                  placeholder="Start typing..."
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex items-center gap-3 mt-3">
                  <Button
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full px-5"
                    onClick={handleCommentSubmit}
                    disabled={submittingComment || !commentText.trim()}
                  >
                    {submittingComment && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save
                  </Button>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={commentPublic}
                      onChange={(e) => setCommentPublic(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Make Public
                  </label>
                </div>
              </div>

              {/* Comments list */}
              {comments.length > 0 && (
                <div className="space-y-4">
                  {comments.map((c) => {
                    const isPublic = c.visibility === 2;
                    const dateStr = c.createdAt ? formatCommentDate(c.createdAt) : "";

                    return (
                      <div
                        key={c._id}
                        className="rounded-[10px]"
                        style={{ backgroundColor: isPublic ? "#FFF7DD" : "#F2FBFF", padding: "30px" }}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: isPublic ? "#E49049" : "#00AEEF" }}>
                              {c.userId?.name || "Unknown"}
                            </span>
                            <span className="text-xs" style={{ color: isPublic ? "#E49049" : "#00AEEF" }}>{dateStr}</span>
                          </div>
                          {isPublic ? (
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(c._id);
                                    setEditCommentText(c.comments || "");
                                  }}
                                  className="text-xs hover:underline cursor-pointer"
                                  style={{ color: "#E49049" }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(c._id)}
                                  className="text-xs hover:underline cursor-pointer"
                                  style={{ color: "#E49049" }}
                                >
                                  Delete
                                </button>
                              </div>
                              <button
                                onClick={() => handleToggleCommentVisibility(c._id, c.visibility)}
                                className="text-xs hover:underline cursor-pointer"
                                style={{ color: "#E49049" }}
                              >
                                Make Private
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <button
                                onClick={() => handleToggleCommentVisibility(c._id, c.visibility)}
                                className="text-xs hover:underline cursor-pointer"
                                style={{ color: "#00AEEF" }}
                              >
                                Make Public
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(c._id);
                                  setEditCommentText(c.comments || "");
                                }}
                                className="text-xs hover:underline cursor-pointer"
                                style={{ color: "#00AEEF" }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(c._id)}
                                className="text-xs hover:underline cursor-pointer"
                                style={{ color: "#00AEEF" }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mt-3">{c.comments}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Edit Ticket Dialog ──────────────────────────────────── */}
      <EditTicketDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        ticketId={ticketId}
        ticket={ticket}
        onSuccess={() => {
          setEditDialogOpen(false);
          fetchTicket();
        }}
      />

      {/* ─── Add Job Card Dialog ──────────────────────────────────── */}
      <Dialog open={addJobCardOpen} onOpenChange={setAddJobCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Job Card</DialogTitle>
          </DialogHeader>
          <hr />
          <div className="space-y-4 px-2 py-3">
            <p className="text-[14px] text-gray-700">Adding a new job card will:</p>
            <ul className="list-disc pl-8 space-y-1.5 text-[14px] text-gray-900">
              <li><strong>Create a new Job Card</strong>, with copy job details</li>
              <li><strong>Link this support ticket</strong> with that job card</li>
              <li><strong>Mark this support ticket</strong> as &quot;On-Site Technician&quot;</li>
            </ul>
            <p className="text-[14px] text-gray-700">Confirm below if you like to proceed.</p>
            <p className="text-[14px] text-orange-500">This action cannot be undone</p>
          </div>
          <hr />
          <div className="flex items-center gap-3 px-2">
            <Button
              onClick={handleAddJobCard}
              disabled={addJobCardSaving}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {addJobCardSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirm
            </Button>
            <button
              onClick={() => setAddJobCardOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Claim Ticket Dialog ──────────────────────────────────── */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Claim Ticket {ticket.ticketNo}</DialogTitle>
          </DialogHeader>
          <hr />
          {claimLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
            </div>
          ) : (
            <div className="space-y-4 px-2">
              <p className="text-sm text-gray-500">Assign this ticket to yourself, or other TSC members.</p>

              {/* You */}
              {claimCurrentUser && (
                <>
                  <p className="text-sm font-medium text-gray-700">You</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={claimSelectedIds.has(claimCurrentUser.id)}
                      onChange={() => toggleClaimUser(claimCurrentUser.id)}
                      className="h-5 w-5 rounded border-gray-300 text-cyan-500 accent-cyan-500"
                    />
                    <span className={claimSelectedIds.has(claimCurrentUser.id) ? "text-sm font-medium text-green-600" : "text-sm text-gray-700"}>
                      {claimCurrentUser.name}{claimCurrentUser.lastName ? ` ${claimCurrentUser.lastName}` : ""}
                    </span>
                  </label>
                </>
              )}

              {/* Others */}
              {claimUsers.length > 0 && (
                <>
                  <p className="text-sm font-medium text-gray-700">Others</p>
                  <div className="grid grid-cols-2 gap-3">
                    {claimUsers.map((u) => (
                      <label key={u._id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={claimSelectedIds.has(u._id)}
                          onChange={() => toggleClaimUser(u._id)}
                          className="h-5 w-5 rounded border-gray-300 text-cyan-500 accent-cyan-500"
                        />
                        <span className={claimSelectedIds.has(u._id) ? "text-sm font-medium text-green-600" : "text-sm text-gray-700"}>
                          {u.name}{u.lastName ? ` ${u.lastName}` : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <hr />
          <div className="flex items-center gap-3 px-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleClaimSubmit}
              disabled={claimSubmitting || claimSelectedIds.size === 0}
            >
              {claimSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Claim / Assign Ticket
            </Button>
            <button
              onClick={() => setClaimDialogOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Resolve Ticket Dialog ────────────────────────────────── */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
          </DialogHeader>
          <hr />
          <div className="space-y-4 px-2">
            <div>
              <Label className="text-sm text-gray-700">
                Comments <span className="text-cyan-500">*</span>
              </Label>
              <Textarea
                value={resolveComment}
                onChange={(e) => setResolveComment(e.target.value)}
                rows={5}
                placeholder=""
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-400 text-white text-xs font-bold">!</span>
              Please note: The above comment will be public facing and seen by client
            </div>
            <hr />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={resolveSendNotification}
                onChange={(e) => handleResolveSendNotificationToggle(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 accent-cyan-500"
              />
              <span className={resolveSendNotification ? "text-green-600 font-medium" : "text-gray-700"}>
                Send notification to client
              </span>
            </label>

            {resolveSendNotification && (
              <div className="space-y-4 pt-2">
                {resolveContactsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
                  </div>
                ) : (
                  <>
                    {/* General Contacts */}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">General Contacts</p>
                      {resolveGeneralContacts.length === 0 ? (
                        <p className="mt-1 text-sm text-gray-400">No general contacts</p>
                      ) : (
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          {resolveGeneralContacts.map((c) => (
                            <label key={c._id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={resolveSelectedContactIds.has(c._id)}
                                onChange={() => toggleResolveContact(c._id)}
                                className="h-5 w-5 rounded border-gray-300 accent-cyan-500"
                              />
                              <span className="text-sm text-gray-700">
                                {c.name}{c.lastName ? ` ${c.lastName}` : ""}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <hr />

                    {/* Site Contacts */}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Site Contacts</p>
                      {resolveSiteContacts.length === 0 ? (
                        <p className="mt-1 text-sm text-gray-400">No site contacts</p>
                      ) : (
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          {resolveSiteContacts.map((c) => (
                            <label key={c._id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={resolveSelectedContactIds.has(c._id)}
                                onChange={() => toggleResolveContact(c._id)}
                                className="h-5 w-5 rounded border-gray-300 accent-cyan-500"
                              />
                              <span className="text-sm text-gray-700">
                                {c.name}{c.lastName ? ` ${c.lastName}` : ""}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 px-2 pt-3">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleResolveSubmit}
              disabled={submittingResolve || !resolveComment.trim()}
            >
              {submittingResolve && <Loader2 className="h-4 w-4 animate-spin" />}
              Resolve Ticket
            </Button>
            <button
              onClick={() => setResolveDialogOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Description (About/Symptoms) Dialog ─────────────── */}
      <Dialog open={editDescOpen} onOpenChange={setEditDescOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
          </DialogHeader>
          <hr />
          <div className="flex items-start gap-6 px-2">
            <Label className="mt-2 min-w-[80px] text-sm text-gray-600">About</Label>
            <Textarea
              value={descText}
              onChange={(e) => setDescText(e.target.value)}
              rows={5}
              placeholder="Enter information about this client..."
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3 px-2 pt-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleSaveDesc}
              disabled={savingDesc}
            >
              {savingDesc && <Loader2 className="h-4 w-4 animate-spin" />}
              Update
            </Button>
            <button
              onClick={() => setEditDescOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Contact Dialog ────────────────────────────────── */}
      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <hr />
          <div className="space-y-5 px-2">
            {/* Select Site */}
            <div className="flex items-center gap-6">
              <Label className="min-w-[100px] text-sm text-gray-600">Select Site</Label>
              <div className="relative flex-1">
                <select
                  value={contactForm.clientSiteId}
                  onChange={(e) => setContactForm({ ...contactForm, clientSiteId: e.target.value })}
                  className="w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select Site</option>
                  {contactSites.map((s) => (
                    <option key={s._id} value={s._id}>{s.siteName}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            {/* First Name */}
            <div className="flex items-center gap-6">
              <Label className="min-w-[100px] text-sm text-gray-600">First Name</Label>
              <Input
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="First Name"
                className="flex-1"
              />
            </div>
            {/* Last Name */}
            <div className="flex items-center gap-6">
              <Label className="min-w-[100px] text-sm text-gray-600">Last Name</Label>
              <Input
                value={contactForm.lastName}
                onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                placeholder="Last Name"
                className="flex-1"
              />
            </div>
            {/* Position */}
            <div className="flex items-center gap-6">
              <Label className="min-w-[100px] text-sm text-gray-600">Position</Label>
              <Input
                value={contactForm.position}
                onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                placeholder="Position"
                className="flex-1"
              />
            </div>
            {/* Email */}
            <div className="flex items-center gap-6">
              <Label className="min-w-[100px] text-sm text-gray-600">Email</Label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="Email"
                className="flex-1"
              />
            </div>
            {/* Phone */}
            <div className="flex items-center gap-6">
              <Label className="min-w-[100px] text-sm text-gray-600">Phone</Label>
              <Input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="Phone"
                className="flex-1"
              />
            </div>
          </div>
          {/* Footer */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleSaveContact}
              disabled={savingContact}
            >
              {savingContact && <Loader2 className="h-4 w-4 animate-spin" />}
              Update
            </Button>
            <button
              onClick={() => setEditContactOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Root Cause / Resolution Dialog ────────────────────── */}
      <Dialog open={editRootCauseOpen} onOpenChange={setEditRootCauseOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Root cause / resolution</DialogTitle>
          </DialogHeader>
          <hr />
          <div className="space-y-5 px-2">
            <div>
              <p className="text-sm text-gray-600 mb-1.5">Root cause</p>
              <Textarea
                value={rootCauseText}
                onChange={(e) => setRootCauseText(e.target.value)}
                rows={5}
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1.5">Resolution</p>
              <Textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows={5}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onSiteTechChecked}
                onChange={(e) => setOnSiteTechChecked(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">An on site technician was required</span>
            </label>
          </div>
          <div className="flex items-center gap-3 px-2 pt-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleSaveRootCause}
              disabled={savingRootCause}
            >
              {savingRootCause && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm
            </Button>
            <button
              onClick={() => setEditRootCauseOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Add Time Dialog ─────────────────────────────────────── */}
      <Dialog open={addTimeOpen} onOpenChange={setAddTimeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Time</DialogTitle>
          </DialogHeader>
          <hr />
          <div className="space-y-5 px-2">
            {/* Hrs : Mins */}
            <div>
              <div className="flex items-end gap-2">
                <div>
                  <p className="text-sm text-gray-500 mb-1.5">Hrs</p>
                  <Input
                    className="w-[80px] text-center"
                    value={timeForm.hours}
                    onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
                    placeholder="00"
                  />
                </div>
                <span className="text-gray-400 text-lg font-bold pb-2">:</span>
                <div>
                  <p className="text-sm text-gray-500 mb-1.5">Mins</p>
                  <Input
                    className="w-[80px] text-center"
                    value={timeForm.minutes}
                    onChange={(e) => setTimeForm({ ...timeForm, minutes: e.target.value })}
                    placeholder="00"
                  />
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <p className="text-sm text-gray-500 mb-1.5">Date</p>
              <Input
                type="date"
                value={timeForm.date}
                onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })}
              />
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-gray-500 mb-1.5">Description</p>
              <Textarea
                value={timeForm.description}
                onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
                rows={3}
                placeholder=""
              />
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 pt-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleAddTime}
              disabled={submittingTime}
            >
              {submittingTime && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Time
            </Button>
            <button
              onClick={() => setAddTimeOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── View Time Dialog ──────────────────────────────────────── */}
      <Dialog open={viewTimeOpen} onOpenChange={setViewTimeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Time Entries</DialogTitle>
          </DialogHeader>
          <hr />
          <div className="max-h-[400px] overflow-y-auto space-y-3 px-2 pr-3 styled-scroll">
            {timeEntries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No time entries yet.</p>
            ) : (
              timeEntries.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-start justify-between rounded-[10px] border border-gray-200 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {entry.timeHours || 0}hrs {entry.timeMinutes || 0}mins
                    </p>
                    {entry.description && (
                      <p className="text-sm text-gray-500 mt-1">{entry.description}</p>
                    )}
                    {entry.userId && (
                      <p className="text-xs text-gray-400 mt-1">
                        By {entry.userId.name} {entry.userId.lastName || ""}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0 ml-4">
                    {entry.timeDate ? formatDateTime(entry.timeDate) : formatDateTime(entry.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between px-2 pt-2">
            <p className="text-sm font-semibold text-green-500">
              Total: {displayHours}hrs {displayMinutes}mins
            </p>
            <button
              onClick={() => setViewTimeOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Filename Dialog ─────────────────────────────────── */}
      <Dialog open={!!editFilenameAttId} onOpenChange={(v) => { if (!v) { setEditFilenameAttId(null); setEditFilenameName(""); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Filename</DialogTitle>
          </DialogHeader>
          <hr style={{ borderTop: "1px solid #D4E3EB" }} />
          <div className="flex items-center gap-6 px-2">
            <Label className="min-w-[80px] text-sm text-gray-600">File name</Label>
            <Input
              value={editFilenameName}
              onChange={(e) => setEditFilenameName(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3 px-2 pt-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleSaveFilename}
              disabled={savingFilename || !editFilenameName.trim()}
            >
              {savingFilename && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
            <button
              onClick={() => { setEditFilenameAttId(null); setEditFilenameName(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Upload Multiple Documents Dialog ────────────────────── */}
      <Dialog open={uploadDialogOpen} onOpenChange={(v) => { if (!uploading) { setUploadDialogOpen(v); if (!v) { setPendingFiles([]); setUploadProgress({}); } } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload Multiple Documents</DialogTitle>
          </DialogHeader>
          <hr />

          <div className="space-y-4 px-2">
            {/* File list with progress bars */}
            {pendingFiles.length > 0 && (
              <div className="space-y-3">
                {pendingFiles.map((file, idx) => {
                  const key = `${file.name}-${idx}`;
                  const progress = uploadProgress[key];
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-700 truncate pr-4">{file.name}</p>
                        {progress === undefined && !uploading && (
                          <button
                            onClick={() => removePendingFile(idx)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {progress !== undefined && progress >= 0 && (
                          <span className="text-xs text-cyan-600 flex-shrink-0">{progress}%</span>
                        )}
                        {progress === -1 && (
                          <span className="text-xs text-red-500 flex-shrink-0">Failed</span>
                        )}
                      </div>
                      {progress !== undefined && progress >= 0 && (
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      <hr className="mt-2 border-gray-100" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-[10px] border-2 border-dashed border-cyan-300 bg-cyan-50/30 p-8 text-center cursor-pointer hover:bg-cyan-50/60 transition-colors"
            >
              <p className="text-sm text-gray-600">
                Drag & Drop multiple documents to upload at once
              </p>
              <p className="text-sm text-cyan-600 underline mt-1">
                Or click here to select
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleUploadFiles}
              disabled={uploading || pendingFiles.length === 0}
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload Documents
            </Button>
            <button
              onClick={() => { if (!uploading) { setUploadDialogOpen(false); setPendingFiles([]); setUploadProgress({}); } }}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Comment Dialog ─────────────────────────────────── */}
      <Dialog open={!!editingCommentId} onOpenChange={(v) => { if (!v) { setEditingCommentId(null); setEditCommentText(""); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
          </DialogHeader>
          <hr />
          <div className="flex items-start gap-6 px-2">
            <Label className="mt-2 min-w-[90px] text-sm text-gray-600">Comments</Label>
            <Textarea
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              rows={5}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3 px-2 pt-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleEditComment}
              disabled={!editCommentText.trim()}
            >
              Update
            </Button>
            <button
              onClick={() => { setEditingCommentId(null); setEditCommentText(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Edit Ticket Dialog Component ────────────────────────────────────────

function EditTicketDialog({
  open,
  onOpenChange,
  ticketId,
  ticket,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticket: TicketData;
  onSuccess: () => void;
}) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);

  const [clientId, setClientId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [contactId, setContactId] = useState("");

  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  const [newRequesterMode, setNewRequesterMode] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [loadingClient, setLoadingClient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize when dialog opens
  useEffect(() => {
    if (!open) {
      setInitialized(false);
      return;
    }

    async function init() {
      // Set current values
      const cId = ticket.clientId?._id || "";
      setClientId(cId);
      setClientSearch(ticket.clientId?.companyName || "");
      setSiteId(ticket.clientSiteId?._id || "");
      setAssetId(ticket.clientAssetId?._id || "");
      setContactId(ticket.clientContactId?._id || "");
      setError("");
      setNewRequesterMode(false);

      try {
        const res = await fetch("/api/clients");
        const json = await res.json();
        if (json.success) {
          const raw = json.data?.data || json.data || [];
          setClients(Array.isArray(raw) ? raw : []);
        }

        if (cId) {
          await fetchClientData(cId, false);
        }
      } catch {
        // silent
      }
      setInitialized(true);
    }

    init();
  }, [open, ticket]);

  async function fetchClientData(cId: string, resetSelections: boolean) {
    setLoadingClient(true);
    if (resetSelections) {
      setSiteId("");
      setAssetId("");
      setContactId("");
    }
    try {
      const [sitesRes, assetsRes, contactsRes] = await Promise.all([
        fetch(`/api/clients/${cId}/sites`),
        fetch(`/api/clients/${cId}/assets`),
        fetch(`/api/clients/${cId}/contacts`),
      ]);
      const sitesJson = await sitesRes.json();
      const assetsJson = await assetsRes.json();
      const contactsJson = await contactsRes.json();

      if (sitesJson.success) {
        const raw = sitesJson.data?.data || sitesJson.data || [];
        setSites(Array.isArray(raw) ? raw : []);
      }
      if (assetsJson.success) {
        const raw = assetsJson.data?.data || assetsJson.data || [];
        setAssets(Array.isArray(raw) ? raw : []);
      }
      if (contactsJson.success) {
        const raw = contactsJson.data?.data || contactsJson.data || [];
        setContacts(Array.isArray(raw) ? raw : []);
      }
    } catch {
      // silent
    } finally {
      setLoadingClient(false);
    }
  }

  // Filter assets/contacts by site
  const filteredAssets = siteId
    ? assets.filter((a) => a.clientSiteId === siteId || !a.clientSiteId)
    : assets;

  const filteredContacts = siteId
    ? contacts.filter((c) => c.clientSiteId === siteId || !c.clientSiteId)
    : contacts;

  const filteredClients = clientSearch
    ? clients.filter((c) =>
        c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  function handleSelectClient(id: string, name: string) {
    setClientId(id);
    setClientSearch(name);
    setClientDropdownOpen(false);
    fetchClientData(id, true);
  }

  function handleClearClient() {
    setClientId("");
    setClientSearch("");
    setSiteId("");
    setAssetId("");
    setContactId("");
    setSites([]);
    setAssets([]);
    setContacts([]);
  }

  async function handleSubmit() {
    setError("");

    if (!clientId) { setError("Client is required"); return; }
    if (!siteId) { setError("Site is required"); return; }
    if (!assetId) { setError("Asset is required"); return; }
    if (!newRequesterMode && !contactId) { setError("Requester is required"); return; }
    if (newRequesterMode && !newFirstName.trim()) { setError("First name is required"); return; }

    setSubmitting(true);

    try {
      let finalContactId = contactId;

      if (newRequesterMode) {
        const contactPayload: Record<string, string> = { name: newFirstName.trim() };
        if (newLastName.trim()) contactPayload.lastName = newLastName.trim();
        if (newEmail.trim()) contactPayload.email = newEmail.trim();
        if (newPhone.trim()) contactPayload.phone = newPhone.trim();
        if (siteId) contactPayload.clientSiteId = siteId;

        const contactRes = await fetch(`/api/clients/${clientId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactPayload),
        });
        const contactJson = await contactRes.json();
        if (!contactJson.success) throw new Error(contactJson.error || "Failed to create contact");
        finalContactId = contactJson.data._id;
      }

      const body: Record<string, any> = {
        clientId,
        clientSiteId: siteId || null,
        clientAssetId: assetId || null,
        clientContactId: finalContactId || null,
      };

      const res = await fetch(`/api/support-tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update");

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Ticket</DialogTitle>
        </DialogHeader>
        <hr />

        {!initialized ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
          </div>
        ) : (<>
        <div className="space-y-5 px-2">
          {error && (
            <div className="rounded-[10px] bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Client (required) - searchable */}
          <div className="flex items-start gap-4">
            <Label className="mt-2.5 w-[140px] shrink-0 text-sm text-gray-600">
              Client <span className="text-cyan-500">(required)</span>
            </Label>
            <div className="relative flex-1" ref={clientRef}>
              <div className="relative">
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setClientDropdownOpen(true);
                    if (!e.target.value) handleClearClient();
                  }}
                  onFocus={() => setClientDropdownOpen(true)}
                  placeholder="Search clients..."
                  className="w-full rounded-[10px] border border-gray-200 px-3 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {clientId && (
                    <button onClick={handleClearClient} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              {clientDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-[10px] border border-gray-200 bg-white shadow-lg">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-sm text-gray-400">No clients found</div>
                  ) : (
                    filteredClients.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => handleSelectClient(c._id, c.companyName)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-cyan-50 cursor-pointer ${c._id === clientId ? "bg-cyan-50 font-medium" : ""}`}
                      >
                        {c.companyName}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Site */}
          <div className="flex items-start gap-4">
            <Label className="mt-2.5 w-[140px] shrink-0 text-sm text-gray-600">
              Site <span className="text-cyan-500">(required)</span>
            </Label>
            <div className="relative flex-1">
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                disabled={!clientId || loadingClient}
                className="w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              >
                <option value="">{loadingClient ? "Loading..." : "Select Site"}</option>
                {sites.map((s) => (
                  <option key={s._id} value={s._id}>{s.siteName}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Asset */}
          <div className="flex items-start gap-4">
            <Label className="mt-2.5 w-[140px] shrink-0 text-sm text-gray-600">
              Asset <span className="text-cyan-500">(required)</span>
            </Label>
            <div className="relative flex-1">
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                disabled={!clientId || loadingClient}
                className="w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              >
                <option value="">{loadingClient ? "Loading..." : "Select Asset"}</option>
                {filteredAssets.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.machineName}{a.serialNo ? ` (${a.serialNo})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Requester */}
          {!newRequesterMode ? (
            <div className="flex items-start gap-4">
              <Label className="mt-2.5 w-[140px] shrink-0 text-sm text-gray-600">
                Requester <span className="text-cyan-500">(required)</span>
              </Label>
              <div className="flex-1">
                <div className="relative">
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    disabled={!clientId || loadingClient}
                    className="w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
                  >
                    <option value="">{loadingClient ? "Loading..." : "Select Requester"}</option>
                    {filteredContacts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}{c.lastName ? ` ${c.lastName}` : ""}{c.email ? ` (${c.email})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  onClick={() => setNewRequesterMode(true)}
                  className="mt-1 text-xs text-cyan-500 underline cursor-pointer"
                >
                  New Requester?
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <Label className="mt-2.5 w-[140px] shrink-0 text-sm text-gray-600">
                New Requester
              </Label>
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="First Name *"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
                <Input
                  placeholder="Last Name"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Input
                  placeholder="Phone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                <button
                  onClick={() => {
                    setNewRequesterMode(false);
                    setNewFirstName("");
                    setNewLastName("");
                    setNewEmail("");
                    setNewPhone("");
                  }}
                  className="text-xs text-cyan-500 underline cursor-pointer"
                >
                  Select existing requester?
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-2 pt-3">
          <Button
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
            onClick={handleSubmit}
            disabled={submitting || !initialized}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Update
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            Cancel
          </button>
        </div>
        </>)}
      </DialogContent>
    </Dialog>
  );
}
