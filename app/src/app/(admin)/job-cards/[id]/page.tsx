"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Loader2,
  ExternalLink,
  Archive,
  RefreshCcw,
  Link2,
} from "lucide-react";
import { PlusSquareIcon, TrashIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoading } from "@/components/ui/loading";
import {
  formatDate,
  formatDateTime,
  JOB_CARD_STATUS_LABELS,
} from "@/lib/utils";
import { AddJobCardDialog } from "@/components/dialogs/add-job-card-dialog";
import { CommentsSection } from "@/components/comments-section";
import { AttachmentsSection } from "@/components/attachments-section";
import { TicketHistorySection } from "@/components/ticket-history-section";

// --- Types ---

interface ClientInfo {
  _id: string;
  companyName: string;
  address?: string;
}

interface SiteInfo {
  _id: string;
  siteName: string;
  address?: string;
}

interface ContactInfo {
  _id: string;
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface TitleInfo {
  _id: string;
  title: string;
}

interface JobCardTypeInfo {
  _id: string;
  title: string;
}

interface JobCardDetail {
  _id: string;
  description?: string;
  technicianBriefing?: string;
}

interface Comment {
  _id: string;
  comments: string;
  commentType?: number;
  visibility?: number;
  userId?: {
    _id: string;
    name: string;
    email?: string;
  };
  createdAt: string;
  dateTime?: string;
}

interface Attachment {
  _id: string;
  documentName?: string;
  fileName: string;
  fileSize?: number;
  visibility?: number;
  userId?: { _id: string; name: string };
  createdAt: string;
}

interface TechnicianData {
  _id: string;
  technicianId?: {
    _id: string;
    companyName: string;
    email?: string;
    phone?: string;
  };
}

interface ClientAssetData {
  _id: string;
  clientAssetId?: {
    _id: string;
    machineName: string;
    serialNumber?: string;
  };
  checklistItems?: any[];
  completeChecklist?: number;
}

interface OwnerData {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email?: string;
  };
}

interface AvailableAsset {
  _id: string;
  machineName: string;
  serialNumber?: string;
}

interface TechCompany {
  _id: string;
  companyName: string;
}

interface SubTechnician {
  _id: string;
  companyName: string;
  parentId?: string;
}

interface JobCardData {
  _id: string;
  ticketNo: number;
  uniqueId?: string;
  jobCardStatus: number;
  clientId: ClientInfo;
  clientSiteId?: SiteInfo;
  clientAssetId?: { _id: string };
  clientContactId?: ContactInfo;
  titleId?: TitleInfo;
  jobCardType?: JobCardTypeInfo;
  supportTicketId?: { _id: string; ticketNo: number } | string;
  jobDate?: string;
  jobEndDate?: string;
  multiDayJob?: number;
  warranty?: number;
  recurringJob?: number;
  recurringPeriod?: number;
  recurringRange?: number;
  invoiceNumber?: string;
  jobCardSentDate?: string;
  createdAt: string;
  userId?: { _id: string; name: string; email?: string };
  detail?: JobCardDetail;
  comments?: Comment[];
  attachments?: Attachment[];
  technicians?: TechnicianData[];
  clientAssets?: ClientAssetData[];
  owners?: OwnerData[];
}

// --- Progress steps ---

const JOB_PROGRESS_STEPS = [
  { label: "Date Allocated", color: "#F7CE4A" },
  { label: "Date Confirmed", color: "#83CE67" },
  { label: "Assigned Technicians", color: "#E18230" },
  { label: "Technician Avail. Conf.", color: "#D514A1" },
  { label: "Client Date Confirmed", color: "#A114D5" },
  { label: "Job Card Sent", color: "#00AEEF" },
  { label: "Checklist Complete", color: "#F7CE4A" },
  { label: "Internal Review", color: "#2B790E" },
  { label: "Job Invoiced", color: "#000000" },
];

// --- Circular Progress Ring ---

function CircularProgress({
  percentage,
  size = 40,
}: {
  percentage: number;
  size?: number;
}) {
  const strokeWidth = 3;
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
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#00AEEF"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-500">
        {percentage}%
      </span>
    </div>
  );
}

// --- Page component ---

export default function JobCardDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [jobCard, setJobCard] = useState<JobCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Assets dialog
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<AvailableAsset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [addingAsset, setAddingAsset] = useState(false);

  // Technician dialog
  const [techDialogOpen, setTechDialogOpen] = useState(false);
  const [techCompanies, setTechCompanies] = useState<TechCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [subTechnicians, setSubTechnicians] = useState<SubTechnician[]>([]);
  const [selectedTechIds, setSelectedTechIds] = useState<Set<string>>(new Set());
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [loadingSubTechs, setLoadingSubTechs] = useState(false);
  const [addingTech, setAddingTech] = useState(false);

  // Job card types
  const [jobCardTypes, setJobCardTypes] = useState<{ _id: string; title: string }[]>([]);

  // Edit job card dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Technician briefing dialog
  const [briefingDialogOpen, setBriefingDialogOpen] = useState(false);
  const [briefingText, setBriefingText] = useState("");
  const [briefingSaving, setBriefingSaving] = useState(false);

  // Job Progress saving lock
  const [progressSaving, setProgressSaving] = useState(false);

  // Job Date dialog
  const [jobDateDialogOpen, setJobDateDialogOpen] = useState(false);
  const [jobDateMultiDay, setJobDateMultiDay] = useState(false);
  const [jobDateStart, setJobDateStart] = useState("");
  const [jobDateEnd, setJobDateEnd] = useState("");
  const [jobDateHour, setJobDateHour] = useState("12");
  const [jobDateMinute, setJobDateMinute] = useState("00");
  const [jobDateAmPm, setJobDateAmPm] = useState("AM");
  const [jobDateSaving, setJobDateSaving] = useState(false);

  // Claim dialog
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimUsers, setClaimUsers] = useState<{ _id: string; name: string; lastName?: string }[]>([]);
  const [claimSelectedIds, setClaimSelectedIds] = useState<Set<string>>(new Set());
  const [claimCurrentUser, setClaimCurrentUser] = useState<{ id: string; name: string; lastName?: string } | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  // Fetch job card types from settings
  useEffect(() => {
    async function fetchTypes() {
      try {
        const res = await fetch("/api/settings/job-card-types");
        const json = await res.json();
        if (json.success) setJobCardTypes(json.data || []);
      } catch {
        // silent
      }
    }
    fetchTypes();
  }, []);

  useEffect(() => {
    document.title = jobCard
      ? `JC - ${jobCard.ticketNo}`
      : "TSC - Job Cards";
  }, [jobCard]);

  const fetchJobCard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/job-cards/${id}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load job card");
      }

      setJobCard(json.data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobCard();
  }, [fetchJobCard]);

  // --- Comments ---

  // --- Assets ---

  async function openAssetDialog() {
    setAssetDialogOpen(true);
    setSelectedAssetIds(new Set());
    if (!jobCard?.clientId?._id) return;
    setLoadingAssets(true);
    try {
      const res = await fetch(`/api/clients/${jobCard.clientId._id}/assets`);
      const json = await res.json();
      const all = json.success ? (json.data || []) : [];
      // Filter out assets already on this job card
      const existingIds = new Set((jobCard.clientAssets || []).map((a: any) =>
        typeof a.clientAssetId === "object" ? a.clientAssetId._id : a.clientAssetId
      ));
      setAvailableAssets(all.filter((a: any) => !existingIds.has(a._id)));
    } catch {
      setAvailableAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }

  async function handleAddAssets() {
    if (selectedAssetIds.size === 0) return;
    setAddingAsset(true);
    try {
      for (const assetId of selectedAssetIds) {
        const res = await fetch(`/api/job-cards/${id}/assets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientAssetId: assetId }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to add asset");
        }
      }
      setSelectedAssetIds(new Set());
      setAssetDialogOpen(false);
      fetchJobCard();
    } catch (err: any) {
      alert(err.message || "Failed to add asset");
    } finally {
      setAddingAsset(false);
    }
  }

  function toggleAssetSelection(assetId: string) {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }

  // --- Technicians ---

  async function openTechDialog() {
    setTechDialogOpen(true);
    setSelectedCompanyId("");
    setSubTechnicians([]);
    setSelectedTechIds(new Set());
    setLoadingTechs(true);
    try {
      // Fetch companies and existing technicians in parallel
      const [companiesRes, existingRes] = await Promise.all([
        fetch("/api/technicians?limit=200"),
        fetch(`/api/job-cards/${id}/technicians`),
      ]);
      const companiesJson = await companiesRes.json();
      const existingJson = await existingRes.json();
      if (companiesJson.success) {
        const raw = companiesJson.data?.data || companiesJson.data || [];
        setTechCompanies(Array.isArray(raw) ? raw : []);
      }
      // Pre-select already assigned technicians
      const existingIds = (existingJson.data || []).map((t: any) =>
        typeof t.technicianId === "object" ? t.technicianId._id : t.technicianId
      );
      setSelectedTechIds(new Set(existingIds));
    } catch {
      setTechCompanies([]);
    } finally {
      setLoadingTechs(false);
    }
  }

  async function handleSelectCompany(companyId: string) {
    setSelectedCompanyId(companyId);
    setLoadingSubTechs(true);
    try {
      const res = await fetch(`/api/technicians?parentId=${companyId}&limit=200`);
      const json = await res.json();
      if (json.success) {
        const raw = json.data?.data || json.data || [];
        setSubTechnicians(Array.isArray(raw) ? raw : []);
      }
    } catch {
      setSubTechnicians([]);
    } finally {
      setLoadingSubTechs(false);
    }
  }

  function toggleTechSelection(techId: string) {
    setSelectedTechIds((prev) => {
      const next = new Set(prev);
      if (next.has(techId)) next.delete(techId);
      else next.add(techId);
      return next;
    });
  }

  async function handleSaveTechnicians() {
    if (selectedTechIds.size === 0) return;
    setAddingTech(true);
    try {
      // Get existing technician assignments
      const existingRes = await fetch(`/api/job-cards/${id}/technicians`);
      const existingJson = await existingRes.json();
      const existingMap = new Map<string, string>();
      for (const t of (existingJson.data || [])) {
        const tid = typeof t.technicianId === "object" ? t.technicianId._id : t.technicianId;
        existingMap.set(tid, t._id);
      }

      const selectedArr = Array.from(selectedTechIds);
      const existingIds = new Set(existingMap.keys());

      // Add new ones
      for (const techId of selectedArr) {
        if (!existingIds.has(techId)) {
          await fetch(`/api/job-cards/${id}/technicians`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ technicianId: techId }),
          });
        }
      }

      // Remove deselected ones
      for (const [techId, assignmentId] of existingMap) {
        if (!selectedTechIds.has(techId)) {
          await fetch(`/api/job-cards/${id}/technicians/${assignmentId}`, {
            method: "DELETE",
          });
        }
      }

      setTechDialogOpen(false);
      fetchJobCard();
    } catch {
      alert("Failed to update technicians");
    } finally {
      setAddingTech(false);
    }
  }

  // --- Technician Briefing ---

  function openBriefingDialog() {
    setBriefingText(detail?.technicianBriefing || "");
    setBriefingDialogOpen(true);
  }

  async function handleSaveBriefing() {
    setBriefingSaving(true);
    try {
      const res = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianBriefing: briefingText }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBriefingDialogOpen(false);
        fetchJobCard();
      }
    } catch {
      // silent
    } finally {
      setBriefingSaving(false);
    }
  }

  // --- Job Date dialog ---

  function openJobDateDialog() {
    if (jobCard?.jobDate) {
      const d = new Date(jobCard.jobDate);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      setJobDateStart(`${yyyy}-${mm}-${dd}`);
      let h = d.getHours();
      const min = String(d.getMinutes()).padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setJobDateHour(String(h));
      setJobDateMinute(min);
      setJobDateAmPm(ampm);
    } else {
      setJobDateStart("");
      setJobDateHour("12");
      setJobDateMinute("00");
      setJobDateAmPm("AM");
    }
    if (jobCard?.jobEndDate) {
      const d = new Date(jobCard.jobEndDate);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      setJobDateEnd(`${yyyy}-${mm}-${dd}`);
    } else {
      setJobDateEnd("");
    }
    setJobDateMultiDay(jobCard?.multiDayJob === 1);
    setJobDateDialogOpen(true);
  }

  async function handleSaveJobDate() {
    if (!jobDateStart) return;
    if (jobDateMultiDay && jobDateEnd && jobDateEnd < jobDateStart) {
      alert("End date must be on or after the start date.");
      return;
    }
    setJobDateSaving(true);
    try {
      // Build jobDate with time
      let hours = parseInt(jobDateHour);
      if (jobDateAmPm === "PM" && hours !== 12) hours += 12;
      if (jobDateAmPm === "AM" && hours === 12) hours = 0;
      const jobDate = new Date(`${jobDateStart}T${String(hours).padStart(2, "0")}:${jobDateMinute}:00`);

      const body: Record<string, any> = {
        jobDate: jobDate.toISOString(),
      };
      if (jobDateMultiDay && jobDateEnd) {
        body.multiDayJob = 1;
        body.jobEndDate = new Date(`${jobDateEnd}T23:59:00`).toISOString();
      } else {
        body.multiDayJob = 0;
        body.jobEndDate = null;
      }

      const res = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setJobDateDialogOpen(false);
        fetchJobCard();
      } else {
        alert(json.error || "Failed to save job date.");
      }
    } catch {
      alert("Failed to save job date. Please try again.");
    } finally {
      setJobDateSaving(false);
    }
  }

  // --- Toggle fields (warranty etc.) ---

  async function handleToggle(field: string, newVal: number) {
    try {
      const res = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newVal }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setJobCard((prev) => (prev ? { ...prev, [field]: newVal } : prev));
      }
    } catch {
      // silent
    }
  }

  // --- Job Progress click ---

  async function handleProgressClick(stepIdx: number) {
    if (progressSaving) return;

    const targetStatus = stepIdx + 1; // steps are 1-indexed (1-9)
    const isActive = targetStatus <= progressStep;

    if (isActive) {
      // Deactivating — only allow deselecting the last active step (bottom-to-top)
      if (targetStatus !== progressStep) return;
      // Confirm before reverting
      if (!confirm(`Are you sure you want to undo "${JOB_PROGRESS_STEPS[stepIdx].label}"?`)) return;
    } else {
      // Activating — only allow selecting the next step in sequence
      if (targetStatus !== progressStep + 1) return;
    }

    const newStatus = isActive ? stepIdx : targetStatus;
    const body: Record<string, any> = { jobCardStatus: newStatus };

    // Optimistic update
    setProgressSaving(true);
    const snapshot = jobCard;
    setJobCard((prev) => prev ? { ...prev, ...body } : prev);

    try {
      const res = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setJobCard(snapshot);
      }
    } catch {
      setJobCard(snapshot);
    } finally {
      setProgressSaving(false);
    }
  }

  // --- Render ---

  if (loading) {
    return <PageLoading />;
  }

  if (error || !jobCard) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load job card
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {error || "An unexpected error occurred."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link href="/job-cards">
              <Button variant="outline">Back to List</Button>
            </Link>
            <Button onClick={fetchJobCard}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  const comments = jobCard.comments || [];
  const attachments = jobCard.attachments || [];
  const technicians = jobCard.technicians || [];
  const clientAssets = jobCard.clientAssets || [];
  const owners = jobCard.owners || [];
  const detail = jobCard.detail;

  // ─── Claim job card ──────────────────────────────────────────────────
  async function openClaimDialog() {
    setClaimDialogOpen(true);
    setClaimLoading(true);
    try {
      const [sessionRes, usersRes, ownersRes] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/users?role=1,2,3&limit=100&status=1"),
        fetch(`/api/job-cards/${id}/owners`),
      ]);
      const sessionJson = await sessionRes.json();
      const usersJson = await usersRes.json();
      const ownersJson = await ownersRes.json();

      const sessionUser = sessionJson?.user;
      const currentUserId = sessionUser?.id || "";
      const currentUserEmail = sessionUser?.email || "";

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

      const meId = meFromList?._id;
      setClaimUsers(meId
        ? users.filter((u: any) => String(u._id) !== String(meId))
        : currentUserEmail
          ? users.filter((u: any) => u.email !== currentUserEmail)
          : users);

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
      const res = await fetch(`/api/job-cards/${id}/owners`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedIds }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setClaimDialogOpen(false);
      fetchJobCard();
    } catch {
      alert("Failed to assign job card");
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

  // Compute progress step based on jobCardStatus
  // Progress step is directly from jobCardStatus (0-9)
  // 0=none, 1=Date Allocated, 2=Date Confirmed, 3=Assigned Technicians,
  // 4=Technician Avail Conf, 5=Client Date Confirmed, 6=Job Card Sent,
  // 7=Checklist Complete, 8=Internal Review, 9=Job Invoiced
  const progressStep = jobCard!.jobCardStatus || 0;

  // Format job date for display
  function formatJobDate(dateStr: string) {
    const d = new Date(dateStr);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[d.getDay()]} ${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
  }

  function formatJobTime(dateStr: string) {
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/job-cards">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-800 text-gray-800 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </div>
          </Link>
          <div>
            <h1 className="text-[26px] font-bold text-gray-900">
              Job Card #{jobCard.ticketNo}
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">
              <span className="font-bold text-gray-900">Created:</span>{" "}
              {formatDateTime(jobCard.createdAt)}
              <span className="mx-4" />
              <span className="font-bold text-gray-900">Generated by:</span>{" "}
              {jobCard.userId?.name || "System"}
              <span className="mx-4" />
              <span className="font-bold text-gray-900">Claimed by:</span>{" "}
              {owners.length > 0 && (
                <>
                  {owners.map((o, i) => (
                    <span key={o._id}>
                      {i > 0 && ", "}
                      {o.userId?.name || "Unknown"}
                    </span>
                  ))}
                  {"  "}
                </>
              )}
              <button onClick={openClaimDialog} className="text-cyan-500 underline cursor-pointer">Edit</button>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 bg-white"
            style={{ border: "1px solid #D6E1E9", padding: "8px 15px", borderRadius: 5, color: "#272D34", fontSize: 12, fontWeight: "normal", lineHeight: "13px" }}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Set as recurring job
          </button>
          <button
            className="inline-flex items-center gap-2 bg-white"
            style={{ border: "1px solid #D6E1E9", padding: "8px 15px", borderRadius: 5, color: "#272D34", fontSize: 12, fontWeight: "normal", lineHeight: "13px" }}
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200" style={{ marginTop: 40, marginBottom: 30 }}>
        <div className="flex">
          {["Overview", "Checklists", "Job Card Log"].map((tab) => {
            const tabKey = tab.toLowerCase().replace(/ /g, "-");
            const isActive = activeTab === (tabKey === "overview" ? "overview" : tabKey);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabKey === "overview" ? "overview" : tabKey)}
                className="relative transition-colors"
                style={{
                  color: isActive ? "#00AEEF" : "#272D34",
                  lineHeight: "30px",
                  display: "inline-block",
                  fontSize: 14,
                  paddingLeft: 25,
                  paddingRight: 25,
                  fontWeight: "normal",
                  paddingBottom: 10,
                }}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00AEEF]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="flex gap-6">
          {/* LEFT COLUMN */}
          <div className="min-w-0 flex-[2] space-y-6">
            {/* Main Content Card */}
            <div className="rounded-[10px] border border-gray-200 bg-white p-10">
              {/* Client Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-gray-900">
                    {jobCard.clientId?.companyName || "Unknown Client"}
                  </h2>
                  {jobCard.clientId?.address && (
                    <p className="mt-1 text-[13px] text-gray-600">
                      {jobCard.clientId.address}
                    </p>
                  )}
                  {jobCard.clientContactId && (
                    <div className="mt-2">
                      <p className="text-[13px] text-gray-900">
                        {jobCard.clientContactId.name}{" "}
                        {jobCard.clientContactId.lastName || ""}
                      </p>
                      {jobCard.clientContactId.phone && (
                        <p className="text-[13px] text-gray-600">
                          {jobCard.clientContactId.phone}
                        </p>
                      )}
                      {jobCard.clientContactId.email && (
                        <p className="text-[13px] text-gray-600">
                          {jobCard.clientContactId.email}
                        </p>
                      )}
                    </div>
                  )}
                  <Link
                    href="#"
                    className="mt-1 inline-block text-[13px] text-[#00AEEF] underline"
                  >
                    Edit Contact
                  </Link>
                </div>
                <button
                  onClick={() => setEditDialogOpen(true)}
                  className="text-[13px] text-[#00AEEF] underline cursor-pointer"
                >
                  Edit Job Card
                </button>
              </div>

              {/* Sites Row */}
              <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-[13px] text-gray-500">Sites</span>
                <span className="text-[13px] text-gray-900">
                  {jobCard.clientSiteId?.siteName || "-"}
                </span>
              </div>

              {/* Warranty Row */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-[13px] text-gray-500">Warranty</span>
                <div className="flex">
                  <button
                    onClick={() => handleToggle("warranty", jobCard.warranty === 1 ? 0 : 1)}
                    className="cursor-pointer transition-colors uppercase"
                    style={{ background: jobCard.warranty === 1 ? "#22C55E" : "#D6E1E9", padding: 10, color: "#FFF", borderRadius: 5, marginLeft: 7, fontWeight: "normal", fontSize: 11 }}
                  >
                    Warranty
                  </button>
                  <button
                    onClick={() => handleToggle("warranty", jobCard.warranty === 2 ? 0 : 2)}
                    className="cursor-pointer transition-colors uppercase"
                    style={{ background: jobCard.warranty === 2 ? "#EAB308" : "#D6E1E9", padding: 10, color: "#FFF", borderRadius: 5, marginLeft: 7, fontWeight: "normal", fontSize: 11 }}
                  >
                    Out of Warranty
                  </button>
                  <button
                    onClick={() => handleToggle("warranty", jobCard.warranty === 3 ? 0 : 3)}
                    className="cursor-pointer transition-colors uppercase"
                    style={{ background: jobCard.warranty === 3 ? "#06B6D4" : "#D6E1E9", padding: 10, color: "#FFF", borderRadius: 5, marginLeft: 7, fontWeight: "normal", fontSize: 11 }}
                  >
                    FOC
                  </button>
                </div>
              </div>

              <hr className="my-5 border-gray-200" />

              {/* Job Type */}
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Job Type</h3>
                <select
                  value={jobCard.jobCardType?._id || ""}
                  onChange={async (e) => {
                    const val = e.target.value;
                    const selected = jobCardTypes.find((t) => t._id === val);
                    setJobCard((prev) =>
                      prev
                        ? { ...prev, jobCardType: selected ? { _id: selected._id, title: selected.title } : undefined }
                        : prev
                    );
                    try {
                      await fetch(`/api/job-cards/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ jobCardType: val || null }),
                      });
                    } catch {
                      // silent
                    }
                  }}
                  className="mt-2 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-700 outline-none cursor-pointer"
                >
                  <option value="">Select</option>
                  {jobCardTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.title}
                    </option>
                  ))}
                </select>
              </div>

              <hr className="my-5 border-gray-200" />

              {/* Assets */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-gray-900">Asset(s)</h3>
                  <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        onClick={openAssetDialog}
                        className="flex items-center gap-1 rounded-[10px] border border-gray-200 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Asset
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Add Asset</DialogTitle>
                      </DialogHeader>
                      <hr />
                      {loadingAssets ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                        </div>
                      ) : availableAssets.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-500">No more assets available to add.</p>
                      ) : (
                        <div className="space-y-3 px-2">
                          {availableAssets.map((asset) => (
                            <label key={asset._id} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedAssetIds.has(asset._id)}
                                onChange={() => toggleAssetSelection(asset._id)}
                                className="h-5 w-5 rounded border-gray-300 text-cyan-500 accent-cyan-500"
                              />
                              <span className={selectedAssetIds.has(asset._id) ? "text-sm font-medium text-green-600" : "text-sm text-gray-700"}>
                                {asset.machineName}
                                {asset.serialNumber ? ` (${asset.serialNumber})` : ""}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      <hr />
                      <div className="flex items-center gap-3 px-2">
                        <Button
                          className="bg-cyan-500 hover:bg-cyan-600 text-white"
                          onClick={handleAddAssets}
                          disabled={selectedAssetIds.size === 0 || addingAsset}
                        >
                          {addingAsset && <Loader2 className="h-4 w-4 animate-spin" />}
                          Add Asset{selectedAssetIds.size > 1 ? "s" : ""}
                        </Button>
                        <button
                          onClick={() => setAssetDialogOpen(false)}
                          className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  {clientAssets.length === 0 ? (
                    <p className="text-[13px] text-gray-400">No assets assigned.</p>
                  ) : (
                    clientAssets.map((asset) => {
                      const name = asset.clientAssetId?.machineName || "Unknown Asset";
                      const totalItems = asset.checklistItems?.length || 0;
                      const completedItems = asset.completeChecklist || 0;

                      return (
                        <div
                          key={asset._id}
                          className="w-[220px] rounded-[10px] bg-[#E8F7FD] px-4 py-3"
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-[13px] font-bold text-gray-900">{name}</p>
                            <div className="flex items-center gap-1.5">
                              <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <PlusSquareIcon />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/job-cards/${id}/assets/${asset._id}`, { method: "DELETE" });
                                    const json = await res.json();
                                    if (res.ok && json.success) fetchJobCard();
                                  } catch { /* silent */ }
                                }}
                                className="text-gray-400 hover:text-red-500 cursor-pointer"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                          <Link
                            href="#"
                            className="text-[12px] text-[#00AEEF] underline"
                          >
                            Checklist {completedItems}/{totalItems}
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <hr className="my-5 border-gray-200" />

              {/* Technicians */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-gray-900">Technicians</h3>
                  <div className="flex items-center gap-3">
                    <button className="text-gray-400 hover:text-gray-600">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <Dialog open={techDialogOpen} onOpenChange={setTechDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        onClick={openTechDialog}
                        className="flex items-center gap-1 rounded-[10px] border border-gray-200 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Technician
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl p-0">
                      <DialogHeader className="px-6 pt-6 pb-0">
                        <DialogTitle>Add Technician</DialogTitle>
                      </DialogHeader>
                      <hr />
                      {loadingTechs ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                        </div>
                      ) : (
                        <div className="flex min-h-[400px]">
                          {/* Left: Companies */}
                          <div className="w-1/2 shrink-0 border-r border-gray-200 overflow-y-auto px-4 py-3">
                            <p className="mb-3 text-sm font-medium text-gray-700">Company</p>
                            <div className="space-y-2">
                              {techCompanies.map((company) => (
                                <button
                                  key={company._id}
                                  type="button"
                                  onClick={() => handleSelectCompany(company._id)}
                                  className={`w-full rounded-[10px] border px-4 py-3 text-left text-sm cursor-pointer transition-colors ${
                                    selectedCompanyId === company._id
                                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                                      : "border-gray-200 text-blue-800 hover:bg-gray-50"
                                  }`}
                                >
                                  {company.companyName}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Right: Sub-technicians */}
                          <div className="w-1/2 overflow-y-auto px-4 pr-6 py-3">
                            {!selectedCompanyId ? (
                              <p className="py-12 text-center text-sm text-gray-400">Select a company to view technicians</p>
                            ) : loadingSubTechs ? (
                              <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
                              </div>
                            ) : subTechnicians.length === 0 ? (
                              <p className="py-12 text-center text-sm text-gray-400">No technicians found for this company</p>
                            ) : (
                              <>
                                <p className="mb-3 text-sm font-medium text-gray-700">Technicians</p>
                                <div className="space-y-1">
                                  {subTechnicians.map((tech) => {
                                    const isSelected = selectedTechIds.has(tech._id);
                                    const initials = tech.companyName
                                      .split(" ")
                                      .map((w) => w[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2);
                                    return (
                                      <div
                                        key={tech._id}
                                        className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50"
                                      >
                                        <div className="flex min-w-0 items-center gap-3">
                                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DFF6FF] text-[11px] font-bold text-blue-700">
                                            {initials}
                                          </div>
                                          <span className="truncate text-sm text-gray-900">{tech.companyName}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => toggleTechSelection(tech._id)}
                                          className="shrink-0 cursor-pointer"
                                        >
                                          {isSelected ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#3B82F6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rounded-full">
                                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                              <polyline points="22 4 12 14.01 9 11.01" stroke="white" strokeWidth="2" />
                                            </svg>
                                          ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                              <circle cx="12" cy="12" r="10" />
                                              <line x1="12" y1="8" x2="12" y2="16" />
                                              <line x1="8" y1="12" x2="16" y2="12" />
                                            </svg>
                                          )}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      <hr />
                      <div className="flex items-center gap-3 px-6 pb-5">
                        <Button
                          className="bg-cyan-500 hover:bg-cyan-600 text-white"
                          onClick={handleSaveTechnicians}
                          disabled={addingTech || selectedTechIds.size === 0}
                        >
                          {addingTech && <Loader2 className="h-4 w-4 animate-spin" />}
                          Save Technicians
                        </Button>
                        <button
                          onClick={() => setTechDialogOpen(false)}
                          className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  </div>
                </div>

                <div className="mt-3">
                  {technicians.length === 0 ? (
                    <p className="text-[13px] text-gray-500">
                      <button onClick={openTechDialog} className="text-[#00AEEF] underline cursor-pointer">Click here</button>
                      {" "}to add a technician
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {technicians.map((tech) => {
                        const name = tech.technicianId?.companyName || "Unknown";
                        const phone = tech.technicianId?.phone || "";
                        const email = tech.technicianId?.email || "";
                        return (
                          <div key={tech._id} className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[12px] font-medium text-gray-600">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-1 items-center gap-8 text-[13px]">
                              <span className="min-w-[120px] font-medium text-gray-900">{name}</span>
                              {phone && <span className="text-gray-500">{phone}</span>}
                              {email && <span className="text-gray-500">{email}</span>}
                            </div>
                            <button className="text-gray-300 hover:text-red-500">
                              <TrashIcon />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <hr className="my-5 border-gray-200" />

              {/* Technician Notes */}
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Technician Notes</h3>
                <p className="mt-1 text-[13px] text-gray-500">
                  Technician notes are shown in the Job Card email and Job Card URL which is seen by Technicians.
                </p>
                {detail?.technicianBriefing ? (
                  <>
                    <p className="mt-3 text-[13px] text-gray-700 whitespace-pre-wrap">{detail.technicianBriefing}</p>
                    <p className="mt-3 text-[13px]">
                      <button onClick={openBriefingDialog} className="text-[#00AEEF] underline cursor-pointer">
                        Edit Technician Notes
                      </button>
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-[13px] text-gray-500">
                    <button onClick={openBriefingDialog} className="text-[#00AEEF] underline cursor-pointer">Click here</button>
                    {" "}to add a Technician Notes.
                  </p>
                )}
              </div>

              {/* Technician Briefing Dialog */}
              <Dialog open={briefingDialogOpen} onOpenChange={setBriefingDialogOpen}>
                <DialogContent className="max-w-xl rounded-[10px] p-0 gap-0">
                  <DialogHeader className="px-6 pt-5 pb-4">
                    <DialogTitle className="text-lg font-bold">Edit Technician Briefing</DialogTitle>
                  </DialogHeader>
                  <DialogDescription className="sr-only">Edit technician briefing notes</DialogDescription>
                  <hr className="border-gray-200" />
                  <div className="px-6 py-5">
                    <div className="flex gap-4">
                      <label className="w-[140px] shrink-0 text-[13px] text-gray-700 pt-2">Technician Briefing</label>
                      <Textarea
                        value={briefingText}
                        onChange={(e) => setBriefingText(e.target.value)}
                        rows={5}
                        className="flex-1 rounded-[10px] text-[13px]"
                      />
                    </div>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex items-center gap-3 px-6 py-4">
                    <Button
                      onClick={handleSaveBriefing}
                      disabled={briefingSaving}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]"
                    >
                      {briefingSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Update
                    </Button>
                    <button
                      onClick={() => setBriefingDialogOpen(false)}
                      className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </DialogContent>
              </Dialog>

              <hr className="my-5 border-gray-200" />

              <AttachmentsSection
                attachments={attachments}
                apiBaseUrl={`/api/job-cards/${id}`}
                uploadFolder="job-card-attachments"
                onRefresh={fetchJobCard}
              >
                <hr className="my-5 border-gray-200" />
                {/* Checklist Uploads */}
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Checklist Uploads</h3>
                  <p className="mt-2 text-[13px] text-gray-400">No checklist uploads.</p>
                </div>
              </AttachmentsSection>
            </div>

            {/* Comments / Updates */}
            <CommentsSection
              comments={comments}
              apiBaseUrl={`/api/job-cards/${id}`}
              onRefresh={fetchJobCard}
            />

            {/* Ticket History */}
            <TicketHistorySection
              currentId={id}
              assetId={jobCard.clientAssetId?._id}
              siteId={jobCard.clientSiteId?._id}
              apiListUrl="/api/job-cards"
              detailPathPrefix="/job-cards"
              statusLabels={JOB_CARD_STATUS_LABELS}
              statusField="jobCardStatus"
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-1 space-y-5">
            {/* Support Tickets */}
            <div className="rounded-[10px] border border-gray-200 bg-white p-10">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-semibold text-gray-900">Support Tickets</h4>
                <button className="text-gray-400 hover:text-gray-600">
                  <Link2 className="h-4 w-4" />
                </button>
              </div>

              {jobCard.supportTicketId && typeof jobCard.supportTicketId === "object" ? (
                <div className="mt-3">
                  <Link
                    href={`/support-tickets/${(jobCard.supportTicketId as any)._id}`}
                    className="text-[13px] text-[#00AEEF] underline"
                  >
                    #{(jobCard.supportTicketId as any).ticketNo}
                  </Link>
                </div>
              ) : (
                <p className="mt-3 text-[13px] text-gray-400">
                  There is no linked Support Ticket for this Job Card.
                </p>
              )}
            </div>

            {/* Job Date & Job Progress - Dark Card */}
            <div className="rounded-[10px] bg-[#1E293B] p-10">
              {/* Job Date */}
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold text-white">Job Date</h4>
                  <button onClick={openJobDateDialog} className="text-gray-400 hover:text-gray-200 cursor-pointer">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {jobCard.jobDate ? (
                  <div className="mt-2">
                    <p className="text-[22px] font-bold text-white">
                      {formatJobDate(jobCard.jobDate)}
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium text-[#00AEEF]">
                      {formatJobTime(jobCard.jobDate)}
                    </p>
                    {jobCard.multiDayJob === 1 && jobCard.jobEndDate && (
                      <p className="mt-1 text-[13px] text-gray-400">
                        to {formatJobDate(jobCard.jobEndDate)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-[13px] text-gray-400">
                    <button onClick={openJobDateDialog} className="text-[#00AEEF] underline cursor-pointer">Click here</button>
                    {" "}to set the job date
                  </p>
                )}
              </div>

              {/* Job Date Dialog */}
              <Dialog open={jobDateDialogOpen} onOpenChange={setJobDateDialogOpen}>
                <DialogContent className="max-w-xl rounded-[10px] p-0 gap-0">
                  <DialogHeader className="px-6 pt-5 pb-4">
                    <DialogTitle className="text-lg font-bold">Job Date</DialogTitle>
                  </DialogHeader>
                  <DialogDescription className="sr-only">Set job date and time</DialogDescription>
                  <hr className="border-gray-200" />
                  <div className="px-6 py-5 space-y-5">
                    {/* Multi Day Job */}
                    <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={jobDateMultiDay}
                        onChange={(e) => setJobDateMultiDay(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Multi Day job
                    </label>

                    {/* Start Date */}
                    <div className="flex items-center gap-4">
                      <label className="w-[120px] shrink-0 text-[13px] text-gray-700">Start Date</label>
                      <input
                        type="date"
                        value={jobDateStart}
                        onChange={(e) => setJobDateStart(e.target.value)}
                        className="flex-1 rounded-[10px] border border-gray-200 px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* End Date (multi-day only) */}
                    {jobDateMultiDay && (
                      <div className="flex items-center gap-4">
                        <label className="w-[120px] shrink-0 text-[13px] text-gray-700">End Date</label>
                        <input
                          type="date"
                          value={jobDateEnd}
                          onChange={(e) => setJobDateEnd(e.target.value)}
                          className="flex-1 rounded-[10px] border border-gray-200 px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}

                    {/* Job Time */}
                    <div className="flex items-center gap-4">
                      <label className="w-[120px] shrink-0 text-[13px] text-gray-700">Job Time</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={jobDateHour}
                          onChange={(e) => setJobDateHour(e.target.value)}
                          className="rounded-[10px] border border-gray-200 px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-cyan-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={String(h)}>{h}</option>
                          ))}
                        </select>
                        <select
                          value={jobDateMinute}
                          onChange={(e) => setJobDateMinute(e.target.value)}
                          className="rounded-[10px] border border-gray-200 px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-cyan-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                            <option key={m} value={String(m).padStart(2, "0")}>{String(m).padStart(2, "0")}</option>
                          ))}
                        </select>
                        <select
                          value={jobDateAmPm}
                          onChange={(e) => setJobDateAmPm(e.target.value)}
                          className="rounded-[10px] border border-gray-200 px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-cyan-500"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex items-center gap-3 px-6 py-4">
                    <Button
                      onClick={handleSaveJobDate}
                      disabled={jobDateSaving || !jobDateStart}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]"
                    >
                      {jobDateSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Update
                    </Button>
                    <button
                      onClick={() => setJobDateDialogOpen(false)}
                      className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Divider */}
              <hr className="my-5 border-gray-600" />

              {/* Job Progress */}
              <div>
                <h4 className="mb-4 text-[14px] font-bold text-white italic">Job Progress</h4>

                <div className="space-y-[10px]">
                  {JOB_PROGRESS_STEPS.map((step, idx) => {
                    const isCompleted = idx < progressStep;
                    return (
                      <div
                        key={step.label}
                        onClick={() => handleProgressClick(idx)}
                        className="w-full cursor-pointer rounded-[10px] px-5 py-[7px] text-[14px] leading-[31px] text-white transition-colors"
                        style={{
                          backgroundColor: isCompleted ? step.color : "#30373E",
                          border: isCompleted ? `2px solid ${step.color}` : "2px solid #3E4650",
                        }}
                      >
                        {step.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checklists Tab */}
      {activeTab === "checklists" && (
        <div className="space-y-4">
          {clientAssets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[14px] text-gray-500">No assets with checklists.</p>
            </div>
          ) : (
            clientAssets.map((asset) => {
              const name = asset.clientAssetId?.machineName || "Unknown Asset";
              const items = asset.checklistItems || [];

              return (
                <div key={asset._id} className="rounded-[10px] border border-gray-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-gray-900">{name}</h3>
                    <Badge variant="outline" className="text-[12px]">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {items.length > 0 ? (
                    <Table className="mt-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Details</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Response</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item: any) => (
                          <TableRow key={item._id}>
                            <TableCell className="text-[13px]">{item.details}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[11px]">
                                {item.checklistItemType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[13px] text-gray-600">
                              {item.responseType1 || item.responseType2 || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="mt-3 text-[13px] text-gray-400">No checklist items.</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Job Card Log Tab */}
      {activeTab === "job-card-log" && (
        <div className="rounded-[10px] border border-gray-200 bg-white p-10">
          <p className="text-[13px] text-gray-400">Job card log will be displayed here.</p>
        </div>
      )}

      {/* ─── Claim Job Card Dialog ──────────────────────────────────── */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Claim Ticket {jobCard.ticketNo}</DialogTitle>
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

      {/* ─── Edit Job Card Dialog ──────────────────────────────────── */}
      <AddJobCardDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchJobCard}
        editData={jobCard}
      />
    </div>
  );
}
