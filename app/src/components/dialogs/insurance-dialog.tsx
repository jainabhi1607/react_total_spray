"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- Constants ---

export const POLICY_TYPES: Record<number, string> = {
  1: "Public Liability Insurance",
  2: "Professional Indemnity Insurance",
  3: "Work Cover Insurance",
};

export const POLICY_TYPE_OPTIONS = Object.entries(POLICY_TYPES).map(
  ([value, label]) => ({ value: Number(value), label })
);

export function getPolicyLabel(type?: number) {
  if (!type) return "-";
  return POLICY_TYPES[type] || "-";
}

// --- Types ---

export interface InsuranceRecord {
  _id: string;
  insurancePolicyType?: number;
  expiryDate?: string;
  fileName?: string;
  fileSize?: string;
  groupNumber?: number;
  createdAt?: string;
  status?: number;
}

interface InsuranceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  technicianId: string;
  mode: "add" | "edit" | "revision";
  insurance?: InsuranceRecord;
}

// --- Upload helper ---

function uploadFile(
  file: File,
  folder: string,
  onProgress: (pct: number) => void
): Promise<{ url: string; fileName: string; fileSize: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener("load", () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (json.success) resolve(json.data);
        else reject(new Error(json.error || "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}

// --- Component ---

export function InsuranceDialog({
  open,
  onOpenChange,
  onSuccess,
  technicianId,
  mode,
  insurance,
}: InsuranceDialogProps) {
  const [policyType, setPolicyType] = useState(0);
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setFile(null);
    setProgress(0);

    if (mode === "edit" && insurance) {
      setPolicyType(insurance.insurancePolicyType || 0);
      setExpiryDate(
        insurance.expiryDate
          ? new Date(insurance.expiryDate).toISOString().split("T")[0]
          : ""
      );
    } else if (mode === "revision" && insurance) {
      setPolicyType(insurance.insurancePolicyType || 0);
      setExpiryDate(
        insurance.expiryDate
          ? new Date(insurance.expiryDate).toISOString().split("T")[0]
          : ""
      );
    } else {
      setPolicyType(0);
      setExpiryDate("");
    }
  }, [open, mode, insurance]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "add" && !policyType) {
      setError("Please select an insurance policy type");
      return;
    }
    if (!expiryDate) {
      setError("Expiry date is required");
      return;
    }
    if (mode === "add" && !file) {
      setError("Please select a file");
      return;
    }
    if (mode === "revision" && !file) {
      setError("Please select a file");
      return;
    }

    try {
      setSubmitting(true);

      let fileName = "";
      let fileSize = "";

      if (file) {
        const result = await uploadFile(file, "insurance", setProgress);
        fileName = result.fileName;
        fileSize = String(result.fileSize);
      }

      if (mode === "add") {
        const res = await fetch(`/api/technicians/${technicianId}/insurance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            insurancePolicyType: policyType,
            expiryDate,
            fileName,
            fileSize,
            groupNumber: Date.now(),
          }),
        });
        const json = await res.json();
        if (!json.success)
          throw new Error(json.error || json.message || "Failed to add insurance");
      } else if (mode === "edit" && insurance) {
        const res = await fetch(
          `/api/technicians/${technicianId}/insurance/${insurance._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expiryDate }),
          }
        );
        const json = await res.json();
        if (!json.success)
          throw new Error(json.error || json.message || "Failed to update insurance");
      } else if (mode === "revision" && insurance) {
        // Create a new record with same groupNumber and policyType
        const res = await fetch(`/api/technicians/${technicianId}/insurance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            insurancePolicyType: insurance.insurancePolicyType,
            expiryDate,
            fileName,
            fileSize,
            groupNumber: insurance.groupNumber,
          }),
        });
        const json = await res.json();
        if (!json.success)
          throw new Error(json.error || json.message || "Failed to upload revision");

        // Mark old insurance as invalid
        await fetch(
          `/api/technicians/${technicianId}/insurance/${insurance._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: 2 }),
          }
        );
      }

      handleOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    mode === "add"
      ? "Add Insurance"
      : mode === "edit"
        ? "Edit Insurance"
        : "Upload Revision";

  const submitLabel =
    mode === "add" ? "Add Insurance" : "Update";

  const showFileInput = mode === "add" || mode === "revision";
  const showPolicyDropdown = mode === "add";
  const policyLabel = getPolicyLabel(policyType);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-0 pt-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 mb-4">
              {error}
            </div>
          )}

          {/* Insurance Policy Type */}
          <div className="flex items-center gap-4 py-4 border-b border-gray-100">
            <span className="w-44 shrink-0 text-sm text-gray-600">
              Insurance Policy Type
            </span>
            {showPolicyDropdown ? (
              <select
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                value={policyType}
                onChange={(e) => setPolicyType(Number(e.target.value))}
              >
                <option value={0}>Select</option>
                {POLICY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-medium text-gray-900">
                {policyLabel}
              </span>
            )}
          </div>

          {/* Expiry Date */}
          <div className="flex items-center gap-4 py-4 border-b border-gray-100">
            <span className="w-44 shrink-0 text-sm text-gray-600">
              Expiry Date
            </span>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Select File */}
          {showFileInput && (
            <div className="flex items-center gap-4 py-4 border-b border-gray-100">
              <span className="w-44 shrink-0 text-sm text-gray-600">
                Select File
              </span>
              <Input
                type="file"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setProgress(0);
                }}
                className="w-full"
              />
            </div>
          )}

          {/* Progress */}
          {showFileInput && (
            <div className="flex items-center gap-4 py-4">
              <span className="w-44 shrink-0 text-sm text-gray-600">
                Progress
              </span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-5">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {submitting && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
              {submitLabel}
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
