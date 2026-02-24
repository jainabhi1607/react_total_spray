"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AvailableTag {
  _id: string;
  title: string;
}

export interface TechnicianData {
  _id: string;
  companyName: string;
  email?: string;
  phone?: string;
  abn?: string;
  address?: string;
  licenceNumber?: string;
  licenceExpiry?: string;
  assignedTagIds?: string[];
}

interface TechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  technician?: TechnicianData;
}

const EMPTY_FORM = {
  companyName: "",
  email: "",
  phone: "",
  abn: "",
  address: "",
  licenceNumber: "",
  licenceExpiry: "",
};

export function TechnicianDialog({
  open,
  onOpenChange,
  onSuccess,
  technician,
}: TechnicianDialogProps) {
  const isEdit = !!technician;

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (open) {
      fetchTags();
      if (technician) {
        setForm({
          companyName: technician.companyName || "",
          email: technician.email || "",
          phone: technician.phone || "",
          abn: technician.abn || "",
          address: technician.address || "",
          licenceNumber: technician.licenceNumber || "",
          licenceExpiry: technician.licenceExpiry
            ? new Date(technician.licenceExpiry).toISOString().split("T")[0]
            : "",
        });
        setSelectedTagIds(new Set(technician.assignedTagIds || []));
      } else {
        setForm(EMPTY_FORM);
        setSelectedTagIds(new Set());
      }
      setError("");
    }
  }, [open, technician, fetchTags]);

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setForm(EMPTY_FORM);
      setSelectedTagIds(new Set());
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.companyName.trim()) {
      setError("Company name is required");
      return;
    }

    try {
      setSubmitting(true);

      const url = isEdit
        ? `/api/technicians/${technician._id}`
        : "/api/technicians";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          abn: form.abn.trim(),
          address: form.address.trim(),
          licenceNumber: form.licenceNumber.trim(),
          licenceExpiry: form.licenceExpiry || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(
          json.error || json.message || "Failed to save technician"
        );
      }

      // Sync tags — works for both add (new ID from response) and edit
      const techId = isEdit ? technician._id : json.data._id;
      await fetch(`/api/technicians/${techId}/tags`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: Array.from(selectedTagIds) }),
      });

      handleOpenChange(false);
      onSuccess?.();
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
          <DialogTitle>
            {isEdit ? "Edit Technician" : "Add Technician"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="dt-companyName">Company Name</Label>
            <Input
              id="dt-companyName"
              value={form.companyName}
              onChange={(e) =>
                setForm((f) => ({ ...f, companyName: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dt-email">Email</Label>
              <Input
                id="dt-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dt-phone">Contact Number</Label>
              <Input
                id="dt-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dt-abn">ABN</Label>
              <Input
                id="dt-abn"
                value={form.abn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, abn: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dt-address">Address</Label>
              <Input
                id="dt-address"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dt-licence">Licence Number</Label>
              <Input
                id="dt-licence"
                value={form.licenceNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, licenceNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dt-expiry">Licence Expiry</Label>
              <Input
                id="dt-expiry"
                type="date"
                value={form.licenceExpiry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, licenceExpiry: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTagIds.has(tag._id);
                return (
                  <button
                    key={tag._id}
                    type="button"
                    onClick={() => toggleTag(tag._id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-cyan-500 text-white hover:bg-cyan-600"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tag.title}
                  </button>
                );
              })}
              {availableTags.length === 0 && (
                <p className="text-sm text-gray-400">No tags available</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {submitting && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
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
