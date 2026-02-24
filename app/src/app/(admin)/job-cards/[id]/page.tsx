"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Paperclip,
  Users,
  ClipboardList,
  Wrench,
  ChevronDown,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { PageLoading } from "@/components/ui/loading";
import {
  formatDate,
  formatDateTime,
  JOB_CARD_STATUS,
  JOB_CARD_STATUS_LABELS,
} from "@/lib/utils";

// --- Types ---

interface ClientInfo {
  _id: string;
  companyName: string;
}

interface SiteInfo {
  _id: string;
  siteName: string;
}

interface ContactInfo {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface TitleInfo {
  _id: string;
  name: string;
}

interface JobCardTypeInfo {
  _id: string;
  name: string;
}

interface ChecklistItem {
  _id: string;
  details: string;
  checklistItemType: string;
  response?: any;
  notes?: string;
  passed?: boolean;
}

interface AssetItem {
  _id: string;
  assetId?: {
    _id: string;
    machineName: string;
    serialNumber?: string;
  };
  machineName?: string;
  serialNumber?: string;
  checklist?: ChecklistItem[];
}

interface Comment {
  _id: string;
  comment: string;
  userId?: {
    _id: string;
    name: string;
    lastName?: string;
  };
  createdAt: string;
}

interface Attachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  createdAt: string;
}

interface Technician {
  _id: string;
  technicianId?: {
    _id: string;
    name: string;
    lastName?: string;
    email?: string;
  };
  name?: string;
  lastName?: string;
  email?: string;
}

interface AvailableAsset {
  _id: string;
  machineName: string;
  serialNumber?: string;
}

interface AvailableTechnician {
  _id: string;
  name: string;
  lastName?: string;
  email?: string;
}

interface JobCardData {
  _id: string;
  ticketNo: string;
  uniqueId?: string;
  jobCardStatus: number;
  clientId: ClientInfo;
  siteId?: SiteInfo;
  contactId?: ContactInfo;
  titleId?: TitleInfo;
  jobCardTypeId?: JobCardTypeInfo;
  description?: string;
  technicianBriefing?: string;
  jobDate?: string;
  jobEndDate?: string;
  multiDayJob?: boolean;
  warranty?: boolean;
  recurringJob?: boolean;
  recurringPeriod?: number;
  recurringRange?: string;
  createdAt: string;
  comments?: Comment[];
  attachments?: Attachment[];
  technicians?: Technician[];
  assets?: AssetItem[];
}

// --- Status helpers ---

function getJobCardStatusColor(status: number): string {
  switch (status) {
    case 0:
      return "bg-gray-100 text-gray-800";
    case 1:
      return "bg-blue-100 text-blue-800";
    case 2:
      return "bg-yellow-100 text-yellow-800";
    case 3:
      return "bg-green-100 text-green-800";
    case 4:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

const STATUS_OPTIONS = [
  { value: JOB_CARD_STATUS.DRAFT, label: "Draft" },
  { value: JOB_CARD_STATUS.OPEN, label: "Open" },
  { value: JOB_CARD_STATUS.IN_PROGRESS, label: "In Progress" },
  { value: JOB_CARD_STATUS.COMPLETED, label: "Completed" },
  { value: JOB_CARD_STATUS.CANCELLED, label: "Cancelled" },
];

// --- Page component ---

export default function JobCardDetailPage() {
  useEffect(() => { document.title = "TSC - Job Card Details"; }, []);
  const params = useParams();
  const id = params.id as string;

  const [jobCard, setJobCard] = useState<JobCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Assets dialog
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<AvailableAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [addingAsset, setAddingAsset] = useState(false);

  // Technician dialog
  const [techDialogOpen, setTechDialogOpen] = useState(false);
  const [availableTechnicians, setAvailableTechnicians] = useState<
    AvailableTechnician[]
  >([]);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [addingTech, setAddingTech] = useState(false);

  // Status change
  const [changingStatus, setChangingStatus] = useState(false);

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

  // --- Status change ---

  async function handleStatusChange(newStatus: number) {
    if (!jobCard || changingStatus) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobCardStatus: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update status");
      }
      setJobCard((prev) =>
        prev ? { ...prev, jobCardStatus: newStatus } : prev
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setChangingStatus(false);
    }
  }

  // --- Comments ---

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/job-cards/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add comment");
      }
      setNewComment("");
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
      const res = await fetch(
        `/api/clients/${jobCard.clientId._id}/assets`
      );
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
  const assets = jobCard.assets || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/job-cards">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {jobCard.ticketNo || jobCard.uniqueId || "Job Card"}
              </h1>
              <Badge
                className={getJobCardStatusColor(jobCard.jobCardStatus)}
              >
                {JOB_CARD_STATUS_LABELS[jobCard.jobCardStatus] || "Unknown"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Created {formatDate(jobCard.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={changingStatus}>
                {changingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Change Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={opt.value === jobCard.jobCardStatus}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href={`/job-cards/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>

          <Button>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Client</p>
              <p className="mt-1 text-sm text-gray-900">
                {jobCard.clientId?.companyName || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Site</p>
              <p className="mt-1 text-sm text-gray-900">
                {jobCard.siteId?.siteName || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Contact</p>
              <p className="mt-1 text-sm text-gray-900">
                {jobCard.contactId
                  ? `${jobCard.contactId.firstName} ${jobCard.contactId.lastName}`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Title / Category
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {jobCard.titleId?.name || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Job Date</p>
              <p className="mt-1 text-sm text-gray-900">
                {jobCard.jobDate ? formatDate(jobCard.jobDate) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p className="mt-1 text-sm text-gray-900">
                {jobCard.jobEndDate ? formatDate(jobCard.jobEndDate) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Warranty</p>
              <p className="mt-1 text-sm text-gray-900">
                {jobCard.warranty ? (
                  <Badge variant="success">Yes</Badge>
                ) : (
                  "No"
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <p className="mt-1 text-sm text-gray-900">
                {jobCard.jobCardTypeId?.name || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="mt-1 text-sm text-gray-900">
                {formatDateTime(jobCard.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="mr-1.5 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Wrench className="mr-1.5 h-4 w-4" />
            Assets & Checklists
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="mr-1.5 h-4 w-4" />
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="attachments">
            <Paperclip className="mr-1.5 h-4 w-4" />
            Attachments ({attachments.length})
          </TabsTrigger>
          <TabsTrigger value="technicians">
            <Users className="mr-1.5 h-4 w-4" />
            Technicians ({technicians.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardContent className="space-y-6 p-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Description
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                  {jobCard.description || "No description provided."}
                </p>
              </div>

              {/* Technician Briefing */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Technician Briefing
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                  {jobCard.technicianBriefing || "No briefing provided."}
                </p>
              </div>

              {/* Recurring info */}
              {jobCard.recurringJob && (
                <div className="rounded-[10px] border border-blue-200 bg-blue-50 p-4">
                  <h3 className="text-sm font-medium text-blue-800">
                    Recurring Job
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Every {jobCard.recurringPeriod || 1}{" "}
                    {jobCard.recurringRange || "days"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets & Checklists Tab */}
        <TabsContent value="assets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Assets & Checklists</CardTitle>
              <Dialog
                open={assetDialogOpen}
                onOpenChange={setAssetDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" onClick={openAssetDialog}>
                    <Plus className="h-4 w-4" />
                    Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Asset</DialogTitle>
                    <DialogDescription>
                      Select an asset from the client to assign to this job
                      card.
                    </DialogDescription>
                  </DialogHeader>
                  {loadingAssets ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Select
                        value={selectedAssetId}
                        onValueChange={setSelectedAssetId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAssets.map((asset) => (
                            <SelectItem key={asset._id} value={asset._id}>
                              {asset.machineName}
                              {asset.serialNumber
                                ? ` (${asset.serialNumber})`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setAssetDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddAsset}
                      disabled={!selectedAssetId || addingAsset}
                    >
                      {addingAsset && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Add Asset
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <div className="py-8 text-center">
                  <Wrench className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm text-gray-500">
                    No assets assigned to this job card.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {assets.map((asset) => {
                    const name =
                      asset.assetId?.machineName ||
                      asset.machineName ||
                      "Unknown Asset";
                    const serial =
                      asset.assetId?.serialNumber ||
                      asset.serialNumber ||
                      "";
                    const checklist = asset.checklist || [];

                    return (
                      <div
                        key={asset._id}
                        className="rounded-[10px] border border-gray-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {name}
                            </p>
                            {serial && (
                              <p className="text-sm text-gray-500">
                                Serial: {serial}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {checklist.length} checklist item
                            {checklist.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>

                        {checklist.length > 0 && (
                          <div className="mt-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Details</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Response</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {checklist.map((item) => (
                                  <TableRow key={item._id}>
                                    <TableCell className="text-sm">
                                      {item.details}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">
                                        {item.checklistItemType}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {renderChecklistResponse(item)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || submittingComment}
                  >
                    {submittingComment && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Add Comment
                  </Button>
                </div>
              </form>

              {/* Comments list */}
              {comments.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm text-gray-500">
                    No comments yet. Be the first to add one.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="rounded-[10px] border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {comment.userId
                            ? `${comment.userId.name}${comment.userId.lastName ? ` ${comment.userId.lastName}` : ""}`
                            : "System"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(comment.createdAt)}
                        </p>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Attachments</CardTitle>
              <Button size="sm" variant="outline" disabled>
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <div className="py-8 text-center">
                  <Paperclip className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm text-gray-500">
                    No attachments yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attachments.map((att) => (
                      <TableRow key={att._id}>
                        <TableCell>
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {att.fileName}
                          </a>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {att.fileType || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-500">
                          {formatDate(att.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteAttachment(att._id)
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Assigned Technicians</CardTitle>
              <Dialog
                open={techDialogOpen}
                onOpenChange={setTechDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" onClick={openTechDialog}>
                    <Plus className="h-4 w-4" />
                    Add Technician
                  </Button>
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
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Select
                        value={selectedTechId}
                        onValueChange={setSelectedTechId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a technician" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTechnicians.map((tech) => (
                            <SelectItem key={tech._id} value={tech._id}>
                              {tech.name}
                              {tech.lastName ? ` ${tech.lastName}` : ""}
                              {tech.email ? ` (${tech.email})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setTechDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddTechnician}
                      disabled={!selectedTechId || addingTech}
                    >
                      {addingTech && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Add Technician
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {technicians.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm text-gray-500">
                    No technicians assigned yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {technicians.map((tech) => {
                      const techName = tech.technicianId
                        ? `${tech.technicianId.name}${tech.technicianId.lastName ? ` ${tech.technicianId.lastName}` : ""}`
                        : `${tech.name || ""}${tech.lastName ? ` ${tech.lastName}` : ""}`;
                      const techEmail =
                        tech.technicianId?.email || tech.email || "-";

                      return (
                        <TableRow key={tech._id}>
                          <TableCell className="font-medium">
                            {techName || "-"}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {techEmail}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Checklist response renderer ---

function renderChecklistResponse(item: ChecklistItem) {
  const type = item.checklistItemType?.toLowerCase();

  if (type === "boolean" || type === "yes/no" || type === "pass/fail") {
    if (item.passed === true || item.response === true || item.response === "yes" || item.response === "pass") {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {item.response?.toString() || "Pass"}
        </span>
      );
    }
    if (item.passed === false || item.response === false || item.response === "no" || item.response === "fail") {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-red-700">
          <XCircle className="h-4 w-4" />
          {item.response?.toString() || "Fail"}
        </span>
      );
    }
    return <span className="text-sm text-gray-400">No response</span>;
  }

  if (type === "text" || type === "textarea" || type === "number") {
    return (
      <span className="text-sm text-gray-900">
        {item.response?.toString() || (
          <span className="text-gray-400">No response</span>
        )}
      </span>
    );
  }

  if (type === "checkbox") {
    return (
      <Checkbox checked={!!item.response} disabled />
    );
  }

  // Default
  return (
    <span className="text-sm text-gray-900">
      {item.response?.toString() || (
        <span className="text-gray-400">No response</span>
      )}
    </span>
  );
}
