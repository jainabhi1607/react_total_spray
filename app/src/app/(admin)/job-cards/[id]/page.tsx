"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Upload,
  X,
} from "lucide-react";
import { PlusSquareIcon, TrashIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  formatLogDate,
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
  startDate?: string;
  contractApprove?: number;
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

// --- Checklist Constants ---

const SECTION_BREAK_TYPE = 0;

const CHECKLIST_RESPONSE_TYPES = [
  { value: 1, label: "Checkbox", color: "bg-teal-100 text-teal-800" },
  { value: 2, label: "Pass/Fail/N/A", color: "bg-orange-100 text-orange-800" },
  { value: 3, label: "Image", color: "bg-green-100 text-green-800" },
  { value: 4, label: "Comment", color: "bg-gray-200 text-gray-800" },
  { value: 5, label: "Yes/No", color: "bg-blue-100 text-blue-800" },
  { value: 6, label: "Poor/Fair/Good", color: "bg-purple-100 text-purple-800" },
  { value: 7, label: "Signature", color: "bg-amber-100 text-amber-800" },
  { value: 8, label: "Set Date & Time", color: "bg-indigo-100 text-indigo-800" },
  { value: 9, label: "Text Only - No Response", color: "bg-slate-100 text-slate-700" },
];

function getChecklistTypeLabel(type: number): string {
  if (type === SECTION_BREAK_TYPE) return "Section Break";
  return CHECKLIST_RESPONSE_TYPES.find((t) => t.value === type)?.label || "Unknown";
}

function getChecklistTypeColor(type: number): string {
  return (
    CHECKLIST_RESPONSE_TYPES.find((t) => t.value === type)?.color ||
    "bg-gray-100 text-gray-800"
  );
}

interface ChecklistItemData {
  _id: string;
  details: string;
  checklistItemType: number;
  makeResponseMandatory: number;
  orderNo: number;
  fileName?: string;
  fileSize?: string;
  fileRealName?: string;
  responseType1?: number;
  responseType2?: number;
  comments?: string;
  signature?: string;
  signatureDateTime?: string;
  setDateTime?: string;
  markAsDone?: number;
  attachments?: { _id: string; documentName?: string; fileName: string; fileSize?: number }[];
}

interface TemplateData {
  _id: string;
  title: string;
  tagIds?: string[];
}

interface TemplateTagData {
  _id: string;
  title: string;
}

// --- Image Viewer Popup ---

function ImageViewerPopup({
  images,
  initialIndex,
  onClose,
}: {
  images: { src: string; label?: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrentIndex((p) => (p > 0 ? p - 1 : images.length - 1));
      if (e.key === "ArrowRight") setCurrentIndex((p) => (p < images.length - 1 ? p + 1 : 0));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg hover:bg-gray-100 cursor-pointer text-lg font-bold"
        >
          ×
        </button>

        {/* Image */}
        <img
          src={images[currentIndex].src}
          alt={images[currentIndex].label || "Image"}
          className="max-h-[80vh] max-w-[85vw] rounded-[10px] object-contain"
        />

        {/* Label */}
        {images[currentIndex].label && (
          <p className="mt-2 text-sm text-white">{images[currentIndex].label}</p>
        )}

        {/* Navigation arrows (only if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((p) => (p > 0 ? p - 1 : images.length - 1))}
              className="absolute left-[-50px] top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg hover:bg-white cursor-pointer text-xl"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentIndex((p) => (p < images.length - 1 ? p + 1 : 0))}
              className="absolute right-[-50px] top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg hover:bg-white cursor-pointer text-xl"
            >
              ›
            </button>

            {/* Dots indicator */}
            <div className="mt-3 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 w-2 rounded-full cursor-pointer transition-colors ${
                    i === currentIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <p className="mt-1 text-[12px] text-white/70">
            {currentIndex + 1} / {images.length}
          </p>
        )}
      </div>
    </div>
  );
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

// --- Signature Pad Component ---

function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function saveSignature() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="rounded-[10px] border border-gray-300 bg-white cursor-crosshair"
        style={{ touchAction: "none" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex gap-3 mt-2">
        <button
          onClick={saveSignature}
          disabled={!hasDrawn}
          className={`text-[12px] font-medium border border-gray-300 rounded-[10px] px-3 py-1 cursor-pointer ${
            hasDrawn ? "text-gray-700 hover:bg-gray-50" : "text-gray-300"
          }`}
        >
          Save
        </button>
        <button
          onClick={clearCanvas}
          className="text-[12px] text-gray-600 font-medium border border-gray-300 rounded-[10px] px-3 py-1 hover:bg-gray-50 cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

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

  // Reschedule recurring dialog
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    recurringPeriod: "",
    recurringRange: "",
    contractApprove: false,
  });
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [setAsRecurringMode, setSetAsRecurringMode] = useState(false);

  // Checklist tab state
  const [checklistAssetId, setChecklistAssetId] = useState<string | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemData[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);

  // Checklist - Add Template dialog
  const [addTemplateOpen, setAddTemplateOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [templateTags, setTemplateTags] = useState<TemplateTagData[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [addTemplateSaving, setAddTemplateSaving] = useState(false);

  // Checklist - Add Section Break dialog
  const [clSectionBreakOpen, setClSectionBreakOpen] = useState(false);
  const [clSectionBreakDetails, setClSectionBreakDetails] = useState("");
  const [clSectionBreakSaving, setClSectionBreakSaving] = useState(false);

  // Checklist - Add/Edit Item dialog
  const [clItemOpen, setClItemOpen] = useState(false);
  const [clItemEditId, setClItemEditId] = useState<string | null>(null);
  const [clItemDetails, setClItemDetails] = useState("");
  const [clItemType, setClItemType] = useState("");
  const [clItemMandatory, setClItemMandatory] = useState(false);
  const [clItemFile, setClItemFile] = useState<File | null>(null);
  const [clItemFileName, setClItemFileName] = useState("");
  const [clItemSaving, setClItemSaving] = useState(false);

  // Checklist - Drag and drop
  const [clDragIndex, setClDragIndex] = useState<number | null>(null);
  const [clDragOverIndex, setClDragOverIndex] = useState<number | null>(null);

  // Image viewer popup
  const [viewerImages, setViewerImages] = useState<{ src: string; label?: string }[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Job Card Log tab
  const [logEntries, setLogEntries] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const LOG_LIMIT = 10;

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
        throw new Error(json.error || "Failed to load job card");
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

  // ─── Checklist hooks (must be before early returns) ────────────────
  const fetchChecklistItems = useCallback(async (assetId: string) => {
    setChecklistLoading(true);
    try {
      const res = await fetch(`/api/job-cards/${id}/assets/${assetId}/checklist`);
      const json = await res.json();
      if (json.success) {
        setChecklistItems(json.data || []);
      }
    } catch {
      setChecklistItems([]);
    } finally {
      setChecklistLoading(false);
    }
  }, [id]);

  const jobCardClientAssets = jobCard?.clientAssets || [];

  useEffect(() => {
    if (activeTab === "checklists" && jobCardClientAssets.length > 0) {
      const stillValid = checklistAssetId && jobCardClientAssets.some((a) => a._id === checklistAssetId);
      if (!stillValid) {
        const firstId = jobCardClientAssets[0]._id;
        setChecklistAssetId(firstId);
        fetchChecklistItems(firstId);
      }
    }
  }, [activeTab, jobCardClientAssets, checklistAssetId, fetchChecklistItems]);

  // --- Job Card Log ---
  const fetchLogs = useCallback(async (page: number) => {
    setLogLoading(true);
    try {
      const res = await fetch(`/api/job-cards/${id}/logs?page=${page}&limit=${LOG_LIMIT}`);
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setLogEntries(d.data || []);
        setLogTotal(d.total || 0);
        setLogTotalPages(d.totalPages || 1);
        setLogPage(d.page || 1);
      }
    } catch {
      setLogEntries([]);
    } finally {
      setLogLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === "job-card-log") {
      fetchLogs(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  async function handleReschedule() {
    if (!rescheduleForm.startDate || !rescheduleForm.recurringPeriod || !rescheduleForm.recurringRange) {
      alert("Please fill in all fields.");
      return;
    }
    setRescheduleSubmitting(true);
    try {
      const start = new Date(rescheduleForm.startDate);
      const period = Number(rescheduleForm.recurringPeriod);
      const range = Number(rescheduleForm.recurringRange);
      const next = new Date(start);
      if (period === 1) next.setFullYear(next.getFullYear() + range);
      else if (period === 2) next.setMonth(next.getMonth() + range);
      else if (period === 3) next.setDate(next.getDate() + range * 7);

      const recurringData = {
        startDate: start.toISOString(),
        recurringPeriod: period,
        recurringRange: range,
        contractApprove: rescheduleForm.contractApprove ? 1 : 0,
        nextRecurringDate: next.toISOString(),
      };

      if (setAsRecurringMode && jobCard) {
        // Create a new recurring job card with same details as this job
        const createRes = await fetch("/api/job-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: jobCard.clientId?._id,
            clientSiteId: jobCard.clientSiteId?._id,
            clientAssetId: jobCard.clientAssetId?._id,
            clientContactId: jobCard.clientContactId?._id,
            titleId: jobCard.titleId?._id,
            jobCardType: jobCard.jobCardType?._id,
            warranty: jobCard.warranty,
            recurringJob: 1,
            ...recurringData,
          }),
        });
        const createJson = await createRes.json();
        if (!createRes.ok || !createJson.success) throw new Error(createJson.error || "Failed");
        // Set nextRecurringDate and contractApprove on the new job
        await fetch(`/api/job-cards/${createJson.data._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nextRecurringDate: recurringData.nextRecurringDate,
            contractApprove: recurringData.contractApprove,
          }),
        });
        setRescheduleOpen(false);
        setSetAsRecurringMode(false);
        alert("Recurring job created successfully.");
        return;
      }

      // Normal reschedule — update existing recurring job
      const res = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recurringData),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setRescheduleOpen(false);
        fetchJobCard();
      } else {
        alert(json.error || "Failed to reschedule.");
      }
    } catch {
      alert("Failed. Please try again.");
    } finally {
      setRescheduleSubmitting(false);
      setSetAsRecurringMode(false);
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

  // Save a single item's response field
  async function saveItemResponse(itemId: string, data: Record<string, any>) {
    if (!checklistAssetId) return;
    const assetId = checklistAssetId;
    setChecklistItems((prev) =>
      prev.map((item) => (item._id === itemId ? { ...item, ...data } : item))
    );
    try {
      await fetch(
        `/api/job-cards/${id}/assets/${assetId}/checklist/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
    } catch {
      fetchChecklistItems(assetId);
    }
  }

  // Upload image for checklist item (type 3)
  async function handleChecklistImageUpload(itemId: string, files: FileList) {
    if (!checklistAssetId) return;
    const assetId = checklistAssetId;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "checklist-attachments");
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadJson = await uploadRes.json();
        if (uploadRes.ok && uploadJson.success) {
          await fetch(
            `/api/job-cards/${id}/assets/${assetId}/checklist/${itemId}/attachments`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                documentName: file.name,
                fileName: uploadJson.data.fileName,
                fileSize: file.size,
              }),
            }
          );
        }
      } catch {
        // silent
      }
    }
    fetchChecklistItems(assetId);
  }

  // Delete checklist item attachment
  async function handleDeleteChecklistAttachment(itemId: string, attachmentId: string) {
    if (!checklistAssetId) return;
    const assetId = checklistAssetId;
    try {
      await fetch(
        `/api/job-cards/${id}/assets/${assetId}/checklist/${itemId}/attachments?attachmentId=${attachmentId}`,
        { method: "DELETE" }
      );
      fetchChecklistItems(assetId);
    } catch {
      // silent
    }
  }

  function handleSelectChecklistAsset(assetId: string) {
    setChecklistAssetId(assetId);
    fetchChecklistItems(assetId);
  }

  // Navigate from overview checklist link to checklist tab
  function navigateToChecklist(assetId: string) {
    setChecklistAssetId(assetId);
    setActiveTab("checklists");
    fetchChecklistItems(assetId);
  }

  // Add Template dialog
  async function openAddTemplateDialog() {
    setAddTemplateOpen(true);
    setSelectedTemplateId(null);
    try {
      const [templatesRes, tagsRes] = await Promise.all([
        fetch("/api/checklists?limit=200"),
        fetch("/api/checklists/tags"),
      ]);
      const templatesJson = await templatesRes.json();
      const tagsJson = await tagsRes.json();
      if (templatesJson.success) {
        const raw = templatesJson.data;
        setTemplates(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
      }
      const tags = tagsJson.success ? (tagsJson.data || []) : [];
      setTemplateTags(tags);
      // Select all tags by default
      setSelectedTagIds(new Set(tags.map((t: TemplateTagData) => t._id)));
    } catch {
      setTemplates([]);
      setTemplateTags([]);
      setSelectedTagIds(new Set());
    }
  }

  function toggleTagFilter(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  async function handleAddTemplate() {
    if (!selectedTemplateId || !checklistAssetId) return;
    setAddTemplateSaving(true);
    try {
      const res = await fetch(
        `/api/job-cards/${id}/assets/${checklistAssetId}/checklist/add-template`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: selectedTemplateId }),
        }
      );
      const json = await res.json();
      setAddTemplateOpen(false);
      if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
        fetchChecklistItems(checklistAssetId);
        fetchJobCard();
      }
    } catch {
      setAddTemplateOpen(false);
    } finally {
      setAddTemplateSaving(false);
    }
  }

  // Add Section Break
  async function handleAddSectionBreak() {
    if (!clSectionBreakDetails.trim() || !checklistAssetId) return;
    setClSectionBreakSaving(true);
    try {
      const maxOrder = Math.max(0, ...checklistItems.map((i) => i.orderNo || 0));
      const res = await fetch(
        `/api/job-cards/${id}/assets/${checklistAssetId}/checklist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            details: clSectionBreakDetails.trim(),
            checklistItemType: SECTION_BREAK_TYPE,
            makeResponseMandatory: 0,
            orderNo: maxOrder + 1,
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setClSectionBreakOpen(false);
        setClSectionBreakDetails("");
        fetchChecklistItems(checklistAssetId);
        fetchJobCard();
      }
    } catch {
      // silent
    } finally {
      setClSectionBreakSaving(false);
    }
  }

  // Add/Edit Checklist Item
  function openAddItemDialog() {
    setClItemEditId(null);
    setClItemDetails("");
    setClItemType("1");
    setClItemMandatory(false);
    setClItemFile(null);
    setClItemFileName("");
    setClItemOpen(true);
  }

  function openEditItemDialog(item: ChecklistItemData) {
    const isSB = item.checklistItemType === SECTION_BREAK_TYPE;
    if (isSB) {
      // Edit section break inline via section break dialog
      setClSectionBreakDetails(item.details || "");
      setClItemEditId(item._id);
      setClSectionBreakOpen(true);
      return;
    }
    setClItemEditId(item._id);
    setClItemDetails(item.details || "");
    setClItemType(String(item.checklistItemType));
    setClItemMandatory(item.makeResponseMandatory === 1);
    setClItemFileName(item.fileName || "");
    setClItemFile(null);
    setClItemOpen(true);
  }

  async function handleSaveChecklistItem() {
    if (!clItemDetails.trim() || !clItemType || !checklistAssetId) return;
    const assetId = checklistAssetId;
    setClItemSaving(true);
    try {
      // Upload file first if selected
      let uploadedFileName = clItemFileName || "";
      let uploadedFileSize = "";
      if (clItemFile) {
        const formData = new FormData();
        formData.append("file", clItemFile);
        formData.append("folder", "checklist-attachments");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadJson = await uploadRes.json();
        if (uploadRes.ok && uploadJson.success) {
          uploadedFileName = uploadJson.data.fileName;
          uploadedFileSize = String(clItemFile.size);
        }
      }

      if (clItemEditId) {
        // Update existing item
        const res = await fetch(
          `/api/job-cards/${id}/assets/${assetId}/checklist/${clItemEditId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              details: clItemDetails.trim(),
              checklistItemType: parseInt(clItemType),
              makeResponseMandatory: clItemMandatory ? 1 : 0,
              fileName: uploadedFileName,
              fileSize: uploadedFileSize || undefined,
              fileRealName: clItemFile ? clItemFile.name : undefined,
            }),
          }
        );
        const json = await res.json();
        if (json.success) {
          setClItemOpen(false);
          fetchChecklistItems(assetId);
        }
      } else {
        // Create new item
        const maxOrder = Math.max(0, ...checklistItems.map((i) => i.orderNo || 0));
        const res = await fetch(
          `/api/job-cards/${id}/assets/${assetId}/checklist`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              details: clItemDetails.trim(),
              checklistItemType: parseInt(clItemType),
              makeResponseMandatory: clItemMandatory ? 1 : 0,
              orderNo: maxOrder + 1,
              fileName: uploadedFileName,
              fileSize: uploadedFileSize,
              fileRealName: clItemFile ? clItemFile.name : "",
            }),
          }
        );
        const json = await res.json();
        if (json.success) {
          setClItemOpen(false);
          fetchChecklistItems(assetId);
          fetchJobCard();
        }
      }
    } catch {
      // silent
    } finally {
      setClItemSaving(false);
    }
  }

  // Edit section break (uses same dialog but with edit ID)
  async function handleEditSectionBreak() {
    if (!clSectionBreakDetails.trim() || !checklistAssetId) return;
    setClSectionBreakSaving(true);
    try {
      if (clItemEditId) {
        // Update existing section break
        const res = await fetch(
          `/api/job-cards/${id}/assets/${checklistAssetId}/checklist/${clItemEditId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              details: clSectionBreakDetails.trim(),
              checklistItemType: SECTION_BREAK_TYPE,
              makeResponseMandatory: 0,
            }),
          }
        );
        const json = await res.json();
        if (json.success) {
          setClSectionBreakOpen(false);
          setClItemEditId(null);
          fetchChecklistItems(checklistAssetId);
        }
      } else {
        await handleAddSectionBreak();
      }
    } catch {
      // silent
    } finally {
      setClSectionBreakSaving(false);
    }
  }

  // Delete checklist item
  async function handleDeleteChecklistItem(itemId: string) {
    if (!confirm("Delete this item?") || !checklistAssetId) return;
    const assetId = checklistAssetId;
    try {
      const res = await fetch(
        `/api/job-cards/${id}/assets/${assetId}/checklist/${itemId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || "Failed to delete item.");
        return;
      }
      fetchChecklistItems(assetId);
      fetchJobCard();
    } catch {
      alert("Failed to delete item.");
    }
  }

  // Clear all checklist items
  async function handleClearAllChecklist() {
    if (!confirm("Clear all checklist items for this asset?") || !checklistAssetId) return;
    const assetId = checklistAssetId;
    let failCount = 0;
    for (const item of checklistItems) {
      try {
        await fetch(
          `/api/job-cards/${id}/assets/${assetId}/checklist/${item._id}`,
          { method: "DELETE" }
        );
      } catch {
        failCount++;
      }
    }
    if (failCount > 0) {
      alert(`${failCount} item(s) could not be deleted.`);
    }
    fetchChecklistItems(assetId);
    fetchJobCard();
  }

  // Drag and drop reorder
  async function handleChecklistDrop(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || !checklistAssetId) return;
    const assetId = checklistAssetId;
    const snapshot = [...checklistItems];
    const sorted = [...checklistItems].sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0));
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);

    const reordered = sorted.map((item, i) => ({ ...item, orderNo: i + 1 }));

    // Optimistic update
    setChecklistItems(reordered);

    try {
      await fetch(
        `/api/job-cards/${id}/assets/${assetId}/checklist/reorder`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: reordered.map((item) => ({ id: item._id, orderNo: item.orderNo })),
          }),
        }
      );
    } catch {
      setChecklistItems(snapshot);
    }
    setClDragIndex(null);
    setClDragOverIndex(null);
  }

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
          <Link href={jobCard.recurringJob === 1 ? "/job-cards?tab=recurring" : "/job-cards"}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-800 text-gray-800 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </div>
          </Link>
          <div>
            <h1 className="text-[26px] font-bold text-gray-900">
              {jobCard.recurringJob === 1
                ? `Recurring JC - ${jobCard.clientId?.companyName || ""} - ${jobCard.clientSiteId?.siteName || ""}`
                : `Job Card #${jobCard.ticketNo}`}
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
          {jobCard.recurringJob === 1 ? (
            <button
              onClick={() => {
                setRescheduleForm({
                  startDate: jobCard.startDate ? new Date(jobCard.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                  recurringPeriod: jobCard.recurringPeriod ? String(jobCard.recurringPeriod) : "",
                  recurringRange: jobCard.recurringRange ? String(jobCard.recurringRange) : "",
                  contractApprove: jobCard.contractApprove === 1,
                });
                setRescheduleOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-white cursor-pointer"
              style={{ border: "1px solid #D6E1E9", padding: "8px 15px", borderRadius: 5, color: "#272D34", fontSize: 12, fontWeight: "normal", lineHeight: "13px" }}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              {jobCard.recurringPeriod && jobCard.recurringRange && jobCard.startDate ? "Reschedule job" : "Add recurring details"}
            </button>
          ) : (
            <button
              onClick={() => {
                setRescheduleForm({
                  startDate: new Date().toISOString().slice(0, 10),
                  recurringPeriod: "",
                  recurringRange: "",
                  contractApprove: false,
                });
                setSetAsRecurringMode(true);
                setRescheduleOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-white cursor-pointer"
              style={{ border: "1px solid #D6E1E9", padding: "8px 15px", borderRadius: 5, color: "#272D34", fontSize: 12, fontWeight: "normal", lineHeight: "13px" }}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Set as recurring job
            </button>
          )}
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
                      const totalItems = asset.checklistItems?.filter(
                        (i: any) => i.checklistItemType !== 0 && i.checklistItemType !== 9
                      ).length || 0;
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
                          <button
                            onClick={() => navigateToChecklist(asset._id)}
                            className="text-[12px] text-[#00AEEF] underline cursor-pointer"
                          >
                            Checklist {completedItems}/{totalItems}
                          </button>
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
      {activeTab === "checklists" && (() => {
        const sortedChecklistItems = [...checklistItems].sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0));
        let clItemCounter = 0;

        return (
          <div>
            {clientAssets.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[14px] text-gray-500">No assets with checklists.</p>
              </div>
            ) : (
              <>
                {/* Asset tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {clientAssets.map((asset) => {
                    const name = asset.clientAssetId?.machineName || "Unknown";
                    const isActive = checklistAssetId === asset._id;
                    return (
                      <button
                        key={asset._id}
                        onClick={() => handleSelectChecklistAsset(asset._id)}
                        className={`rounded-full px-5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[#00AEEF] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>

                {/* Selected asset name + action buttons */}
                {checklistAssetId && (() => {
                  const selectedAsset = clientAssets.find((a) => a._id === checklistAssetId);
                  const assetName = selectedAsset?.clientAssetId?.machineName || "Unknown";
                  return (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[15px] font-semibold text-[#00AEEF]">{assetName}</h3>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleClearAllChecklist}
                          className="rounded-[10px] border border-gray-300 px-4 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                          + Clear All
                        </button>
                        <button
                          onClick={openAddTemplateDialog}
                          className="rounded-[10px] border border-gray-300 px-4 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                          + Add template
                        </button>
                        <button
                          onClick={() => {
                            setClItemEditId(null);
                            setClSectionBreakDetails("");
                            setClSectionBreakOpen(true);
                          }}
                          className="rounded-[10px] border border-gray-300 px-4 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                          + Add section break
                        </button>
                        <button
                          onClick={openAddItemDialog}
                          className="rounded-[10px] border border-gray-300 px-4 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                          + Add item
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Checklist items list */}
                {checklistLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                  </div>
                ) : sortedChecklistItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-[13px] text-gray-400">No checklist items. Add a template or create items manually.</p>
                  </div>
                ) : (
                  <div className="space-y-[10px]">
                    {sortedChecklistItems.map((item, index) => {
                      const isSectionBreak = item.checklistItemType === SECTION_BREAK_TYPE;
                      if (!isSectionBreak) clItemCounter++;
                      const displayNum = clItemCounter;

                      return (
                        <div
                          key={item._id}
                          draggable
                          onDragStart={() => setClDragIndex(index)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setClDragOverIndex(index);
                          }}
                          onDragEnd={() => {
                            setClDragIndex(null);
                            setClDragOverIndex(null);
                          }}
                          onDrop={() => {
                            if (clDragIndex !== null) handleChecklistDrop(clDragIndex, index);
                          }}
                          style={{ padding: "27px 15px 27px 35px", lineHeight: "30px" }}
                          className={`flex items-start gap-3 rounded-[10px] border border-[#d0dfe6] transition-all ${
                            isSectionBreak
                              ? "!bg-[#2E3E4E] !text-white !border-[#2E3E4E]"
                              : "bg-white hover:bg-gray-50"
                          } ${
                            clDragOverIndex === index && clDragIndex !== index
                              ? "border-cyan-400 shadow-sm"
                              : ""
                          } ${clDragIndex === index ? "opacity-50" : ""}`}
                        >
                          {/* Drag handle */}
                          <div className="shrink-0 cursor-grab active:cursor-grabbing mt-0.5">
                            <img
                              src="/move.svg"
                              alt="Move"
                              className={`h-5 w-5 ${isSectionBreak ? "opacity-80" : "opacity-40"}`}
                            />
                          </div>

                          {isSectionBreak ? (
                            <>
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-white">{item.details}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="shrink-0 text-sm font-medium text-gray-400 mt-0.5">
                                {displayNum}.
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">{item.details}</span>
                                </div>

                                {/* Response type UI */}
                                <div className="mt-2">
                                  {/* Type 1: Checkbox - COMPLETED toggle */}
                                  {item.checklistItemType === 1 && (
                                    <button
                                      onClick={() => saveItemResponse(item._id, {
                                        responseType1: item.responseType1 === 1 ? 0 : 1,
                                      })}
                                      className={`rounded-[10px] px-4 py-1 text-[12px] font-medium cursor-pointer transition-colors ${
                                        item.responseType1 === 1
                                          ? "bg-[#00AEEF] text-white"
                                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                      }`}
                                    >
                                      COMPLETED
                                    </button>
                                  )}

                                  {/* Type 2: Pass/Fail/N/A - radio style */}
                                  {item.checklistItemType === 2 && (
                                    <div className="flex gap-2">
                                      {[{ label: "PASS", val: 1 }, { label: "FAIL", val: 2 }, { label: "N/A", val: 3 }].map((opt) => (
                                        <button
                                          key={opt.val}
                                          onClick={() => saveItemResponse(item._id, {
                                            responseType2: item.responseType2 === opt.val ? 0 : opt.val,
                                          })}
                                          className={`rounded-[10px] px-4 py-1 text-[12px] font-medium cursor-pointer transition-colors ${
                                            item.responseType2 === opt.val
                                              ? "bg-[#00AEEF] text-white"
                                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Type 3: Image - multiple file upload */}
                                  {item.checklistItemType === 3 && (
                                    <div>
                                      <label className="inline-flex items-center gap-2 rounded-[10px] border border-gray-300 px-4 py-1.5 text-[12px] text-gray-600 cursor-pointer hover:bg-gray-50">
                                        Choose Files
                                        <input
                                          type="file"
                                          accept="image/*"
                                          multiple
                                          className="hidden"
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                              handleChecklistImageUpload(item._id, e.target.files);
                                              e.target.value = "";
                                            }
                                          }}
                                        />
                                      </label>
                                      {(item.attachments || []).length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {(item.attachments || []).map((att, attIdx) => (
                                            <div key={att._id} className="relative group">
                                              <img
                                                src={`/uploads/checklist-attachments/${att.fileName}`}
                                                alt={att.documentName || att.fileName}
                                                className="h-16 w-16 object-cover rounded-[10px] border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                  const allImages = (item.attachments || []).map((a) => ({
                                                    src: `/uploads/checklist-attachments/${a.fileName}`,
                                                    label: a.documentName || a.fileName,
                                                  }));
                                                  setViewerImages(allImages);
                                                  setViewerIndex(attIdx);
                                                  setViewerOpen(true);
                                                }}
                                              />
                                              <button
                                                onClick={() => handleDeleteChecklistAttachment(item._id, att._id)}
                                                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] cursor-pointer"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Type 4: Comment - textarea */}
                                  {item.checklistItemType === 4 && (
                                    <Textarea
                                      value={item.comments || ""}
                                      placeholder="Enter comment..."
                                      className="max-w-md text-[13px] rounded-[10px] min-h-[60px]"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setChecklistItems((prev) =>
                                          prev.map((it) => it._id === item._id ? { ...it, comments: val } : it)
                                        );
                                      }}
                                      onBlur={(e) => saveItemResponse(item._id, { comments: e.target.value })}
                                    />
                                  )}

                                  {/* Type 5: Yes/No - radio style */}
                                  {item.checklistItemType === 5 && (
                                    <div className="flex gap-2">
                                      {[{ label: "YES", val: 1 }, { label: "NO", val: 2 }].map((opt) => (
                                        <button
                                          key={opt.val}
                                          onClick={() => saveItemResponse(item._id, {
                                            responseType1: item.responseType1 === opt.val ? 0 : opt.val,
                                          })}
                                          className={`rounded-[10px] px-4 py-1 text-[12px] font-medium cursor-pointer transition-colors ${
                                            item.responseType1 === opt.val
                                              ? "bg-[#00AEEF] text-white"
                                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Type 6: Poor/Fair/Good - radio style */}
                                  {item.checklistItemType === 6 && (
                                    <div className="flex gap-2">
                                      {[{ label: "POOR", val: 1 }, { label: "FAIR", val: 2 }, { label: "GOOD", val: 3 }].map((opt) => (
                                        <button
                                          key={opt.val}
                                          onClick={() => saveItemResponse(item._id, {
                                            responseType2: item.responseType2 === opt.val ? 0 : opt.val,
                                          })}
                                          className={`rounded-[10px] px-4 py-1 text-[12px] font-medium cursor-pointer transition-colors ${
                                            item.responseType2 === opt.val
                                              ? "bg-[#00AEEF] text-white"
                                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Type 7: Signature - canvas pad */}
                                  {item.checklistItemType === 7 && (
                                    <div>
                                      {item.signature ? (
                                        <div>
                                          <img
                                            src={item.signature}
                                            alt="Signature"
                                            className="rounded-[10px] border border-gray-300 h-[100px] bg-white"
                                          />
                                          <div className="flex gap-3 mt-2">
                                            <button
                                              onClick={() => saveItemResponse(item._id, { signature: "", signatureDateTime: null })}
                                              className="text-[12px] text-gray-600 font-medium border border-gray-300 rounded-[10px] px-3 py-1 hover:bg-gray-50 cursor-pointer"
                                            >
                                              Clear
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <SignaturePad
                                          onSave={(dataUrl) => saveItemResponse(item._id, {
                                            signature: dataUrl,
                                            signatureDateTime: new Date().toISOString(),
                                          })}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Type 8: Set Date & Time */}
                                  {item.checklistItemType === 8 && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        onClick={() => saveItemResponse(item._id, {
                                          setDateTime: new Date().toISOString(),
                                        })}
                                        className="text-[12px] text-[#00AEEF] font-medium cursor-pointer hover:underline"
                                      >
                                        SET CURRENT TIME
                                      </button>
                                      <input
                                        type="datetime-local"
                                        value={item.setDateTime ? new Date(item.setDateTime).toISOString().slice(0, 16) : ""}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val) saveItemResponse(item._id, { setDateTime: new Date(val).toISOString() });
                                        }}
                                        className="rounded-[10px] border border-gray-300 px-3 py-1 text-[12px] text-gray-700"
                                      />
                                      {item.setDateTime && (
                                        <span className="text-[12px] text-gray-500">
                                          {formatDateTime(item.setDateTime)}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Type 9: Text Only - No response needed */}
                                  {item.checklistItemType === 9 && null}
                                </div>
                              </div>

                              {/* Mandatory star + Reference badge */}
                              <div className="flex shrink-0 items-center gap-2">
                                {item.makeResponseMandatory === 1 && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.96641 12L5.33307 7.63333L1.89974 10.1333L0.566406 7.83333L4.36641 6L0.566406 4.13333L1.89974 1.83333L5.33307 4.33333L4.96641 0H7.59974L7.23307 4.33333L10.6664 1.83333L11.9997 4.13333L8.16641 6L11.9997 7.83333L10.6664 10.1333L7.23307 7.63333L7.59974 12H4.96641Z" fill="#00AEEF"/></svg>
                                )}
                                {item.fileName && (
                                  <button
                                    onClick={() => {
                                      setViewerImages([{ src: `/uploads/checklist-attachments/${item.fileName}`, label: item.fileRealName || item.fileName }]);
                                      setViewerIndex(0);
                                      setViewerOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-gray-300 px-3 py-1 text-[12px] text-gray-600 cursor-pointer hover:bg-gray-50"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.8333 2.5H4.16667C3.24619 2.5 2.5 3.24619 2.5 4.16667V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V4.16667C17.5 3.24619 16.7538 2.5 15.8333 2.5Z" stroke="#99A3B1" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.08325 8.3335C7.77361 8.3335 8.33325 7.77385 8.33325 7.0835C8.33325 6.39314 7.77361 5.8335 7.08325 5.8335C6.3929 5.8335 5.83325 6.39314 5.83325 7.0835C5.83325 7.77385 6.3929 8.3335 7.08325 8.3335Z" stroke="#99A3B1" strokeLinecap="round" strokeLinejoin="round"/><path d="M17.5001 12.5002L13.3334 8.3335L4.16675 17.5002" stroke="#99A3B1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    Reference
                                  </button>
                                )}
                              </div>
                            </>
                          )}

                          {/* Edit / Delete */}
                          <div className="ml-1 flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => openEditItemDialog(item)}
                              className={`rounded p-1 cursor-pointer ${
                                isSectionBreak
                                  ? "text-white hover:text-gray-200"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChecklistItem(item._id)}
                              className={`rounded p-1 cursor-pointer ${
                                isSectionBreak
                                  ? "text-white hover:text-red-200"
                                  : "text-gray-400 hover:text-red-600"
                              }`}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Job Card Log Tab */}
      {activeTab === "job-card-log" && (
        <div>
          {/* Header */}
          <h3 className="text-[15px] font-semibold text-[#00AEEF] mb-1">Job Card Log</h3>
          <p className="text-[13px] text-gray-400 mb-5">
            Job Card {jobCard.ticketNo} was created by - {formatDate(jobCard.createdAt)}
          </p>

          {logLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
            </div>
          ) : logEntries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-gray-400">No log entries yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logEntries.map((log: any) => {
                const userName = log.userId
                  ? `${log.userId.name}${log.userId.lastName ? " " + log.userId.lastName : ""}`
                  : "System";
                const logDate = log.dateTime || log.createdAt;

                return (
                  <div
                    key={log._id}
                    className="rounded-[10px] border border-gray-200 bg-white px-6 py-5"
                  >
                    <p className="text-[14px] font-semibold text-gray-900 mb-1">
                      {logDate ? formatLogDate(logDate) : ""}
                    </p>
                    <p className="text-[13px] text-gray-600">
                      {userName} - {log.task}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {logTotal > 0 && (
            <div className="flex items-center justify-end gap-3 mt-5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchLogs(logPage - 1)}
                  disabled={logPage <= 1}
                  className={`rounded-[10px] border border-gray-300 px-3 py-1 text-[13px] ${
                    logPage <= 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  &lt; Prev
                </button>
                <button
                  onClick={() => fetchLogs(logPage + 1)}
                  disabled={logPage >= logTotalPages}
                  className={`rounded-[10px] border border-gray-300 px-3 py-1 text-[13px] ${
                    logPage >= logTotalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  Next &gt;
                </button>
              </div>
              <p className="text-[12px] text-gray-500">
                Page {logPage} of {logTotalPages}, showing {logEntries.length} record(s) out of {logTotal} total
              </p>
            </div>
          )}
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

      {/* ─── Add Checklist (Template) Dialog ──────────────────────── */}
      <Dialog open={addTemplateOpen} onOpenChange={setAddTemplateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Checklist</DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="grid grid-cols-2 gap-6 py-3" style={{ minHeight: 350 }}>
            {/* Left - Tags */}
            <div>
              <h4 className="text-[14px] font-semibold text-[#00AEEF] mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {templateTags.map((tag) => {
                  const isSelected = selectedTagIds.has(tag._id);
                  return (
                    <button
                      key={tag._id}
                      onClick={() => toggleTagFilter(tag._id)}
                      className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-[#00AEEF] text-white border-[#00AEEF]"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {tag.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right - Templates */}
            <div>
              <h4 className="text-[14px] font-semibold text-[#00AEEF] mb-3">Checklist Templates</h4>
              <div className="space-y-2">
                {(() => {
                  const filtered = selectedTagIds.size === 0
                    ? []
                    : templates.filter((t) =>
                        (t.tagIds || []).some((tagId) => selectedTagIds.has(tagId))
                      );
                  return filtered.length === 0 ? (
                    <p className="py-4 text-center text-[13px] text-gray-400">No templates available</p>
                  ) : (
                    filtered.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => setSelectedTemplateId(t._id)}
                        className={`w-full text-left rounded-[10px] border px-4 py-2.5 text-[13px] transition-colors cursor-pointer ${
                          selectedTemplateId === t._id
                            ? "border-[#00AEEF] bg-cyan-50 text-gray-900"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {t.title}
                      </button>
                    ))
                  );
                })()}
              </div>
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleAddTemplate}
              disabled={!selectedTemplateId || addTemplateSaving}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {addTemplateSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Add Checklist
            </Button>
            <button
              onClick={() => setAddTemplateOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Add/Edit Section Break Dialog ──────────────────────── */}
      <Dialog open={clSectionBreakOpen} onOpenChange={(open) => {
        setClSectionBreakOpen(open);
        if (!open) setClItemEditId(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{clItemEditId ? "Edit Section Break" : "Add Section Break"}</DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-6 py-2">
            <Label className="shrink-0 text-sm text-gray-700">Details</Label>
            <Input
              value={clSectionBreakDetails}
              onChange={(e) => setClSectionBreakDetails(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && (clItemEditId ? handleEditSectionBreak() : handleAddSectionBreak())}
            />
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={clItemEditId ? handleEditSectionBreak : handleAddSectionBreak}
              disabled={clSectionBreakSaving || !clSectionBreakDetails.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {clSectionBreakSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {clItemEditId ? "Save Section Break" : "Add Section Break"}
            </Button>
            <button
              onClick={() => { setClSectionBreakOpen(false); setClItemEditId(null); }}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Add/Edit Checklist Item Dialog ──────────────────────── */}
      <Dialog open={clItemOpen} onOpenChange={setClItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{clItemEditId ? "Edit Checklist Item" : "Add Checklist Item"}</DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="space-y-4 py-3">
            {/* Details */}
            <div className="flex items-center gap-6">
              <Label className="w-28 shrink-0 text-sm text-gray-700">Details</Label>
              <Input
                value={clItemDetails}
                onChange={(e) => setClItemDetails(e.target.value)}
                autoFocus
              />
            </div>
            {/* Response Type */}
            <div className="flex items-center gap-6">
              <Label className="w-28 shrink-0 text-sm text-gray-700">Response Type</Label>
              <Select value={clItemType} onValueChange={setClItemType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select response type" />
                </SelectTrigger>
                <SelectContent>
                  {CHECKLIST_RESPONSE_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={String(rt.value)}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Make response mandatory */}
            <div className="flex items-center gap-3 pl-[7.5rem]">
              <Checkbox
                id="cl-mandatory"
                checked={clItemMandatory}
                onCheckedChange={(v) => setClItemMandatory(v === true)}
              />
              <Label htmlFor="cl-mandatory" className="text-sm text-gray-700">
                Make response mandatory
              </Label>
            </div>
            {/* Item Image */}
            <div className="flex items-center gap-6">
              <Label className="w-28 shrink-0 text-sm text-gray-700">Item Image</Label>
              <div className="flex flex-1 items-center gap-3">
                {clItemFile ? (
                  <>
                    <span className="text-sm text-gray-700">{clItemFile.name}</span>
                    <button onClick={() => setClItemFile(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : clItemFileName ? (
                  <>
                    <span className="text-sm text-gray-700">{clItemFileName}</span>
                    <button onClick={() => setClItemFileName("")} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setClItemFile(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>
            </div>
            {/* Progress bar placeholder */}
            <div className="flex items-center gap-6">
              <Label className="w-28 shrink-0 text-sm text-gray-700">Progress</Label>
              <div className="flex-1 h-1 bg-gray-200 rounded-full">
                <div className="h-1 bg-cyan-500 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleSaveChecklistItem}
              disabled={clItemSaving || !clItemDetails.trim() || !clItemType}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {clItemSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {clItemEditId ? "Update Checklist Item" : "Add Checklist Item"}
            </Button>
            <button
              onClick={() => setClItemOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Reschedule Recurring Job Dialog ─────────────────────── */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{setAsRecurringMode ? "Set as Recurring Job" : "Reschedule Recurring Job"}</DialogTitle>
          </DialogHeader>
          <hr />
          <p className="text-sm text-gray-500 px-2">
            {setAsRecurringMode
              ? "You are about to create a recurring job from this job card. Please set the Recurring Period and Start Date below"
              : "You are about to reschedule this recurring job. Please set the new Recurring Period and Start Date below"}
          </p>
          <div className="space-y-5 px-2">
            {/* Start Date */}
            <div className="flex items-center gap-4">
              <label className="w-[140px] shrink-0 text-sm text-gray-700">Start Date</label>
              <input
                type="date"
                className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={rescheduleForm.startDate}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, startDate: e.target.value })}
              />
            </div>

            {/* Recurring Period */}
            <div className="flex items-center gap-4">
              <label className="w-[140px] shrink-0 text-sm text-gray-700">Recurring Period</label>
              <select
                className="flex h-10 flex-1 rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={rescheduleForm.recurringPeriod}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, recurringPeriod: e.target.value, recurringRange: "" })}
              >
                <option value="">Select</option>
                <option value="1">Years</option>
                <option value="2">Months</option>
                <option value="3">Weeks</option>
              </select>
              <select
                className="flex h-10 w-[140px] rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={rescheduleForm.recurringRange}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, recurringRange: e.target.value })}
              >
                <option value="">Select</option>
                {rescheduleForm.recurringPeriod === "1" && (
                  <option value="1">1</option>
                )}
                {rescheduleForm.recurringPeriod === "2" &&
                  Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))
                }
                {rescheduleForm.recurringPeriod === "3" &&
                  Array.from({ length: 26 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))
                }
              </select>
            </div>

            {/* Will Recurr on */}
            {rescheduleForm.startDate && rescheduleForm.recurringPeriod && rescheduleForm.recurringRange && (() => {
              const start = new Date(rescheduleForm.startDate);
              const range = Number(rescheduleForm.recurringRange);
              const next = new Date(start);
              if (rescheduleForm.recurringPeriod === "1") next.setFullYear(next.getFullYear() + range);
              else if (rescheduleForm.recurringPeriod === "2") next.setMonth(next.getMonth() + range);
              else if (rescheduleForm.recurringPeriod === "3") next.setDate(next.getDate() + range * 7);
              const dd = String(next.getDate()).padStart(2, "0");
              const mm = String(next.getMonth() + 1).padStart(2, "0");
              const yyyy = next.getFullYear();
              return (
                <div className="flex items-center gap-4">
                  <label className="w-[140px] shrink-0 text-sm text-gray-700">Will Recurr on</label>
                  <p className="text-sm font-bold text-gray-900">{dd}-{mm}-{yyyy}</p>
                </div>
              );
            })()}

            {/* Contract / Approve */}
            <div className="flex items-center gap-4">
              <label className="w-[140px] shrink-0 text-sm text-gray-700">Contract / Approve</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                  checked={rescheduleForm.contractApprove}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, contractApprove: e.target.checked })}
                />
                <span className="text-sm text-gray-700">I want this job to automatically approve</span>
              </label>
            </div>
          </div>
          <hr />
          <div className="flex items-center gap-4 px-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleReschedule}
              disabled={rescheduleSubmitting}
            >
              {rescheduleSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {setAsRecurringMode ? "Create Recurring Job" : "Reschedule"}
            </Button>
            <button
              onClick={() => setRescheduleOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Image Viewer Popup ──────────────────────────────────── */}
      {viewerOpen && (
        <ImageViewerPopup
          images={viewerImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
