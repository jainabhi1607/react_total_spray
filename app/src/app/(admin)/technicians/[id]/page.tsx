"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Eye,
  Archive,
  Loader2,
  ExternalLink,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import {
  TechnicianDialog,
  type TechnicianData as TechnicianDialogData,
} from "@/components/dialogs/technician-dialog";
import {
  InsuranceDialog,
  getPolicyLabel,
  type InsuranceRecord,
} from "@/components/dialogs/insurance-dialog";

// --- Types ---

interface TagData {
  _id: string;
  tagId?: { _id: string; title: string };
}

interface SubTechnician {
  _id: string;
  companyName: string;
  email?: string;
  phone?: string;
  licenceNumber?: string;
  licenceExpiry?: string;
}

interface TechnicianData {
  _id: string;
  companyName: string;
  email?: string;
  phone?: string;
  abn?: string;
  address?: string;
  licenceNumber?: string;
  licenceExpiry?: string;
  insuranceStatus?: number;
  status?: number;
  createdAt?: string;
  technicianDetail?: { notes?: string };
  insurances?: any[];
  tags?: TagData[];
  subTechnicians?: SubTechnician[];
}

interface AvailableTag {
  _id: string;
  title: string;
}

// --- Sub-Technician Dialog ---

const EMPTY_SUB_FORM = {
  companyName: "",
  email: "",
  phone: "",
  licenceNumber: "",
  licenceExpiry: "",
};

function AddSubTechnicianDialog({
  open,
  onOpenChange,
  onSuccess,
  parentId,
  subTechnician,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  parentId: string;
  subTechnician?: SubTechnician;
}) {
  const isEdit = !!subTechnician;
  const [form, setForm] = useState(EMPTY_SUB_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && subTechnician) {
      setForm({
        companyName: subTechnician.companyName || "",
        email: subTechnician.email || "",
        phone: subTechnician.phone || "",
        licenceNumber: subTechnician.licenceNumber || "",
        licenceExpiry: subTechnician.licenceExpiry
          ? new Date(subTechnician.licenceExpiry).toISOString().split("T")[0]
          : "",
      });
      setError("");
    } else if (open) {
      setForm(EMPTY_SUB_FORM);
      setError("");
    }
  }, [open, subTechnician]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY_SUB_FORM);
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.companyName.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setSubmitting(true);

      const url = isEdit ? `/api/technicians/${subTechnician._id}` : "/api/technicians";
      const method = isEdit ? "PUT" : "POST";

      const payload: Record<string, any> = {
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        licenceNumber: form.licenceNumber.trim(),
        licenceExpiry: form.licenceExpiry || undefined,
      };

      if (!isEdit) {
        payload.parentId = parentId;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || json.message || "Failed to save technician");
      }

      handleOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Technician" : "Add Technician"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sub-name">Name</Label>
            <Input
              id="sub-name"
              value={form.companyName}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sub-email">Email</Label>
              <Input
                id="sub-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-phone">Contact Number</Label>
              <Input
                id="sub-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sub-licence">Licence Number</Label>
              <Input
                id="sub-licence"
                value={form.licenceNumber}
                onChange={(e) => setForm((f) => ({ ...f, licenceNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-expiry">Licence Expiry</Label>
              <Input
                id="sub-expiry"
                type="date"
                value={form.licenceExpiry}
                onChange={(e) => setForm((f) => ({ ...f, licenceExpiry: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Technician"}
            </Button>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page ---

export default function TechnicianDetailPage() {
  useEffect(() => {
    document.title = "TSC - Technician Details";
  }, []);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [technician, setTechnician] = useState<TechnicianData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Tags
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagSaving, setTagSaving] = useState<string | null>(null);

  // Notes
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  // Edit technician dialog
  const [techDialogOpen, setTechDialogOpen] = useState(false);

  // Sub-technician dialog
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editSub, setEditSub] = useState<SubTechnician | undefined>(undefined);

  // Insurance
  const [insurances, setInsurances] = useState<InsuranceRecord[]>([]);
  const [insDialogOpen, setInsDialogOpen] = useState(false);
  const [insDialogMode, setInsDialogMode] = useState<"add" | "edit" | "revision">("add");
  const [insDialogTarget, setInsDialogTarget] = useState<InsuranceRecord | undefined>(undefined);

  const fetchTechnician = useCallback(async () => {
    try {
      const res = await fetch(`/api/technicians/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to load technician");
      }
      setTechnician(json.data);
      setNotesValue(json.data?.technicianDetail?.notes || "");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/tags");
      const json = await res.json();
      if (res.ok && json.success) {
        const raw = json.data?.data || json.data || [];
        setAvailableTags(Array.isArray(raw) ? raw : []);
      }
    } catch {
      // non-critical
    }
  }, []);

  const fetchInsurances = useCallback(async () => {
    try {
      const res = await fetch(`/api/technicians/${id}/insurance`);
      const json = await res.json();
      if (res.ok && json.success) {
        setInsurances(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      // non-critical
    }
  }, [id]);

  useEffect(() => {
    fetchTechnician();
    fetchTags();
    fetchInsurances();
  }, [fetchTechnician, fetchTags, fetchInsurances]);

  // --- Tag handlers ---

  const assignedTagIds = new Set(
    (technician?.tags || []).map((t) => t.tagId?._id).filter(Boolean)
  );

  async function toggleTag(tagId: string) {
    setTagSaving(tagId);
    try {
      if (assignedTagIds.has(tagId)) {
        const res = await fetch(`/api/technicians/${id}/tags/${tagId}`, { method: "DELETE" });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to remove tag");
      } else {
        const res = await fetch(`/api/technicians/${id}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to add tag");
      }
      fetchTechnician();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTagSaving(null);
    }
  }

  // --- Notes handlers ---

  async function handleSaveNotes() {
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/technicians/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save notes");
      setNotesEditing(false);
      fetchTechnician();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setNotesSaving(false);
    }
  }

  // --- Sub-technician handlers ---

  function handleAddSub() {
    setEditSub(undefined);
    setSubDialogOpen(true);
  }

  function handleEditSub(sub: SubTechnician) {
    setEditSub(sub);
    setSubDialogOpen(true);
  }

  async function handleDeleteSub(subId: string) {
    if (!confirm("Are you sure you want to delete this technician?")) return;
    try {
      const res = await fetch(`/api/technicians/${subId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete");
      fetchTechnician();
    } catch (err: any) {
      alert(err.message);
    }
  }

  // --- Archive handler ---

  async function handleArchive() {
    if (!confirm("Are you sure you want to archive this technician?")) return;
    try {
      const res = await fetch(`/api/technicians/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 2 }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to archive");
      router.push("/technicians");
    } catch (err: any) {
      alert(err.message);
    }
  }

  // --- Insurance handlers ---

  function handleAddInsurance() {
    setInsDialogTarget(undefined);
    setInsDialogMode("add");
    setInsDialogOpen(true);
  }

  function handleEditInsurance(ins: InsuranceRecord) {
    setInsDialogTarget(ins);
    setInsDialogMode("edit");
    setInsDialogOpen(true);
  }

  function handleUploadRevision(ins: InsuranceRecord) {
    setInsDialogTarget(ins);
    setInsDialogMode("revision");
    setInsDialogOpen(true);
  }

  async function handleDeleteInsurance(insuranceId: string) {
    if (!confirm("Are you sure you want to delete this insurance?")) return;
    try {
      const res = await fetch(
        `/api/technicians/${id}/insurance/${insuranceId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete");
      fetchInsurances();
      fetchTechnician();
    } catch (err: any) {
      alert(err.message);
    }
  }

  // Group insurances by groupNumber: latest first in each group
  function getGroupedInsurances() {
    const groups: Record<number, InsuranceRecord[]> = {};
    for (const ins of insurances) {
      const gn = ins.groupNumber || 0;
      if (!groups[gn]) groups[gn] = [];
      groups[gn].push(ins);
    }
    // Sort each group by createdAt desc (latest first)
    for (const gn of Object.keys(groups)) {
      groups[Number(gn)].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }
    // Return groups sorted by latest item's createdAt desc
    return Object.values(groups).sort(
      (a, b) =>
        new Date(b[0].createdAt || 0).getTime() -
        new Date(a[0].createdAt || 0).getTime()
    );
  }

  // --- Insurance status ---

  function getOverallInsuranceStatus() {
    if (insurances.length === 0) return null;
    // Check only the latest entry per group
    const groups = getGroupedInsurances();
    const now = new Date();
    const allValid = groups.every((group) => {
      const latest = group[0];
      if (latest.expiryDate) return new Date(latest.expiryDate) > now;
      return false;
    });
    return allValid ? "Valid" : "Invalid";
  }

  // --- Rendering ---

  if (loading) return <PageLoading />;

  if (error || !technician) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Unable to load technician</p>
          <p className="mt-1 text-sm text-gray-500">{error || "Technician not found"}</p>
          <Link href="/technicians" className="mt-4 inline-block">
            <Button variant="outline">Back to Technicians</Button>
          </Link>
        </div>
      </div>
    );
  }

  const insuranceStatus = getOverallInsuranceStatus();
  const tags = (technician.tags || [])
    .map((t) => t.tagId)
    .filter(Boolean) as { _id: string; title: string }[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/technicians">
            <button className="rounded-full border border-gray-200 p-1.5 hover:bg-gray-50">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "insurance" && (
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleAddInsurance}
            >
              <Plus className="h-4 w-4" />
              Add Insurance
            </Button>
          )}
          <Button variant="outline" onClick={handleArchive}>
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        {["overview", "work-history", "insurance"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap pb-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-cyan-500 text-cyan-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "overview" ? "Overview" : tab === "work-history" ? "Work History" : "Insurance"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main Card */}
          <Card>
            <CardContent className="p-6">
              {/* Date Added + Tags row */}
              <div className="flex items-start justify-between">
                <div className="flex gap-16">
                  <div>
                    <p className="text-sm text-gray-500">Date Added</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {technician.createdAt ? formatDate(technician.createdAt) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tags</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag._id}
                          className="rounded-full border border-gray-300 px-3 py-0.5 text-xs font-medium text-gray-700"
                        >
                          {tag.title}
                        </span>
                      ))}
                      <button
                        onClick={() => setTagDialogOpen(true)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setTechDialogOpen(true)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <hr className="my-5 border-gray-200" />

              {/* Detail rows */}
              <div className="space-y-0">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Primary Contact</span>
                  <span className="text-sm font-medium text-gray-900">{technician.companyName || "-"}</span>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Phone</span>
                  <span className="text-sm font-medium text-gray-900">{technician.phone || "-"}</span>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-medium text-gray-900">{technician.email || "-"}</span>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-sm text-gray-500">ABN</span>
                  <span className="text-sm font-medium text-gray-900">{technician.abn || "-"}</span>
                </div>
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm text-gray-500">Address</span>
                  <span className="text-sm font-medium text-gray-900">{technician.address || "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Insurance Card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Insurance</span>
                  <button
                    onClick={() => setActiveTab("insurance")}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Insurance
                  </button>
                </div>
                {insuranceStatus && (
                  <div className="mt-3">
                    <span
                      className={`inline-block w-full rounded-full py-2 text-center text-sm font-medium ${
                        insuranceStatus === "Valid"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {insuranceStatus}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Tickets Card */}
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm font-medium text-cyan-600">Support Tickets</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">0</p>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Notes</span>
                  {!notesEditing && (
                    <button
                      onClick={() => {
                        setNotesValue(technician.technicianDetail?.notes || "");
                        setNotesEditing(true);
                      }}
                      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {notesEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-cyan-500 focus:outline-none"
                      rows={3}
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                        onClick={handleSaveNotes}
                        disabled={notesSaving}
                      >
                        {notesSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                      </Button>
                      <button
                        className="text-xs text-gray-400 hover:text-gray-600"
                        onClick={() => setNotesEditing(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">
                    {technician.technicianDetail?.notes || "No notes"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Work History Tab */}
      {activeTab === "work-history" && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-gray-500">Work history coming soon</p>
          </CardContent>
        </Card>
      )}

      {/* Insurance Tab */}
      {activeTab === "insurance" && (
        <Card>
          <CardContent className="p-6">
            {insurances.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No insurance records found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#EBF5FF]">
                    <TableHead>Document Type</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getGroupedInsurances().map((group) =>
                    group.map((ins, idx) => {
                      const isMain = idx === 0;
                      const isRevision = idx > 0;
                      const expired =
                        ins.status === 2 ||
                        (ins.expiryDate &&
                          new Date(ins.expiryDate) < new Date());
                      return (
                        <TableRow
                          key={ins._id}
                          className={isRevision ? "bg-gray-50/50" : ""}
                        >
                          <TableCell
                            className={`${isRevision ? "pl-10 text-gray-500" : "font-medium"}`}
                          >
                            {getPolicyLabel(ins.insurancePolicyType)}
                          </TableCell>
                          <TableCell>
                            {ins.createdAt ? formatDate(ins.createdAt) : "-"}
                          </TableCell>
                          <TableCell>
                            {ins.expiryDate
                              ? formatDate(ins.expiryDate)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={expired ? "destructive" : "success"}
                            >
                              {expired ? "Expired" : "Valid"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isMain && !expired && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="whitespace-nowrap"
                                onClick={() => handleUploadRevision(ins)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Upload Revision
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditInsurance(ins)}
                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {isMain && ins.fileName && (
                                <a
                                  href={`/uploads/insurance/${ins.fileName}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                  title="View"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                              {ins.fileName && (
                                <a
                                  href={`/uploads/insurance/${ins.fileName}`}
                                  download
                                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              )}
                              <button
                                onClick={() =>
                                  handleDeleteInsurance(ins._id)
                                }
                                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sub-Technicians Section (always visible on overview) */}
      {activeTab === "overview" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Technicians</h2>
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                onClick={handleAddSub}
              >
                <Plus className="h-4 w-4" />
                Add Technician
              </Button>
            </div>

            {(!technician.subTechnicians || technician.subTechnicians.length === 0) ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No sub-technicians added yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#EBF5FF]">
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Licence Number</TableHead>
                    <TableHead>Licence Expiry</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technician.subTechnicians.map((sub) => (
                    <TableRow key={sub._id}>
                      <TableCell className="font-medium">{sub.companyName}</TableCell>
                      <TableCell>{sub.email || "-"}</TableCell>
                      <TableCell>{sub.phone || "-"}</TableCell>
                      <TableCell>{sub.licenceNumber || "-"}</TableCell>
                      <TableCell>
                        {sub.licenceExpiry ? formatDate(sub.licenceExpiry) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditSub(sub)}
                            className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSub(sub._id)}
                            className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Sub-Technician Dialog */}
      <AddSubTechnicianDialog
        open={subDialogOpen}
        onOpenChange={setSubDialogOpen}
        onSuccess={fetchTechnician}
        parentId={id}
        subTechnician={editSub}
      />

      {/* Insurance Dialog (add / edit / revision) */}
      <InsuranceDialog
        open={insDialogOpen}
        onOpenChange={setInsDialogOpen}
        onSuccess={() => {
          fetchInsurances();
          fetchTechnician();
        }}
        technicianId={id}
        mode={insDialogMode}
        insurance={insDialogTarget}
      />

      {/* Edit Technician Dialog */}
      <TechnicianDialog
        open={techDialogOpen}
        onOpenChange={setTechDialogOpen}
        onSuccess={fetchTechnician}
        technician={{
          ...technician,
          assignedTagIds: (technician.tags || [])
            .map((t) => t.tagId?._id)
            .filter(Boolean) as string[],
        }}
      />

      {/* Tags Dialog (toggle pills) */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 pt-2">
            {availableTags.map((tag) => {
              const isAssigned = assignedTagIds.has(tag._id);
              const isSaving = tagSaving === tag._id;
              return (
                <button
                  key={tag._id}
                  disabled={isSaving}
                  onClick={() => toggleTag(tag._id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    isAssigned
                      ? "bg-cyan-500 text-white hover:bg-cyan-600"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  } ${isSaving ? "opacity-50" : ""}`}
                >
                  {tag.title}
                </button>
              );
            })}
            {availableTags.length === 0 && (
              <p className="text-sm text-gray-500">No tags available. Create tags in Settings.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
