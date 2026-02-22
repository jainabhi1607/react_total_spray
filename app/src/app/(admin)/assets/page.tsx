"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Wrench, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoading } from "@/components/ui/loading";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssetItem {
  _id: string;
  machineName?: string;
  serialNumber?: string;
  clientId?: string | { _id: string; companyName: string };
  siteId?: string | { _id: string; name: string; siteName?: string };
  status?: number;
  assetTypeId?: string | { _id: string; title: string };
  assetMakeId?: string | { _id: string; title: string };
  assetModelId?: string | { _id: string; title: string };
}

interface ClientWithAssets {
  _id: string;
  companyName: string;
  assets: AssetItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAssetStatusInfo(status?: number) {
  switch (status) {
    case 1:
      return { label: "Active", className: "bg-green-100 text-green-800" };
    case 0:
      return { label: "Inactive", className: "bg-gray-100 text-gray-800" };
    case 2:
      return { label: "Deleted", className: "bg-red-100 text-red-800" };
    default:
      return { label: "Unknown", className: "bg-gray-100 text-gray-800" };
  }
}

function resolveField(
  value: string | { _id: string; [key: string]: any } | undefined,
  key: string
): string {
  if (!value) return "-";
  if (typeof value === "object") return (value as any)[key] || "-";
  return value;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AssetsPage() {
  const [allAssets, setAllAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try dedicated assets endpoint first
      const res = await fetch("/api/assets");
      const json = await res.json();

      if (res.ok && json.success) {
        setAllAssets(json.data || []);
        return;
      }

      // Fallback: fetch clients and their assets
      const clientRes = await fetch("/api/clients");
      const clientJson = await clientRes.json();
      if (!clientRes.ok || !clientJson.success)
        throw new Error(clientJson.message || "Failed to load clients");

      const clients = clientJson.data || [];
      const assetPromises = clients.map(async (client: any) => {
        try {
          const aRes = await fetch(`/api/clients/${client._id}/assets`);
          const aJson = await aRes.json();
          if (aRes.ok && aJson.success) {
            return (aJson.data || []).map((a: any) => ({
              ...a,
              clientId: { _id: client._id, companyName: client.companyName },
            }));
          }
        } catch {}
        return [];
      });

      const results = await Promise.all(assetPromises);
      setAllAssets(results.flat());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = search.trim()
    ? allAssets.filter((a) => {
        const q = search.toLowerCase();
        const name = (a.machineName || "").toLowerCase();
        const serial = (a.serialNumber || "").toLowerCase();
        return name.includes(q) || serial.includes(q);
      })
    : allAssets;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Global asset listing across all clients.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by machine name or serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <PageLoading />
      ) : error ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Unable to load assets</p>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchAssets}>
              Retry
            </Button>
          </div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">No assets found</p>
            <p className="mt-1 text-sm text-gray-500">
              {search.trim()
                ? "Try adjusting your search."
                : "No assets have been added yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Serial #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const clientId =
                    typeof asset.clientId === "object"
                      ? asset.clientId?._id
                      : asset.clientId;
                  const clientName = resolveField(asset.clientId, "companyName");
                  const siteName =
                    typeof asset.siteId === "object"
                      ? asset.siteId?.siteName || asset.siteId?.name || "-"
                      : "-";
                  const statusInfo = getAssetStatusInfo(asset.status);

                  return (
                    <TableRow key={asset._id}>
                      <TableCell className="font-medium">
                        {asset.machineName || "-"}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {asset.serialNumber || "-"}
                      </TableCell>
                      <TableCell>{clientName}</TableCell>
                      <TableCell>{siteName}</TableCell>
                      <TableCell>
                        <Badge className={statusInfo.className}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {clientId && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/clients/${clientId}?tab=assets`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {!loading && !error && filteredAssets.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {filteredAssets.length} asset{filteredAssets.length !== 1 ? "s" : ""}
          {search.trim() ? ` matching "${search}"` : ""}
        </p>
      )}
    </div>
  );
}
