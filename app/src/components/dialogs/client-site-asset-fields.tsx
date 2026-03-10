"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export interface ClientSiteAssetState {
  clientId: string;
  siteId: string;
  assetId: string;
  contactId: string;
  newRequesterMode: boolean;
  newFirstName: string;
  newLastName: string;
  newEmail: string;
  newPhone: string;
  newPosition: string;
}

export const initialClientSiteAssetState: ClientSiteAssetState = {
  clientId: "",
  siteId: "",
  assetId: "",
  contactId: "",
  newRequesterMode: false,
  newFirstName: "",
  newLastName: "",
  newEmail: "",
  newPhone: "",
  newPosition: "",
};

interface ClientSiteAssetFieldsProps {
  state: ClientSiteAssetState;
  onChange: (state: ClientSiteAssetState) => void;
}

export function ClientSiteAssetFields({
  state,
  onChange,
}: ClientSiteAssetFieldsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);

  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  const [loadingClient, setLoadingClient] = useState(false);
  const userChangedSiteRef = useRef(false);

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

  // Fetch clients on mount
  useEffect(() => {
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
  }, []);

  // Fetch sites, assets, contacts when client changes
  useEffect(() => {
    if (!state.clientId) {
      setAllSites([]);
      setAllAssets([]);
      setAllContacts([]);
      return;
    }

    async function fetchClientData() {
      setLoadingClient(true);
      try {
        const [sitesRes, assetsRes, contactsRes] = await Promise.all([
          fetch(`/api/clients/${state.clientId}/sites`),
          fetch(`/api/clients/${state.clientId}/assets`),
          fetch(`/api/clients/${state.clientId}/contacts`),
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
  }, [state.clientId]);

  // Filter assets and contacts by selected site
  const filteredAssets = state.siteId
    ? allAssets.filter((a) => a.clientSiteId === state.siteId)
    : allAssets;

  const filteredContacts = state.siteId
    ? allContacts.filter((c) => c.clientSiteId === state.siteId)
    : allContacts;

  // Reset asset/contact when user manually changes site
  useEffect(() => {
    if (!userChangedSiteRef.current) return;
    userChangedSiteRef.current = false;
    if (state.siteId && state.assetId) {
      const stillValid = filteredAssets.some((a) => a._id === state.assetId);
      if (!stillValid) onChange({ ...state, assetId: "" });
    }
    if (state.siteId && state.contactId) {
      const stillValid = filteredContacts.some((c) => c._id === state.contactId);
      if (!stillValid) onChange({ ...state, contactId: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.siteId]);

  // Sync client search text with selected client name
  useEffect(() => {
    if (state.clientId) {
      const c = clients.find((c) => c._id === state.clientId);
      if (c && clientSearch !== c.companyName) {
        setClientSearch(c.companyName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.clientId, clients]);

  const filteredClients = clientSearch
    ? clients.filter((c) =>
        c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  function handleClearClient() {
    setClientSearch("");
    onChange({
      ...state,
      clientId: "",
      siteId: "",
      assetId: "",
      contactId: "",
    });
    setAllSites([]);
    setAllAssets([]);
    setAllContacts([]);
  }

  function handleSelectClient(id: string, name: string) {
    setClientSearch(name);
    setClientDropdownOpen(false);
    onChange({
      ...state,
      clientId: id,
      siteId: "",
      assetId: "",
      contactId: "",
    });
  }

  return (
    <>
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
                if (state.clientId) {
                  onChange({
                    ...state,
                    clientId: "",
                    siteId: "",
                    assetId: "",
                    contactId: "",
                  });
                  setAllSites([]);
                  setAllAssets([]);
                  setAllContacts([]);
                }
              }}
              onFocus={() => setClientDropdownOpen(true)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {(state.clientId || clientSearch) && (
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
                      c._id === state.clientId ? "bg-gray-50 font-medium" : ""
                    }`}
                    onClick={() => handleSelectClient(c._id, c.companyName)}
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
          <Label htmlFor="csaf-site">
            Site <span className="text-cyan-500">(required)</span>
          </Label>
          <select
            id="csaf-site"
            className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
            value={state.siteId}
            onChange={(e) => {
              userChangedSiteRef.current = true;
              onChange({ ...state, siteId: e.target.value });
            }}
            disabled={!state.clientId || loadingClient}
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
          <Label htmlFor="csaf-asset">
            Asset <span className="text-cyan-500">(required)</span>
          </Label>
          <select
            id="csaf-asset"
            className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
            value={state.assetId}
            onChange={(e) => onChange({ ...state, assetId: e.target.value })}
            disabled={!state.clientId || loadingClient}
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
      {!state.newRequesterMode ? (
        <div className="space-y-1.5">
          <Label htmlFor="csaf-contact">
            Select Requester{" "}
            <span className="text-cyan-500">(required)</span>
          </Label>
          <select
            id="csaf-contact"
            className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
            value={state.contactId}
            onChange={(e) => onChange({ ...state, contactId: e.target.value })}
            disabled={!state.clientId || loadingClient}
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
            onClick={() =>
              onChange({ ...state, newRequesterMode: true, contactId: "" })
            }
            className="text-sm text-cyan-500 hover:text-cyan-600 cursor-pointer"
          >
            New Requester?
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() =>
              onChange({
                ...state,
                newRequesterMode: false,
                newFirstName: "",
                newLastName: "",
                newEmail: "",
                newPhone: "",
                newPosition: "",
              })
            }
            className="text-sm text-cyan-500 hover:text-cyan-600 cursor-pointer"
          >
            Select Existing Requester
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="csaf-newFirst">
                New Contact First Name{" "}
                <span className="text-cyan-500">(required)</span>
              </Label>
              <Input
                id="csaf-newFirst"
                value={state.newFirstName}
                onChange={(e) =>
                  onChange({ ...state, newFirstName: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="csaf-newLast">New Contact Last Name</Label>
              <Input
                id="csaf-newLast"
                value={state.newLastName}
                onChange={(e) =>
                  onChange({ ...state, newLastName: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="csaf-newEmail">New Contact Email</Label>
              <Input
                id="csaf-newEmail"
                type="email"
                value={state.newEmail}
                onChange={(e) =>
                  onChange({ ...state, newEmail: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="csaf-newPhone">New Contact Phone</Label>
              <Input
                id="csaf-newPhone"
                value={state.newPhone}
                onChange={(e) =>
                  onChange({ ...state, newPhone: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="csaf-newPosition">New Contact Position</Label>
            <Input
              id="csaf-newPosition"
              value={state.newPosition}
              onChange={(e) =>
                onChange({ ...state, newPosition: e.target.value })
              }
            />
          </div>
        </div>
      )}
    </>
  );
}

// Helper to create a new contact from the new requester fields
export async function createNewContact(
  clientId: string,
  siteId: string,
  state: ClientSiteAssetState
): Promise<string> {
  const contactPayload: Record<string, string> = {
    name: state.newFirstName.trim(),
  };
  if (state.newLastName.trim()) contactPayload.lastName = state.newLastName.trim();
  if (state.newEmail.trim()) contactPayload.email = state.newEmail.trim();
  if (state.newPhone.trim()) contactPayload.phone = state.newPhone.trim();
  if (state.newPosition.trim()) contactPayload.position = state.newPosition.trim();
  if (siteId) contactPayload.clientSiteId = siteId;

  const res = await fetch(`/api/clients/${clientId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contactPayload),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Failed to create contact");
  }
  return json.data._id;
}

// Validation helper
export function validateClientSiteAsset(state: ClientSiteAssetState): string | null {
  if (!state.clientId) return "Client is required";
  if (!state.siteId) return "Site is required";
  if (!state.assetId) return "Asset is required";
  if (!state.newRequesterMode && !state.contactId) return "Requester is required";
  if (state.newRequesterMode && !state.newFirstName.trim()) return "New contact first name is required";
  return null;
}
