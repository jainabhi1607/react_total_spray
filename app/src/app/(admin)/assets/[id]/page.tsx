"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  ImageIcon,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageLoading } from "@/components/ui/loading";

// --- Types ---

interface AssetDetail {
  _id: string;
  machineName: string;
  serialNo?: string;
  clientId?: { _id: string; companyName: string } | null;
  clientSiteId?: { _id: string; siteName: string } | null;
  assetMakeId?: { _id: string; title: string } | null;
  assetModelId?: { _id: string; title: string } | null;
  image?: string;
  notes?: string;
  dateTime?: string;
  createdAt?: string;
  supportRequests: number;
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

// --- Tabs ---

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "maintenance", label: "Maintenance" },
  { value: "activity", label: "Activity" },
];

// --- Page ---

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchAsset = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}`);
      const json = await res.json();
      if (json.success) {
        setAsset(json.data);
        setNotesValue(json.data.notes || "");
        document.title = `TSC - ${json.data.machineName}`;
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  async function handleSaveNotes() {
    if (!asset) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/assets/${asset._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      });
      const json = await res.json();
      if (json.success) {
        setAsset((prev) => (prev ? { ...prev, notes: notesValue } : prev));
        setEditingNotes(false);
      }
    } catch {
      // silently fail
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) return <PageLoading />;
  if (!asset) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-gray-500">Asset not found</p>
      </div>
    );
  }

  const siteName =
    asset.clientSiteId && typeof asset.clientSiteId === "object"
      ? asset.clientSiteId.siteName
      : "";
  const makeName =
    asset.assetMakeId && typeof asset.assetMakeId === "object"
      ? asset.assetMakeId.title
      : "";
  const modelName =
    asset.assetModelId && typeof asset.assetModelId === "object"
      ? asset.assetModelId.title
      : "";
  const purchaseDate = asset.dateTime || asset.createdAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {asset.machineName}
            </h1>
            {siteName && (
              <p className="text-sm text-gray-500">{siteName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`whitespace-nowrap border-b-2 text-sm font-normal cursor-pointer transition-colors ${
                activeTab === tab.value
                  ? "border-cyan-500 text-cyan-500"
                  : "border-transparent text-gray-900 hover:border-gray-300"
              }`}
              style={{
                lineHeight: "30px",
                paddingLeft: 25,
                paddingRight: 25,
                fontSize: 14,
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column (2/3) */}
          <div className="col-span-2 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-4">
              {/* Time since last service */}
              <Card className="bg-cyan-400 text-white">
                <CardContent className="p-5" style={{ height: 110 }}>
                  <p className="text-sm font-medium">Time since last service</p>
                </CardContent>
              </Card>

              {/* Support Requests */}
              <Card>
                <CardContent className="p-5" style={{ height: 110 }}>
                  <p className="text-sm font-medium text-gray-500">
                    Support Requests
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {asset.supportRequests}
                  </p>
                </CardContent>
              </Card>

              {/* Job Cards */}
              <Card>
                <CardContent className="p-5" style={{ height: 110 }}>
                  <p className="text-sm font-medium text-gray-500">Job Cards</p>
                  <p className="text-3xl font-bold mt-2">0</p>
                </CardContent>
              </Card>
            </div>

            {/* Maintenance action Breakdown by Type */}
            <Card>
              <CardContent className="p-5 min-h-[180px]">
                <h3 className="text-sm font-semibold text-gray-900">
                  Maintenance action Breakdown by Type
                </h3>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Total Maintenance Actions
                  </span>
                  <span className="text-sm font-semibold">0</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
                  {!editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="rounded-[10px] p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-3">
                    <Textarea
                      rows={4}
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Enter a note about this asset"
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                      >
                        {savingNotes && (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        )}
                        Save
                      </Button>
                      <button
                        onClick={() => {
                          setEditingNotes(false);
                          setNotesValue(asset.notes || "");
                        }}
                        className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    {asset.notes || "Enter a note about this asset"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Asset Image + Details */}
            <Card>
              <CardContent className="p-5">
                {/* Image placeholder */}
                <div className="flex items-center justify-center rounded-[10px] bg-gray-50 border border-gray-100" style={{ height: 200 }}>
                  {asset.image ? (
                    <img
                      src={asset.image}
                      alt={asset.machineName}
                      className="h-full w-full rounded-[10px] object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-gray-300" />
                  )}
                </div>

                {/* Edit icon */}
                <div className="flex justify-end mt-2">
                  <button className="rounded-[10px] p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-4 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyan-600">Serial Number</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {asset.serialNo || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyan-600">Purchase Date</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {purchaseDate ? formatLongDate(purchaseDate) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyan-600">Make</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {makeName || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyan-600">Model</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {modelName || "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-bold text-gray-900">QR Code</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Download the QR code sticker to place on or near your asset
                  for on the spot asset information and maintenance tracking.
                </p>
                <div className="flex items-end gap-4 mt-4">
                  <div className="h-24 w-24 rounded-[10px] bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-300">QR</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="inline-flex items-center gap-1.5 rounded-[10px] border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-[10px] border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visit URL
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === "maintenance" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-gray-500">
              No maintenance records found
            </p>
          </CardContent>
        </Card>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-gray-500">No activity found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
