"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Archive,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { PageLoading } from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";
import {
  formatDate,
  formatDateTime,
} from "@/lib/utils";

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
  name: string;
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

interface AvailableTechnician {
  _id: string;
  companyName: string;
  email?: string;
  phone?: string;
}

interface JobCardData {
  _id: string;
  ticketNo: number;
  uniqueId?: string;
  jobCardStatus: number;
  clientId: ClientInfo;
  clientSiteId?: SiteInfo;
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
  "Date Confirmed",
  "Assigned Technicians",
  "Technician Avail. Conf.",
  "Client Date Confirmed",
  "Job Card Sent",
  "Checklist Complete",
  "Internal Review",
  "Job Invoiced",
];

// --- Page component ---

export default function JobCardDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [jobCard, setJobCard] = useState<JobCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Comments
  const [newComment, setNewComment] = useState("");
  const [commentPublic, setCommentPublic] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Assets dialog
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<AvailableAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [addingAsset, setAddingAsset] = useState(false);

  // Technician dialog
  const [techDialogOpen, setTechDialogOpen] = useState(false);
  const [availableTechnicians, setAvailableTechnicians] = useState<AvailableTechnician[]>([]);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [addingTech, setAddingTech] = useState(false);

  // Ticket history tab
  const [ticketHistoryTab, setTicketHistoryTab] = useState("asset");

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

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/job-cards/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: newComment.trim(),
          visibility: commentPublic ? 1 : 0,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add comment");
      }
      setNewComment("");
      setCommentPublic(false);
      fetchJobCard();
    } catch (err: any) {
      alert(err.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  // --- Assets ---

  async function openAssetDialog() {
    setAssetDialogOpen(true);
    if (!jobCard?.clientId?._id) return;
    setLoadingAssets(true);
    try {
      const res = await fetch(`/api/clients/${jobCard.clientId._id}/assets`);
      const json = await res.json();
      if (json.success) setAvailableAssets(json.data || []);
    } catch {
      setAvailableAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }

  async function handleAddAsset() {
    if (!selectedAssetId) return;
    setAddingAsset(true);
    try {
      const res = await fetch(`/api/job-cards/${id}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: selectedAssetId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add asset");
      }
      setSelectedAssetId("");
      setAssetDialogOpen(false);
      fetchJobCard();
    } catch (err: any) {
      alert(err.message || "Failed to add asset");
    } finally {
      setAddingAsset(false);
    }
  }

  // --- Technicians ---

  async function openTechDialog() {
    setTechDialogOpen(true);
    setLoadingTechs(true);
    try {
      const res = await fetch("/api/technicians");
      const json = await res.json();
      if (json.success) setAvailableTechnicians(json.data || []);
    } catch {
      setAvailableTechnicians([]);
    } finally {
      setLoadingTechs(false);
    }
  }

  async function handleAddTechnician() {
    if (!selectedTechId) return;
    setAddingTech(true);
    try {
      const res = await fetch(`/api/job-cards/${id}/technicians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: selectedTechId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add technician");
      }
      setSelectedTechId("");
      setTechDialogOpen(false);
      fetchJobCard();
    } catch (err: any) {
      alert(err.message || "Failed to add technician");
    } finally {
      setAddingTech(false);
    }
  }

  // --- Attachments ---

  async function handleDeleteAttachment(attachmentId: string) {
    if (!confirm("Are you sure you want to delete this attachment?")) return;
    try {
      const res = await fetch(
        `/api/job-cards/${id}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete attachment");
      }
      fetchJobCard();
    } catch (err: any) {
      alert(err.message || "Failed to delete attachment");
    }
  }

  // --- Copy to clipboard ---

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
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

  // Compute progress step based on jobCardStatus
  function getProgressStep(): number {
    // Map status to approximate step completion
    if (jobCard!.invoiceNumber) return 8;
    if (jobCard!.jobCardStatus === 3) return 7; // Completed
    if (jobCard!.jobCardStatus === 2) return 3; // In progress
    if (jobCard!.jobCardStatus === 1) return 1; // Open
    return 0;
  }

  const progressStep = getProgressStep();

  // Determine image attachments vs file attachments
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
  const imageAttachments = attachments.filter((a) => {
    const ext = (a.fileName || "").toLowerCase();
    return imageExtensions.some((e) => ext.endsWith(e));
  });
  const fileAttachments = attachments.filter((a) => {
    const ext = (a.fileName || "").toLowerCase();
    return !imageExtensions.some((e) => ext.endsWith(e));
  });

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
              <Link href={`/job-cards/${id}/edit`} className="text-[#00AEEF] hover:underline">
                Edit
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-full border-gray-300 text-[13px] text-gray-700 hover:bg-gray-50">
            <RefreshCcw className="h-4 w-4" />
            Set as recurring job
          </Button>
          <Button variant="outline" className="gap-2 rounded-full border-gray-300 text-[13px] text-gray-700 hover:bg-gray-50">
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {["Overview", "Checklists", "Job Card Log"].map((tab) => {
            const tabKey = tab.toLowerCase().replace(/ /g, "-");
            const isActive = activeTab === (tabKey === "overview" ? "overview" : tabKey);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabKey === "overview" ? "overview" : tabKey)}
                className={`relative pb-3 text-[14px] font-medium transition-colors ${
                  isActive
                    ? "text-[#00AEEF]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
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
          <div className="min-w-0 flex-1 space-y-7">
            {/* Client Info */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-gray-900">
                    {jobCard.clientId?.companyName || "Unknown Client"}
                  </h2>
                  {(jobCard.clientSiteId?.siteName || jobCard.clientSiteId?.address) && (
                    <p className="mt-0.5 text-[13px] text-gray-500">
                      {jobCard.clientId?.companyName?.toLowerCase()} - {jobCard.clientSiteId?.siteName || jobCard.clientSiteId?.address}
                    </p>
                  )}
                </div>
                <Link
                  href={`/job-cards/${id}/edit`}
                  className="text-[13px] text-[#00AEEF] hover:underline"
                >
                  Edit Job Card
                </Link>
              </div>

              <Link href="#" className="mt-1 inline-block text-[13px] text-[#00AEEF] hover:underline">
                Edit Contact
              </Link>

              {/* Sites row */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] font-medium text-gray-400 uppercase">Sites</p>
                  <p className="mt-1 text-[13px] text-gray-700">
                    {jobCard.clientSiteId?.siteName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-gray-400 uppercase">Payments</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {jobCard.warranty ? (
                      <Badge className="bg-[#E0F7FA] text-[#00838F] text-[11px] font-normal">
                        Warranty
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              {/* Job Type */}
              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-gray-800">Job Type</p>
                <div className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-[13px] text-gray-500">
                  {jobCard.jobCardType?.name || "Select"}
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              {/* Assets */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-gray-800">Asset(s)</p>
                  <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        onClick={openAssetDialog}
                        className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Asset
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Asset</DialogTitle>
                        <DialogDescription>
                          Select an asset from the client to assign to this job card.
                        </DialogDescription>
                      </DialogHeader>
                      {loadingAssets ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-[#00AEEF]" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an asset" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableAssets.map((asset) => (
                                <SelectItem key={asset._id} value={asset._id}>
                                  {asset.machineName}
                                  {asset.serialNumber ? ` (${asset.serialNumber})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAssetDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddAsset}
                          disabled={!selectedAssetId || addingAsset}
                          className="bg-[#00AEEF] hover:bg-[#009CD8]"
                        >
                          {addingAsset && <Loader2 className="h-4 w-4 animate-spin" />}
                          Add Asset
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mt-3 space-y-2">
                  {clientAssets.length === 0 ? (
                    <p className="text-[13px] text-gray-400">No assets assigned.</p>
                  ) : (
                    clientAssets.map((asset) => {
                      const name = asset.clientAssetId?.machineName || "Unknown Asset";
                      return (
                        <div
                          key={asset._id}
                          className="flex items-center justify-between rounded-[10px] border border-gray-200 px-3 py-2"
                        >
                          <div>
                            <p className="text-[13px] font-medium text-[#00AEEF]">
                              {name}
                            </p>
                            {asset.clientAssetId?.serialNumber && (
                              <p className="text-[12px] text-[#00AEEF]">
                                Checklist 0/3
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Technicians */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-gray-900">Technicians</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Dialog open={techDialogOpen} onOpenChange={setTechDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      onClick={openTechDialog}
                      className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Technician
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Technician</DialogTitle>
                      <DialogDescription>
                        Select a technician to assign to this job card.
                      </DialogDescription>
                    </DialogHeader>
                    {loadingTechs ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#00AEEF]" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Select value={selectedTechId} onValueChange={setSelectedTechId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a technician" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTechnicians.map((tech) => (
                              <SelectItem key={tech._id} value={tech._id}>
                                {tech.companyName}
                                {tech.email ? ` (${tech.email})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTechDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddTechnician}
                        disabled={!selectedTechId || addingTech}
                        className="bg-[#00AEEF] hover:bg-[#009CD8]"
                      >
                        {addingTech && <Loader2 className="h-4 w-4 animate-spin" />}
                        Add Technician
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="mt-3 space-y-2.5">
                {technicians.length === 0 ? (
                  <p className="text-[13px] text-gray-400">No technicians assigned.</p>
                ) : (
                  technicians.map((tech) => {
                    const name = tech.technicianId?.companyName || "Unknown";
                    const phone = tech.technicianId?.phone || "";
                    const email = tech.technicianId?.email || "";
                    return (
                      <div key={tech._id} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[12px] font-medium text-gray-600">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-1 items-center gap-6 text-[13px]">
                          <span className="min-w-[120px] font-medium text-gray-900">{name}</span>
                          {phone && <span className="text-gray-500">{phone}</span>}
                          {email && <span className="text-gray-500">{email}</span>}
                        </div>
                        <button
                          onClick={() => copyToClipboard(`${name} ${phone} ${email}`)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Technician Notes */}
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">Technician Notes</h3>
              <p className="mt-1 text-[13px] text-gray-500">
                Technician notes are shown in the Job Card email and Job Card URL, where a user by Technicians.
              </p>
              <button className="mt-2 text-[13px] text-[#00AEEF] hover:underline">
                Click here to add a Technician Notes.
              </button>
            </div>

            <hr className="border-gray-200" />

            {/* Job Description */}
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">Job Description</h3>
              {detail?.description ? (
                <div className="mt-2">
                  <p className="text-[13px] font-medium text-gray-700">Title:</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] text-gray-600">
                    {detail.description}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-[13px] text-gray-400">No description provided.</p>
              )}
            </div>

            <hr className="border-gray-200" />

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-gray-900">Attachments</h3>
                <label className="flex items-center gap-2 text-[12px] text-gray-500 cursor-pointer">
                  <Eye className="h-3.5 w-3.5" />
                  Make All Images Public
                </label>
              </div>

              {/* File attachments */}
              {fileAttachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {fileAttachments.map((att) => (
                    <div
                      key={att._id}
                      className="flex items-center justify-between rounded-[10px] border border-gray-100 px-3 py-2"
                    >
                      <span className="text-[13px] text-gray-700">
                        {att.documentName || att.fileName}
                        {att.fileSize ? `, ${(att.fileSize / 1024).toFixed(0)}KB` : ""}
                      </span>
                      <div className="flex gap-1">
                        <button className="rounded p-1 text-gray-400 hover:text-gray-600">
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded p-1 text-gray-400 hover:text-gray-600">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded p-1 text-gray-400 hover:text-gray-600">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(att.fileName)}
                          className="rounded p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Image thumbnails */}
              {imageAttachments.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-[12px] text-gray-400">Click to enlarge</p>
                  <div className="grid grid-cols-3 gap-3">
                    {imageAttachments.map((att) => (
                      <div
                        key={att._id}
                        className="group relative flex aspect-square items-center justify-center rounded-[10px] border border-gray-200 bg-gray-50"
                      >
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                        <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button className="rounded bg-white p-1 text-gray-500 shadow-sm hover:text-gray-700">
                            <EyeOff className="h-3 w-3" />
                          </button>
                          <button className="rounded bg-white p-1 text-gray-500 shadow-sm hover:text-gray-700">
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttachment(att._id)}
                            className="rounded bg-white p-1 text-gray-500 shadow-sm hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {attachments.length === 0 && (
                <p className="mt-3 text-[13px] text-gray-400">No attachments.</p>
              )}
            </div>

            <hr className="border-gray-200" />

            {/* Checklist Uploads */}
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">Checklist Uploads</h3>
              <p className="mt-2 text-[13px] text-gray-400">No checklist uploads.</p>
            </div>

            <hr className="border-gray-200" />

            {/* Comments / Updates */}
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">Comments / Updates</h3>

              <form onSubmit={handleAddComment} className="mt-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Start typing..."
                  rows={3}
                  className="rounded-[10px] border-gray-200 text-[13px]"
                />
                <div className="mt-3 flex items-center gap-4">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || submittingComment}
                    className="bg-[#00AEEF] hover:bg-[#009CD8] rounded-[10px] px-5"
                  >
                    {submittingComment && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Save
                  </Button>
                  <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer">
                    <Switch
                      checked={commentPublic}
                      onCheckedChange={setCommentPublic}
                    />
                    Make Public
                  </label>
                </div>
              </form>

              {/* Comments list */}
              <div className="mt-5 space-y-3">
                {comments.map((comment, idx) => {
                  const authorName = comment.userId?.name || "System";
                  const dateStr = formatDateTime(comment.dateTime || comment.createdAt);
                  const isPublic = comment.visibility === 1;

                  return (
                    <div
                      key={comment._id}
                      className={`rounded-[10px] border px-4 py-3 ${
                        idx % 3 === 0
                          ? "border-red-200 bg-red-50"
                          : idx % 3 === 1
                          ? "border-amber-200 bg-amber-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="font-medium text-[#00AEEF]">{authorName}</span>
                          <span className="text-gray-400">{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px]">
                          <button className="text-[#00AEEF] hover:underline">
                            {isPublic ? "Make Private" : "Make Public"}
                          </button>
                          <button className="text-[#00AEEF] hover:underline">Edit</button>
                          <button className="text-[#00AEEF] hover:underline">Delete</button>
                        </div>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-gray-700">
                        {comment.comments}
                      </p>
                    </div>
                  );
                })}
                {comments.length === 0 && (
                  <p className="text-[13px] text-gray-400">No comments yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-[320px] shrink-0 space-y-5">
            {/* Support Tickets */}
            <div className="rounded-[10px] border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-semibold text-gray-900">Support Tickets</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-gray-500">0/3</span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {jobCard.supportTicketId && typeof jobCard.supportTicketId === "object" && (
                <div className="mt-3">
                  <Link
                    href={`/support-tickets/${(jobCard.supportTicketId as any)._id}`}
                    className="text-[13px] text-[#00AEEF] hover:underline"
                  >
                    #{(jobCard.supportTicketId as any).ticketNo}
                  </Link>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      className="w-full rounded-[10px] bg-orange-500 text-white hover:bg-orange-600 text-[12px]"
                    >
                      Go to Technician
                    </Button>
                  </div>
                </div>
              )}

              <button className="mt-2 flex items-center gap-1 text-[13px] text-[#00AEEF] hover:underline">
                <Plus className="h-3.5 w-3.5" />
                Add Case
              </button>
            </div>

            {/* Job Date */}
            <div className="rounded-[10px] border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-semibold text-gray-900">Job Date</h4>
                <button className="text-gray-400 hover:text-gray-600">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              {jobCard.jobDate ? (
                <p className="mt-2 text-[13px] text-gray-700">{formatDate(jobCard.jobDate)}</p>
              ) : (
                <p className="mt-2 rounded-[6px] bg-orange-50 px-3 py-2 text-[12px] text-orange-600">
                  The date for this job has not been set
                </p>
              )}
            </div>

            {/* Job Progress */}
            <div className="rounded-[10px] border border-gray-200 p-4">
              <h4 className="text-[14px] font-semibold text-gray-900">Job Progress</h4>

              <Link href={`/job-cards/${id}/edit`}>
                <Button className="mt-3 w-full rounded-[10px] bg-amber-400 text-gray-900 hover:bg-amber-500 text-[13px] font-semibold">
                  Edit Job Card
                </Button>
              </Link>

              <div className="mt-4 space-y-0">
                {JOB_PROGRESS_STEPS.map((step, idx) => {
                  const isCompleted = idx < progressStep;
                  const isCurrent = idx === progressStep;
                  return (
                    <div key={step} className="flex items-start gap-3">
                      {/* Vertical line + dot */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-3 w-3 rounded-full border-2 ${
                            isCompleted
                              ? "border-[#00AEEF] bg-[#00AEEF]"
                              : isCurrent
                              ? "border-[#00AEEF] bg-white"
                              : "border-gray-300 bg-white"
                          }`}
                        />
                        {idx < JOB_PROGRESS_STEPS.length - 1 && (
                          <div
                            className={`w-[2px] ${
                              isCompleted ? "bg-[#00AEEF]" : "bg-gray-200"
                            }`}
                            style={{ height: "28px" }}
                          />
                        )}
                      </div>
                      <p
                        className={`-mt-0.5 text-[13px] ${
                          isCompleted
                            ? "font-medium text-gray-900"
                            : isCurrent
                            ? "font-medium text-[#00AEEF]"
                            : "text-gray-400"
                        }`}
                      >
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ticket History */}
            <div className="rounded-[10px] border border-gray-200 p-4">
              <h4 className="mb-3 text-[14px] font-semibold text-gray-900">Ticket History</h4>

              <div className="flex gap-4 border-b border-gray-200">
                {["Asset", "Site"].map((tab) => {
                  const key = tab.toLowerCase();
                  return (
                    <button
                      key={tab}
                      onClick={() => setTicketHistoryTab(key)}
                      className={`relative pb-2 text-[13px] font-medium ${
                        ticketHistoryTab === key
                          ? "text-[#00AEEF]"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {tab}
                      {ticketHistoryTab === key && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00AEEF]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[11px] px-2">Ticket Title</TableHead>
                      <TableHead className="text-[11px] px-2">Date</TableHead>
                      <TableHead className="text-[11px] px-2">Ticket Owner</TableHead>
                      <TableHead className="text-[11px] px-2">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Placeholder row - this would be populated with real ticket history data */}
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center text-[12px] text-gray-400">
                        No ticket history
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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
                <div key={asset._id} className="rounded-[10px] border border-gray-200 p-5">
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
        <div className="rounded-[10px] border border-gray-200 p-5">
          <p className="text-[13px] text-gray-400">Job card log will be displayed here.</p>
        </div>
      )}
    </div>
  );
}
