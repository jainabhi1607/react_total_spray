"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  X,
  FileText,
  Shield,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading, InlineLoading } from "@/components/ui/loading";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

// --- Types ---

interface TechnicianDetail {
  _id: string;
  companyName: string;
  email: string;
  phone: string;
  abn: string;
  licenceNumber: string;
  licenceExpiry: string;
  address: string;
  notes: string;
  status: number;
  insurances: Insurance[];
  tags: TechTag[];
}

interface Insurance {
  _id: string;
  type: number;
  expiryDate: string;
  fileName: string;
  status?: string;
}

interface TechTag {
  _id: string;
  name: string;
  color?: string;
}

interface AvailableTag {
  _id: string;
  name: string;
  color?: string;
}

// --- Constants ---

const INSURANCE_TYPE_LABELS: Record<number, string> = {
  1: "Public Liability",
  2: "Workers Comp",
  3: "Professional Indemnity",
};

function getInsuranceStatusBadge(expiryDate: string, status?: string) {
  if (status) {
    switch (status.toLowerCase()) {
      case "valid":
        return <Badge variant="success">Valid</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
    }
  }
  // Fallback: compare expiry date
  const expiry = new Date(expiryDate);
  const now = new Date();
  if (expiry < now) {
    return <Badge variant="destructive">Expired</Badge>;
  }
  return <Badge variant="success">Valid</Badge>;
}

function getTechStatusBadge(status: number) {
  switch (status) {
    case 1:
      return <Badge variant="success">Active</Badge>;
    case 0:
      return <Badge variant="secondary">Inactive</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

// --- Page ---

export default function TechnicianDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [technician, setTechnician] = useState<TechnicianDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Insurance dialog state
  const [insuranceDialogOpen, setInsuranceDialogOpen] = useState(false);
  const [insuranceForm, setInsuranceForm] = useState({
    type: "",
    expiryDate: "",
    fileName: "",
  });
  const [insuranceSaving, setInsuranceSaving] = useState(false);

  // Tags state
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [tagSaving, setTagSaving] = useState(false);

  const fetchTechnician = useCallback(async () => {
    try {
      const res = await fetch(`/api/technicians/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load technician");
      }
      setTechnician(json.data);
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
        setAvailableTags(json.data || []);
      }
    } catch {
      // Tags fetch is non-critical
    }
  }, []);

  useEffect(() => {
    fetchTechnician();
    fetchTags();
  }, [fetchTechnician, fetchTags]);

  // --- Insurance handlers ---

  async function handleAddInsurance() {
    if (!insuranceForm.type || !insuranceForm.expiryDate) return;

    setInsuranceSaving(true);
    try {
      const res = await fetch(`/api/technicians/${id}/insurance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: parseInt(insuranceForm.type),
          expiryDate: insuranceForm.expiryDate,
          fileName: insuranceForm.fileName,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add insurance");
      }
      setInsuranceDialogOpen(false);
      setInsuranceForm({ type: "", expiryDate: "", fileName: "" });
      fetchTechnician();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInsuranceSaving(false);
    }
  }

  async function handleDeleteInsurance(insuranceId: string) {
    if (!confirm("Are you sure you want to delete this insurance record?"))
      return;

    try {
      const res = await fetch(
        `/api/technicians/${id}/insurance/${insuranceId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete insurance");
      }
      fetchTechnician();
    } catch (err: any) {
      alert(err.message);
    }
  }

  // --- Tag handlers ---

  async function handleAddTag() {
    if (!selectedTagId) return;

    setTagSaving(true);
    try {
      const res = await fetch(`/api/technicians/${id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: selectedTagId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add tag");
      }
      setSelectedTagId("");
      fetchTechnician();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTagSaving(false);
    }
  }

  async function handleRemoveTag(tagId: string) {
    try {
      const res = await fetch(`/api/technicians/${id}/tags/${tagId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to remove tag");
      }
      fetchTechnician();
    } catch (err: any) {
      alert(err.message);
    }
  }

  // --- Rendering ---

  if (loading) {
    return <PageLoading />;
  }

  if (error || !technician) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load technician
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {error || "Technician not found"}
          </p>
          <Link href="/technicians" className="mt-4 inline-block">
            <Button variant="outline">Back to Technicians</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter tags that are already assigned
  const assignedTagIds = new Set(technician.tags?.map((t) => t._id) || []);
  const unassignedTags = availableTags.filter(
    (t) => !assignedTagIds.has(t._id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/technicians">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {technician.companyName}
              </h1>
              {getTechStatusBadge(technician.status)}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Technician company details
            </p>
          </div>
        </div>
        <Link href={`/technicians/${id}/edit`}>
          <Button variant="outline">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <FileText className="mr-1.5 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insurance">
            <Shield className="mr-1.5 h-4 w-4" />
            Insurance
          </TabsTrigger>
          <TabsTrigger value="tags">
            <Tag className="mr-1.5 h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Company Name
                  </p>
                  <p className="text-sm text-gray-900">
                    {technician.companyName || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">ABN</p>
                  <p className="text-sm text-gray-900">
                    {technician.abn || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">
                    {technician.email || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">
                    {technician.phone || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Licence Number
                  </p>
                  <p className="text-sm text-gray-900">
                    {technician.licenceNumber || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Licence Expiry
                  </p>
                  <p className="text-sm text-gray-900">
                    {technician.licenceExpiry
                      ? formatDate(technician.licenceExpiry)
                      : "-"}
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">
                    {technician.address || "-"}
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="whitespace-pre-wrap text-sm text-gray-900">
                    {technician.notes || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Insurance Documents</CardTitle>
              <Button
                size="sm"
                onClick={() => setInsuranceDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Insurance
              </Button>
            </CardHeader>
            <CardContent>
              {(!technician.insurances ||
                technician.insurances.length === 0) ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">
                    No insurance records found
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {technician.insurances.map((ins) => (
                      <TableRow key={ins._id}>
                        <TableCell className="font-medium">
                          {INSURANCE_TYPE_LABELS[ins.type] || "Other"}
                        </TableCell>
                        <TableCell>
                          {ins.expiryDate
                            ? formatDate(ins.expiryDate)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {ins.fileName ? (
                            <span className="text-sm text-blue-600">
                              {ins.fileName}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {getInsuranceStatusBadge(
                            ins.expiryDate,
                            ins.status
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteInsurance(ins._id)}
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

          {/* Add Insurance Dialog */}
          <Dialog
            open={insuranceDialogOpen}
            onOpenChange={setInsuranceDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Insurance</DialogTitle>
                <DialogDescription>
                  Add a new insurance record for this technician.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Insurance Type</Label>
                  <Select
                    value={insuranceForm.type}
                    onValueChange={(value) =>
                      setInsuranceForm((prev) => ({
                        ...prev,
                        type: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Public Liability</SelectItem>
                      <SelectItem value="2">Workers Comp</SelectItem>
                      <SelectItem value="3">
                        Professional Indemnity
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={insuranceForm.expiryDate}
                    onChange={(e) =>
                      setInsuranceForm((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>File Name</Label>
                  <Input
                    value={insuranceForm.fileName}
                    onChange={(e) =>
                      setInsuranceForm((prev) => ({
                        ...prev,
                        fileName: e.target.value,
                      }))
                    }
                    placeholder="e.g. public-liability-2025.pdf"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setInsuranceDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddInsurance}
                  disabled={
                    insuranceSaving ||
                    !insuranceForm.type ||
                    !insuranceForm.expiryDate
                  }
                >
                  {insuranceSaving ? (
                    <>
                      <InlineLoading />
                      Saving...
                    </>
                  ) : (
                    "Add Insurance"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assigned tags */}
              <div className="flex flex-wrap gap-2">
                {(!technician.tags || technician.tags.length === 0) ? (
                  <p className="text-sm text-gray-500">No tags assigned</p>
                ) : (
                  technician.tags.map((tag) => (
                    <Badge
                      key={tag._id}
                      variant="default"
                      className="flex items-center gap-1 pl-3 pr-1.5 py-1"
                    >
                      {tag.name}
                      <button
                        onClick={() => handleRemoveTag(tag._id)}
                        className="ml-1 rounded-full p-0.5 hover:bg-blue-200 transition-colors"
                        aria-label={`Remove tag ${tag.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>

              {/* Add tag */}
              {unassignedTags.length > 0 && (
                <div className="flex items-end gap-3 pt-2">
                  <div className="flex-1 space-y-2">
                    <Label>Add Tag</Label>
                    <Select
                      value={selectedTagId}
                      onValueChange={setSelectedTagId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedTags.map((tag) => (
                          <SelectItem key={tag._id} value={tag._id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddTag}
                    disabled={tagSaving || !selectedTagId}
                    size="default"
                  >
                    {tagSaving ? <InlineLoading /> : <Plus className="h-4 w-4" />}
                    Add
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
