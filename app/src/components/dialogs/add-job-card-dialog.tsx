"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClientSiteAssetFields,
  ClientSiteAssetState,
  initialClientSiteAssetState,
  createNewContact,
  validateClientSiteAsset,
} from "@/components/dialogs/client-site-asset-fields";

interface JobCardType {
  _id: string;
  title: string;
}

export interface JobCardEditData {
  _id: string;
  ticketNo?: number;
  clientId?: { _id: string } | string;
  clientSiteId?: { _id: string } | string;
  clientAssetId?: { _id: string } | string;
  clientContactId?: { _id: string } | string;
  jobCardType?: { _id: string } | string;
}

interface AddJobCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: JobCardEditData | null;
  recurring?: boolean;
}

export function AddJobCardDialog({
  open,
  onOpenChange,
  onSuccess,
  editData,
  recurring = false,
}: AddJobCardDialogProps) {
  const isEdit = !!editData;
  const [fields, setFields] = useState<ClientSiteAssetState>(initialClientSiteAssetState);
  const [jobCardTypes, setJobCardTypes] = useState<JobCardType[]>([]);
  const [jobCardTypeId, setJobCardTypeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/settings/job-card-types")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setJobCardTypes(json.data || []);
      })
      .catch(() => {});
  }, [open]);

  // Pre-fill form when editing
  useEffect(() => {
    if (!open || !editData) return;

    const clientId = typeof editData.clientId === "object" ? editData.clientId?._id : editData.clientId || "";
    const siteId = typeof editData.clientSiteId === "object" ? editData.clientSiteId?._id : editData.clientSiteId || "";
    const assetId = typeof editData.clientAssetId === "object" ? editData.clientAssetId?._id : editData.clientAssetId || "";
    const contactId = typeof editData.clientContactId === "object" ? editData.clientContactId?._id : editData.clientContactId || "";
    const typeId = typeof editData.jobCardType === "object" ? editData.jobCardType?._id : editData.jobCardType || "";

    setFields({
      ...initialClientSiteAssetState,
      clientId,
      siteId,
      assetId,
      contactId,
    });
    setJobCardTypeId(typeId);
  }, [open, editData]);

  function resetForm() {
    setFields(initialClientSiteAssetState);
    setJobCardTypeId("");
    setError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validateClientSiteAsset(fields);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      let finalContactId = fields.contactId;
      if (fields.newRequesterMode) {
        finalContactId = await createNewContact(fields.clientId, fields.siteId, fields);
      }

      const payload: Record<string, any> = {
        clientId: fields.clientId,
        clientSiteId: fields.siteId,
        clientAssetId: fields.assetId,
      };
      if (finalContactId) payload.clientContactId = finalContactId;
      if (jobCardTypeId) payload.jobCardType = jobCardTypeId;
      if (recurring) payload.recurringJob = 1;

      const url = isEdit ? `/api/job-cards/${editData!._id}` : "/api/job-cards";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || `Failed to ${isEdit ? "update" : "create"} job card`);
      }

      resetForm();
      onOpenChange(false);
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
          <DialogTitle>{isEdit ? "Edit Job Card" : recurring ? "Create Recurring Job Card" : "Add Job Card"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {recurring && !isEdit && (
            <p className="text-sm text-gray-500">You are about to create a recurring job card template.</p>
          )}
          {error && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <ClientSiteAssetFields state={fields} onChange={setFields} />

          {/* Job Card Type */}
          <div className="space-y-1.5">
            <Label htmlFor="jc-type">Job Card Type</Label>
            <select
              id="jc-type"
              className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
              value={jobCardTypeId}
              onChange={(e) => setJobCardTypeId(e.target.value)}
            >
              <option value="">Select</option>
              {jobCardTypes.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {isEdit ? "Update" : recurring ? "Create Recurring Job Card" : "Add Job Card"}
            </Button>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
