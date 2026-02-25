"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Eye, ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoading } from "@/components/ui/loading";

// --- Types ---

interface AssetItem {
  _id: string;
  machineName: string;
  serialNo?: string;
  clientId?: { _id: string; companyName: string } | null;
  clientSiteId?: { _id: string; siteName: string } | null;
  lastTicketDate?: string | null;
  status?: number;
}

interface ClientOption {
  _id: string;
  companyName: string;
}

interface SiteOption {
  _id: string;
  siteName: string;
}

// --- Helpers ---

function formatLongDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// --- Page ---

export default function AssetsPage() {
  useEffect(() => {
    document.title = "TSC - Assets";
  }, []);

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client filter
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  // Site filter
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 20;

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

  // Fetch clients
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        const json = await res.json();
        if (json.success) {
          const raw = json.data?.data || json.data || [];
          const sorted = (Array.isArray(raw) ? raw : []).sort(
            (a: ClientOption, b: ClientOption) =>
              a.companyName.localeCompare(b.companyName)
          );
          setClients(sorted);
        }
      } catch {
        // silently fail
      }
    }
    fetchClients();
  }, []);

  // Fetch sites when client changes
  useEffect(() => {
    if (!selectedClientId) {
      setSites([]);
      setSelectedSiteId("");
      return;
    }
    async function fetchSites() {
      try {
        const res = await fetch(`/api/clients/${selectedClientId}/sites`);
        const json = await res.json();
        if (json.success) {
          const raw = json.data?.data || json.data || [];
          setSites(Array.isArray(raw) ? raw : []);
        }
      } catch {
        // silently fail
      }
    }
    fetchSites();
  }, [selectedClientId]);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedClientId) params.set("clientId", selectedClientId);
      if (selectedSiteId) params.set("siteId", selectedSiteId);
      const qs = params.toString();
      const res = await fetch(`/api/assets${qs ? `?${qs}` : ""}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load assets");
      }
      setAssets(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId, selectedSiteId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedClientId, selectedSiteId]);

  // Pagination
  const totalPages = Math.ceil(assets.length / perPage);
  const paginatedAssets = assets.slice((page - 1) * perPage, page * perPage);

  // Client dropdown helpers
  const sortedFilteredClients = clientSearch
    ? clients.filter((c) =>
        c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients;

  function handleSelectClient(id: string, name: string) {
    setSelectedClientId(id);
    setClientSearch(name);
    setClientDropdownOpen(false);
    setSelectedSiteId("");
  }

  function handleClearClient() {
    setSelectedClientId("");
    setClientSearch("");
    setSelectedSiteId("");
    setSites([]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Assets</h1>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* Client searchable dropdown */}
        <div className="relative w-[280px]" ref={clientRef}>
          <div className="relative">
            <input
              type="text"
              className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 pr-16 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              placeholder="Filter by Client"
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setClientDropdownOpen(true);
                if (selectedClientId) {
                  setSelectedClientId("");
                  setSelectedSiteId("");
                  setSites([]);
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
              {sortedFilteredClients.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No clients found
                </div>
              ) : (
                sortedFilteredClients.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer ${
                      c._id === selectedClientId
                        ? "bg-gray-50 font-medium"
                        : ""
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

        {/* Site dropdown */}
        <div className="relative w-[220px]">
          <select
            className="h-10 w-full appearance-none rounded-[10px] border border-gray-200 bg-white pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            disabled={!selectedClientId}
          >
            <option value="">All Sites</option>
            {sites.map((s) => (
              <option key={s._id} value={s._id}>
                {s.siteName}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <PageLoading />
      ) : error ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              Unable to load assets
            </p>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={fetchAssets}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : paginatedAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-gray-500">No assets found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine Name</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Client Site</TableHead>
                  <TableHead>Last Ticket</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAssets.map((asset) => {
                  const clientId =
                    typeof asset.clientId === "object"
                      ? asset.clientId?._id
                      : undefined;

                  return (
                    <TableRow key={asset._id}>
                      <TableCell>{asset.machineName || ""}</TableCell>
                      <TableCell>{asset.serialNo || ""}</TableCell>
                      <TableCell>
                        {asset.clientId &&
                        typeof asset.clientId === "object"
                          ? asset.clientId.companyName
                          : ""}
                      </TableCell>
                      <TableCell>
                        {asset.clientSiteId &&
                        typeof asset.clientSiteId === "object"
                          ? asset.clientSiteId.siteName
                          : ""}
                      </TableCell>
                      <TableCell>
                        {asset.lastTicketDate
                          ? formatLongDate(asset.lastTicketDate)
                          : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/assets/${asset._id}`}>
                          <button className="inline-flex items-center gap-1.5 rounded-[10px] border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                            <Eye className="h-4 w-4" />
                            View Asset
                          </button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, assets.length)} of {assets.length} assets
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
