"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Client {
  _id: string;
  companyName: string;
}

interface SiteData {
  _id: string;
  siteName: string;
  address?: string;
  siteId?: string;
}

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** When provided, the client selector is hidden and the site is created for this client */
  clientId?: string;
  /** When provided, the dialog becomes an edit dialog */
  site?: SiteData | null;
}

const EMPTY_FORM = {
  siteName: "",
  address: "",
  siteId: "",
};

export function AddSiteDialog({
  open,
  onOpenChange,
  onSuccess,
  clientId: fixedClientId,
  site,
}: AddSiteDialogProps) {
  const isEdit = !!site;

  // Client selector state (only used when fixedClientId is not provided)
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const effectiveClientId = fixedClientId || selectedClientId;

  // Populate form when editing
  useEffect(() => {
    if (open && site) {
      setForm({
        siteName: site.siteName || "",
        address: site.address || "",
        siteId: site.siteId || "",
      });
      setError("");
    } else if (open) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [open, site]);

  // Close client dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch clients on dialog open (only when no fixedClientId)
  useEffect(() => {
    if (!open || fixedClientId) return;
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        const json = await res.json();
        if (json.success) {
          const raw = json.data?.data || json.data || [];
          setClients(Array.isArray(raw) ? raw : []);
        }
      } catch {
        // silently fail
      }
    }
    fetchClients();
  }, [open, fixedClientId]);

  const filteredClients = clientSearch
    ? clients.filter((c) =>
        c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  function resetForm() {
    setSelectedClientId("");
    setClientSearch("");
    setClientDropdownOpen(false);
    setForm(EMPTY_FORM);
    setError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  }

  function handleClearClient() {
    setSelectedClientId("");
    setClientSearch("");
  }

  function handleSelectClient(id: string, name: string) {
    setSelectedClientId(id);
    setClientSearch(name);
    setClientDropdownOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!effectiveClientId) {
      setError("Client is required");
      return;
    }
    if (!form.siteName.trim()) {
      setError("Site name is required");
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/clients/${effectiveClientId}/sites/${site!._id}`
        : `/api/clients/${effectiveClientId}/sites`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: form.siteName.trim(),
          address: form.address.trim(),
          siteId: form.siteId.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${isEdit ? "update" : "create"} site`);
      }

      resetForm();
      onOpenChange(false);
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
          <DialogTitle>{isEdit ? "Edit Site" : "Add Site"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Select Client (only when no fixed clientId) */}
          {!fixedClientId && (
            <>
              <div className="flex items-center gap-4">
                <label className="w-32 shrink-0 text-sm font-medium text-gray-700">
                  Select Client
                </label>
                <div className="relative flex-1" ref={clientRef}>
                  <div className="relative">
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 pr-16 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      placeholder="Select Client"
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setClientDropdownOpen(true);
                        if (selectedClientId) setSelectedClientId("");
                      }}
                      onFocus={() => setClientDropdownOpen(true)}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {(selectedClientId || clientSearch) && (
                        <button
                          type="button"
                          onClick={handleClearClient}
                          className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                        className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {clientDropdownOpen && (
                    <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-[10px] border border-gray-200 bg-white shadow-lg">
                      {filteredClients.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No clients found
                        </div>
                      ) : (
                        filteredClients.map((c) => (
                          <button
                            key={c._id}
                            type="button"
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer ${
                              c._id === selectedClientId ? "bg-gray-50 font-medium" : ""
                            }`}
                            onClick={() =>
                              handleSelectClient(c._id, c.companyName)
                            }
                          >
                            {c.companyName}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <hr />
            </>
          )}

          {/* Site Name */}
          <div className="flex items-center gap-4">
            <label className="w-32 shrink-0 text-sm font-medium text-gray-700">
              Site Name
            </label>
            <Input
              value={form.siteName}
              onChange={(e) =>
                setForm((f) => ({ ...f, siteName: e.target.value }))
              }
            />
          </div>

          {/* Address */}
          <div className="flex items-center gap-4">
            <label className="w-32 shrink-0 text-sm font-medium text-gray-700">
              Address
            </label>
            <Input
              placeholder="Enter a location"
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </div>

          {/* Site ID */}
          <div className="flex items-center gap-4">
            <label className="w-32 shrink-0 text-sm font-medium text-gray-700">
              Site ID
            </label>
            <Input
              value={form.siteId}
              onChange={(e) =>
                setForm((f) => ({ ...f, siteId: e.target.value }))
              }
            />
          </div>

          <hr />

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {submitting && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Save Changes" : "Add Site"}
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
