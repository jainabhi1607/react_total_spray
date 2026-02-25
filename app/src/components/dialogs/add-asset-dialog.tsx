"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- Types ---

interface Client {
  _id: string;
  companyName: string;
}

interface SiteOption {
  _id: string;
  siteName: string;
}

interface AssetTypeOption {
  _id: string;
  title: string;
}

interface AssetMakeOption {
  _id: string;
  title: string;
}

interface AssetModelOption {
  _id: string;
  title: string;
  assetTypeId?: string;
}

interface AssetMakeModelMapping {
  _id: string;
  assetMakeId: string;
  assetModelId: string;
}

export interface AssetData {
  _id: string;
  machineName: string;
  serialNo?: string;
  clientSiteId?: string;
  assetTypeId?: string;
  assetMakeId?: string | { _id: string; title: string };
  assetModelId?: string | { _id: string; title: string };
}

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** When provided, the client selector is hidden and sites are loaded for this client */
  clientId?: string;
  /** Sites to use (when clientId is provided from parent) */
  sites?: SiteOption[];
  /** When provided, the dialog becomes an edit dialog */
  asset?: AssetData | null;
}

export function AddAssetDialog({
  open,
  onOpenChange,
  onSuccess,
  clientId: fixedClientId,
  sites: fixedSites,
  asset,
}: AddAssetDialogProps) {
  const isEdit = !!asset;

  // Client selector state (only when no fixedClientId)
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  // Sites loaded when client is selected (only when no fixedClientId)
  const [loadedSites, setLoadedSites] = useState<SiteOption[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  const effectiveClientId = fixedClientId || selectedClientId;
  const effectiveSites = fixedClientId ? (fixedSites || []) : loadedSites;

  // Form fields
  const [machineName, setMachineName] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [clientSiteId, setClientSiteId] = useState("");

  // Asset settings data
  const [assetTypes, setAssetTypes] = useState<AssetTypeOption[]>([]);
  const [assetMakes, setAssetMakes] = useState<AssetMakeOption[]>([]);
  const [assetModels, setAssetModels] = useState<AssetModelOption[]>([]);
  const [makeModelMappings, setMakeModelMappings] = useState<AssetMakeModelMapping[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Selection state
  const [selectedTypeIds, setSelectedTypeIds] = useState<Set<string>>(new Set());
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");

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

  // Fetch sites when client changes (only when no fixedClientId)
  useEffect(() => {
    if (fixedClientId || !selectedClientId) {
      setLoadedSites([]);
      return;
    }
    async function fetchSites() {
      setLoadingSites(true);
      try {
        const res = await fetch(`/api/clients/${selectedClientId}/sites`);
        const json = await res.json();
        if (json.success) {
          const raw = json.data?.data || json.data || [];
          setLoadedSites(Array.isArray(raw) ? raw : []);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingSites(false);
      }
    }
    fetchSites();
  }, [selectedClientId, fixedClientId]);

  // Fetch asset settings on dialog open
  const fetchAssetSettings = async (editAsset?: AssetData | null) => {
    setLoadingSettings(true);
    try {
      const [typesRes, makesRes, modelsRes, mappingsRes] = await Promise.all([
        fetch("/api/settings/asset-types").then((r) => r.json()),
        fetch("/api/settings/asset-makes").then((r) => r.json()),
        fetch("/api/settings/asset-models").then((r) => r.json()),
        fetch("/api/settings/asset-make-models").then((r) => r.json()),
      ]);

      const types = typesRes.success ? typesRes.data : [];
      const makes = makesRes.success ? makesRes.data : [];
      const models = modelsRes.success ? modelsRes.data : [];
      const mappings = mappingsRes.success ? mappingsRes.data : [];

      setAssetTypes(types);
      setAssetMakes(makes);
      setAssetModels(models);
      setMakeModelMappings(mappings);

      // Select all types by default
      setSelectedTypeIds(new Set(types.map((t: AssetTypeOption) => t._id)));

      // If editing, pre-select make and model
      if (editAsset) {
        const makeId = typeof editAsset.assetMakeId === "object" ? editAsset.assetMakeId._id : editAsset.assetMakeId || "";
        const modelId = typeof editAsset.assetModelId === "object" ? editAsset.assetModelId._id : editAsset.assetModelId || "";
        setSelectedMakeId(makeId);
        setSelectedModelId(modelId);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSettings(false);
    }
  };

  // Load settings and populate form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (asset) {
      setMachineName(asset.machineName);
      setSerialNo(asset.serialNo || "");
      setClientSiteId(asset.clientSiteId || "");
      setError("");
      fetchAssetSettings(asset);
    } else {
      setMachineName("");
      setSerialNo("");
      setClientSiteId("");
      setSelectedMakeId("");
      setSelectedModelId("");
      setError("");
      fetchAssetSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset]);

  const sortedClients = [...clients].sort((a, b) =>
    a.companyName.localeCompare(b.companyName)
  );

  const filteredClients = clientSearch
    ? sortedClients.filter((c) =>
        c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : sortedClients;

  // Toggle a type selection
  const toggleType = (typeId: string) => {
    setSelectedTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return next;
    });
    setSelectedMakeId("");
    setSelectedModelId("");
  };

  // Compute filtered makes based on selected types
  const filteredMakes = (() => {
    if (selectedTypeIds.size === 0) return [];
    const typeModelIds = new Set(
      assetModels
        .filter((m) => m.assetTypeId && selectedTypeIds.has(m.assetTypeId))
        .map((m) => m._id)
    );
    const validMakeIds = new Set(
      makeModelMappings
        .filter((mm) => typeModelIds.has(mm.assetModelId))
        .map((mm) => mm.assetMakeId)
    );
    if (selectedTypeIds.size === assetTypes.length) {
      return assetMakes;
    }
    return assetMakes.filter((m) => validMakeIds.has(m._id));
  })();

  // Compute filtered models for the selected make
  const filteredModels = (() => {
    if (!selectedMakeId) return [];
    const mappedModelIds = new Set(
      makeModelMappings
        .filter((mm) => mm.assetMakeId === selectedMakeId)
        .map((mm) => mm.assetModelId)
    );
    return assetModels.filter(
      (m) =>
        mappedModelIds.has(m._id) &&
        (!m.assetTypeId || selectedTypeIds.has(m.assetTypeId))
    );
  })();

  // Clear model if make changes and current model is not valid
  useEffect(() => {
    if (selectedModelId && !filteredModels.find((m) => m._id === selectedModelId)) {
      setSelectedModelId("");
    }
  }, [selectedMakeId, filteredModels, selectedModelId]);

  // Clear make if it's no longer in filtered makes
  useEffect(() => {
    if (selectedMakeId && !filteredMakes.find((m) => m._id === selectedMakeId)) {
      setSelectedMakeId("");
      setSelectedModelId("");
    }
  }, [selectedTypeIds, filteredMakes, selectedMakeId]);

  function resetForm() {
    setSelectedClientId("");
    setClientSearch("");
    setClientDropdownOpen(false);
    setLoadedSites([]);
    setMachineName("");
    setSerialNo("");
    setClientSiteId("");
    setSelectedTypeIds(new Set(assetTypes.map((t) => t._id)));
    setSelectedMakeId("");
    setSelectedModelId("");
    setError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  }

  function handleClearClient() {
    setSelectedClientId("");
    setClientSearch("");
    setClientSiteId("");
    setLoadedSites([]);
  }

  function handleSelectClient(id: string, name: string) {
    setSelectedClientId(id);
    setClientSearch(name);
    setClientDropdownOpen(false);
    setClientSiteId("");
  }

  async function handleSubmit() {
    setError("");

    if (!effectiveClientId) {
      setError("Client is required");
      return;
    }
    if (!machineName.trim()) {
      setError("Machine name is required");
      return;
    }

    setSubmitting(true);
    try {
      // Determine the assetTypeId from the selected model if available
      let assetTypeId: string | undefined;
      if (selectedModelId) {
        const model = assetModels.find((m) => m._id === selectedModelId);
        if (model?.assetTypeId) assetTypeId = model.assetTypeId;
      }

      const payload = {
        machineName: machineName.trim(),
        serialNo: serialNo.trim() || undefined,
        clientSiteId: clientSiteId || undefined,
        assetTypeId,
        assetMakeId: selectedMakeId || undefined,
        assetModelId: selectedModelId || undefined,
      };

      const url = isEdit
        ? `/api/clients/${effectiveClientId}/assets/${asset!._id}`
        : `/api/clients/${effectiveClientId}/assets`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || `Failed to ${isEdit ? "update" : "add"} asset`);

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
      <DialogContent className="max-w-4xl p-0 gap-0 [&>button]:right-[50px] [&>button]:top-6">
        {/* Header */}
        <DialogHeader className="px-[50px] pt-6 pb-4">
          <div className="flex items-center gap-3 pr-6">
            <DialogTitle className="shrink-0 text-base font-semibold">
              {isEdit ? "Edit Asset" : "Add Asset"}
            </DialogTitle>

            {/* Client searchable dropdown (only when no fixed clientId) */}
            {!fixedClientId && (
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
                      if (selectedClientId) {
                        setSelectedClientId("");
                        setClientSiteId("");
                        setLoadedSites([]);
                      }
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
            )}

            {/* Site dropdown */}
            <div className="relative flex-1">
              <select
                className="h-10 w-full appearance-none rounded-[10px] border border-gray-200 bg-white pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={clientSiteId}
                onChange={(e) => setClientSiteId(e.target.value)}
                disabled={!effectiveClientId || loadingSites}
              >
                <option value="">
                  {loadingSites ? "Loading..." : "Select Site"}
                </option>
                {effectiveSites.map((site) => (
                  <option key={site._id} value={site._id}>
                    {site.siteName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <DialogDescription className="sr-only">
            {isEdit ? "Edit asset details" : "Add a new asset"}
          </DialogDescription>
        </DialogHeader>

        <hr className="border-gray-200" />

        {/* Body */}
        <div className="flex flex-col gap-4 px-[50px] py-4">
          {error && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Machine Name & Serial Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Machine Name</Label>
              <Input
                placeholder="Type Machine Name"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Serial Number</Label>
              <Input
                placeholder="Type Serial Number"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Type / Make / Model selector */}
        <div className="px-[50px] py-4">
          {loadingSettings ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 min-h-[280px]">
              {/* Type Column */}
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Type</h4>
                <div className="flex flex-wrap gap-2">
                  {assetTypes.map((type) => {
                    const isSelected = selectedTypeIds.has(type._id);
                    return (
                      <button
                        key={type._id}
                        type="button"
                        onClick={() => toggleType(type._id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-[#E0F4FB] text-[#2EA4D0] border border-[#2EA4D0]"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {type.title}
                      </button>
                    );
                  })}
                  {assetTypes.length === 0 && (
                    <p className="text-sm text-gray-400">No types available</p>
                  )}
                </div>
              </div>

              {/* Make Column */}
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Make</h4>
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-1">
                  {filteredMakes.map((make) => {
                    const isSelected = selectedMakeId === make._id;
                    return (
                      <button
                        key={make._id}
                        type="button"
                        onClick={() => {
                          setSelectedMakeId(isSelected ? "" : make._id);
                          setSelectedModelId("");
                        }}
                        className={`px-3 py-2 rounded-[10px] text-sm text-left transition-colors border ${
                          isSelected
                            ? "border-[#2EA4D0] bg-[#E0F4FB] text-[#2EA4D0] font-medium"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {make.title}
                      </button>
                    );
                  })}
                  {filteredMakes.length === 0 && (
                    <p className="text-sm text-gray-400">
                      {selectedTypeIds.size === 0
                        ? "Select a type to see makes"
                        : "No makes available"}
                    </p>
                  )}
                </div>
              </div>

              {/* Model Column */}
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Model</h4>
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-1">
                  {selectedMakeId ? (
                    filteredModels.length > 0 ? (
                      filteredModels.map((model) => {
                        const isSelected = selectedModelId === model._id;
                        return (
                          <button
                            key={model._id}
                            type="button"
                            onClick={() =>
                              setSelectedModelId(isSelected ? "" : model._id)
                            }
                            className={`px-3 py-2 rounded-[10px] text-sm text-left transition-colors border ${
                              isSelected
                                ? "border-[#2EA4D0] bg-[#E0F4FB] text-[#2EA4D0] font-medium"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            {model.title}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-400">No models available</p>
                    )
                  ) : (
                    <p className="text-sm text-gray-400">Select a make to see models</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-[50px] py-4">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#00AEEF] hover:bg-[#0098d4] text-white"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Update Asset" : "Add Asset"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
