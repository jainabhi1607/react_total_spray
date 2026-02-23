"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClientData {
  _id: string;
  companyName: string;
  abn?: string;
  address?: string;
  singleSite?: number;
  status?: number;
}

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (client: { _id: string; companyName: string }) => void;
  client?: ClientData;
}

const EMPTY_FORM = {
  companyName: "",
  abn: "",
  address: "",
  singleSite: false,
  status: 1,
};

export function AddClientDialog({
  open,
  onOpenChange,
  onSuccess,
  client,
}: AddClientDialogProps) {
  const router = useRouter();
  const isEdit = !!client;

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Populate form when dialog opens with client data, or reset for add mode
  useEffect(() => {
    if (open && client) {
      setForm({
        companyName: client.companyName || "",
        abn: client.abn || "",
        address: client.address || "",
        singleSite: client.singleSite === 1,
        status: client.status ?? 1,
      });
      setError("");
    } else if (open) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [open, client]);

  function reset() {
    setForm(EMPTY_FORM);
    setError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
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

      const url = isEdit ? `/api/clients/${client._id}` : "/api/clients";
      const method = isEdit ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        companyName: form.companyName.trim(),
        abn: form.abn.trim(),
        address: form.address.trim(),
        singleSite: form.singleSite ? 1 : 0,
      };

      if (isEdit) {
        payload.status = form.status;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || `Failed to ${isEdit ? "update" : "create"} client`);
      }

      const savedClient = json.data;
      reset();
      onOpenChange(false);

      if (onSuccess) {
        onSuccess({ _id: savedClient._id, companyName: savedClient.companyName });
      } else {
        router.push(`/clients/${savedClient._id}`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} client`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Client" : "Add Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="dc-companyName">Company Name</Label>
            <Input
              id="dc-companyName"
              placeholder=""
              value={form.companyName}
              onChange={(e) =>
                setForm((f) => ({ ...f, companyName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dc-abn">ABN / GST No.</Label>
            <Input
              id="dc-abn"
              placeholder=""
              value={form.abn}
              onChange={(e) =>
                setForm((f) => ({ ...f, abn: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dc-address">Address</Label>
            <Input
              id="dc-address"
              placeholder="Enter a location"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </div>
          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="dc-status">Status</Label>
              <select
                id="dc-status"
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: parseInt(e.target.value) }))
                }
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="dc-singleSite"
              checked={form.singleSite}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, singleSite: checked === true }))
              }
            />
            <Label htmlFor="dc-singleSite" className="font-normal cursor-pointer">
              Single site company? Set as default site
            </Label>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Client"}
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
