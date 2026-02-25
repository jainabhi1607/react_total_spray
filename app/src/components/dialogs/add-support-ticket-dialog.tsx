"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- Types ---

interface Client {
  _id: string;
  companyName: string;
}

interface Site {
  _id: string;
  siteName: string;
  clientId?: string;
}

interface Asset {
  _id: string;
  assetNo?: string;
  machineName?: string;
  clientSiteId?: string;
}

interface Contact {
  _id: string;
  name: string;
  lastName?: string;
  email?: string;
  clientSiteId?: string;
}

interface AddSupportTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// --- Component ---

export function AddSupportTicketDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddSupportTicketDialogProps) {
  // Data lists
  const [clients, setClients] = useState<Client[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);

  // Form selections
  const [clientId, setClientId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [contactId, setContactId] = useState("");
  const [description, setDescription] = useState("");

  // New requester mode
  const [newRequesterMode, setNewRequesterMode] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPosition, setNewPosition] = useState("");

  // Client search dropdown
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  // UI state
  const [loadingClient, setLoadingClient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  // Fetch clients on dialog open
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // Fetch sites, assets, contacts when client changes
  useEffect(() => {
    if (!clientId) {
      setAllSites([]);
      setAllAssets([]);
      setAllContacts([]);
      setSiteId("");
      setAssetId("");
      setContactId("");
      return;
    }

    async function fetchClientData() {
      setLoadingClient(true);
      setSiteId("");
      setAssetId("");
      setContactId("");

      try {
        const [sitesRes, assetsRes, contactsRes] = await Promise.all([
          fetch(`/api/clients/${clientId}/sites`),
          fetch(`/api/clients/${clientId}/assets`),
          fetch(`/api/clients/${clientId}/contacts`),
        ]);

        const sitesJson = await sitesRes.json();
        const assetsJson = await assetsRes.json();
        const contactsJson = await contactsRes.json();

        if (sitesJson.success) {
          const raw = sitesJson.data?.data || sitesJson.data || [];
          setAllSites(Array.isArray(raw) ? raw : []);
        }
        if (assetsJson.success) {
          const raw = assetsJson.data?.data || assetsJson.data || [];
          setAllAssets(Array.isArray(raw) ? raw : []);
        }
        if (contactsJson.success) {
          const raw = contactsJson.data?.data || contactsJson.data || [];
          setAllContacts(Array.isArray(raw) ? raw : []);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingClient(false);
      }
    }

    fetchClientData();
  }, [clientId]);

  // Filter assets and contacts by selected site
  const filteredAssets = siteId
    ? allAssets.filter((a) => a.clientSiteId === siteId)
    : allAssets;

  const filteredContacts = siteId
    ? allContacts.filter((c) => c.clientSiteId === siteId)
    : allContacts;

  // Reset asset/contact when site changes and they no longer match
  useEffect(() => {
    if (siteId && assetId) {
      const stillValid = filteredAssets.some((a) => a._id === assetId);
      if (!stillValid) setAssetId("");
    }
    if (siteId && contactId) {
      const stillValid = filteredContacts.some((c) => c._id === contactId);
      if (!stillValid) setContactId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // Filtered client list for search
  const filteredClients = clientSearch
    ? clients.filter((c) =>
        c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  // Selected client name
  const selectedClient = clients.find((c) => c._id === clientId);

  function resetForm() {
    setClientId("");
    setSiteId("");
    setAssetId("");
    setContactId("");
    setDescription("");
    setNewRequesterMode(false);
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPhone("");
    setNewPosition("");
    setClientSearch("");
    setClientDropdownOpen(false);
    setError("");
    setAllSites([]);
    setAllAssets([]);
    setAllContacts([]);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  }

  function handleClearClient() {
    setClientId("");
    setClientSearch("");
    setSiteId("");
    setAssetId("");
    setContactId("");
    setAllSites([]);
    setAllAssets([]);
    setAllContacts([]);
  }

  function handleSelectClient(id: string, name: string) {
    setClientId(id);
    setClientSearch(name);
    setClientDropdownOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (!clientId) {
      setError("Client is required");
      return;
    }
    if (!siteId) {
      setError("Site is required");
      return;
    }
    if (!assetId) {
      setError("Asset is required");
      return;
    }
    if (!newRequesterMode && !contactId) {
      setError("Requester is required");
      return;
    }
    if (newRequesterMode && !newFirstName.trim()) {
      setError("New contact first name is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setSubmitting(true);

    try {
      let finalContactId = contactId;

      // Create new contact if in new requester mode
      if (newRequesterMode) {
        const contactPayload: Record<string, string> = {
          name: newFirstName.trim(),
        };
        if (newLastName.trim()) contactPayload.lastName = newLastName.trim();
        if (newEmail.trim()) contactPayload.email = newEmail.trim();
        if (newPhone.trim()) contactPayload.phone = newPhone.trim();
        if (newPosition.trim()) contactPayload.position = newPosition.trim();
        if (siteId) contactPayload.clientSiteId = siteId;

        const contactRes = await fetch(`/api/clients/${clientId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactPayload),
        });
        const contactJson = await contactRes.json();
        if (!contactJson.success) {
          throw new Error(contactJson.error || "Failed to create contact");
        }
        finalContactId = contactJson.data._id;
      }

      // Create the ticket
      const ticketPayload: Record<string, string> = {
        clientId,
        clientSiteId: siteId,
        clientAssetId: assetId,
        description: description.trim(),
      };
      if (finalContactId) ticketPayload.clientContactId = finalContactId;

      const res = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketPayload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to create ticket");
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
          <DialogTitle>Add Support Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Client (searchable dropdown) */}
          <div className="space-y-1.5">
            <Label>
              Client <span className="text-cyan-500">(required)</span>
            </Label>
            <div className="relative" ref={clientRef}>
              <div className="relative">
                <input
                  type="text"
                  className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 pr-16 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  placeholder="Select"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setClientDropdownOpen(true);
                    if (clientId) {
                      setClientId("");
                      setSiteId("");
                      setAssetId("");
                      setContactId("");
                      setAllSites([]);
                      setAllAssets([]);
                      setAllContacts([]);
                    }
                  }}
                  onFocus={() => setClientDropdownOpen(true)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {(clientId || clientSearch) && (
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
                          c._id === clientId ? "bg-gray-50 font-medium" : ""
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

          {/* Site + Asset side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="st-site">
                Site <span className="text-cyan-500">(required)</span>
              </Label>
              <select
                id="st-site"
                className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                disabled={!clientId || loadingClient}
              >
                <option value="">
                  {loadingClient ? "Loading..." : "Select"}
                </option>
                {allSites.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.siteName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-asset">
                Asset <span className="text-cyan-500">(required)</span>
              </Label>
              <select
                id="st-asset"
                className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                disabled={!clientId || loadingClient}
              >
                <option value="">
                  {loadingClient ? "Loading..." : "Select"}
                </option>
                {filteredAssets.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.machineName || a.assetNo || a._id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Requester */}
          {!newRequesterMode ? (
            <div className="space-y-1.5">
              <Label htmlFor="st-contact">
                Select Requester{" "}
                <span className="text-cyan-500">(required)</span>
              </Label>
              <select
                id="st-contact"
                className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                disabled={!clientId || loadingClient}
              >
                <option value="">
                  {loadingClient ? "Loading..." : "Select"}
                </option>
                {filteredContacts.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.lastName ? ` ${c.lastName}` : ""}
                    {c.email ? ` (${c.email})` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setNewRequesterMode(true);
                  setContactId("");
                }}
                className="text-sm text-cyan-500 hover:text-cyan-600 cursor-pointer"
              >
                New Requester?
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setNewRequesterMode(false);
                  setNewFirstName("");
                  setNewLastName("");
                  setNewEmail("");
                  setNewPhone("");
                  setNewPosition("");
                }}
                className="text-sm text-cyan-500 hover:text-cyan-600 cursor-pointer"
              >
                Select Existing Requester
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="st-newFirst">
                    New Contact First Name{" "}
                    <span className="text-cyan-500">(required)</span>
                  </Label>
                  <Input
                    id="st-newFirst"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="st-newLast">New Contact Last Name</Label>
                  <Input
                    id="st-newLast"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="st-newEmail">New Contact Email</Label>
                  <Input
                    id="st-newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="st-newPhone">New Contact Phone</Label>
                  <Input
                    id="st-newPhone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="st-newPosition">New Contact Position</Label>
                <Input
                  id="st-newPosition"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="st-description">
              Description of issue{" "}
              <span className="text-cyan-500">(required)</span>
            </Label>
            <Textarea
              id="st-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {submitting && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
              Add Ticket
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
