"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  Pencil,
  ImageIcon,
  Download,
  ExternalLink,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// --- Constants ---

const CHART_COLORS = [
  "#00AEEF",
  "#F5A623",
  "#7ED321",
  "#D0021B",
  "#9013FE",
  "#50E3C2",
  "#B8E986",
  "#4A90D9",
];

// --- Types ---

interface MaintenanceBreakdownItem {
  name: string;
  count: number;
}

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
  publicCode?: string;
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

function getPublicAssetUrl(publicCode: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${baseUrl}/client-asset/${publicCode}`;
}

// --- Tabs ---

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "maintenance", label: "Maintenance" },
  { value: "activity", label: "Activity" },
];

// --- Edit Image Dialog ---

function EditImageDialog({
  open,
  onOpenChange,
  currentImage,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImage?: string;
  onSave: (imageData: string) => Promise<void>;
}) {
  const [preview, setPreview] = useState<string>(currentImage || "");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setPreview(currentImage || "");
  }, [open, currentImage]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(preview);
      onOpenChange(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-base font-semibold">
            Change Image
          </DialogTitle>
          <DialogDescription className="sr-only">
            Upload or change the asset image
          </DialogDescription>
        </DialogHeader>

        <hr className="border-gray-200" />

        <div className="px-6 py-4 space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center rounded-[10px] bg-gray-50 border border-gray-100 overflow-hidden" style={{ height: 200 }}>
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-16 w-16 text-gray-300" />
            )}
          </div>

          {/* Upload area */}
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-gray-200 p-6 cursor-pointer hover:border-cyan-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">
              Click to upload an image
            </p>
            <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {preview && preview !== currentImage && (
            <button
              type="button"
              onClick={() => setPreview("")}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" />
              Remove image
            </button>
          )}
        </div>

        <hr className="border-gray-200" />

        <div className="flex items-center justify-end gap-4 px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            Cancel
          </button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Notes Dialog ---

function EditNotesDialog({
  open,
  onOpenChange,
  currentNotes,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNotes: string;
  onSave: (notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setNotes(currentNotes);
  }, [open, currentNotes]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(notes);
      onOpenChange(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-base font-semibold">
            Edit Notes
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit asset notes
          </DialogDescription>
        </DialogHeader>

        <hr className="border-gray-200" />

        <div className="px-6 py-4">
          <Textarea
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter a note about this asset"
          />
        </div>

        <hr className="border-gray-200" />

        <div className="flex items-center justify-end gap-4 px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            Cancel
          </button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Page ---

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);

  // QR code data URL
  const [qrDataUrl, setQrDataUrl] = useState("");

  // Maintenance breakdown
  const [maintenanceItems, setMaintenanceItems] = useState<
    MaintenanceBreakdownItem[]
  >([]);
  const [maintenanceTotal, setMaintenanceTotal] = useState(0);

  const fetchAsset = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}`);
      const json = await res.json();
      if (json.success) {
        setAsset(json.data);
        document.title = `TSC - ${json.data.machineName}`;
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  const fetchMaintenanceBreakdown = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/assets/${assetId}/maintenance-breakdown`
      );
      const json = await res.json();
      if (json.success) {
        setMaintenanceItems(json.data.items);
        setMaintenanceTotal(json.data.total);
      }
    } catch {
      // silently fail
    }
  }, [assetId]);

  useEffect(() => {
    fetchAsset();
    fetchMaintenanceBreakdown();
  }, [fetchAsset, fetchMaintenanceBreakdown]);

  // Generate QR code when asset loads (dynamic import to avoid SSR issues)
  useEffect(() => {
    if (!asset?.publicCode) return;
    const url = getPublicAssetUrl(asset.publicCode);
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(url, {
        width: 300,
        margin: 0,
        color: { dark: "#00AEEF", light: "#FFFFFF" },
      })
        .then((dataUrl: string) => setQrDataUrl(dataUrl))
        .catch(() => {
          // silently fail
        });
    });
  }, [asset?.publicCode]);

  async function handleSaveImage(imageData: string) {
    if (!asset) return;
    const res = await fetch(`/api/assets/${asset._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData }),
    });
    const json = await res.json();
    if (json.success) {
      setAsset((prev) => (prev ? { ...prev, image: imageData } : prev));
    }
  }

  async function handleSaveNotes(notes: string) {
    if (!asset) return;
    const res = await fetch(`/api/assets/${asset._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    const json = await res.json();
    if (json.success) {
      setAsset((prev) => (prev ? { ...prev, notes } : prev));
    }
  }

  async function handleDownloadQR() {
    if (!asset?.publicCode) return;

    const QRCode = (await import("qrcode")).default;
    const { jsPDF } = await import("jspdf");

    const clientName =
      asset.clientId && typeof asset.clientId === "object"
        ? asset.clientId.companyName
        : "";
    const siteName =
      asset.clientSiteId && typeof asset.clientSiteId === "object"
        ? asset.clientSiteId.siteName
        : "";
    const serialNo = asset.serialNo || "";

    const subtitle = [clientName, siteName, serialNo]
      .filter(Boolean)
      .join(" - ");

    const url = getPublicAssetUrl(asset.publicCode);

    // Generate a larger QR code for the PDF
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, url, {
      width: 600,
      margin: 0,
      color: { dark: "#00AEEF", light: "#FFFFFF" },
    });
    const qrImage = qrCanvas.toDataURL("image/png");

    // Create PDF (A4)
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;

    // --- "Maintenance Log & History" heading ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 174, 239); // #00AEEF
    doc.text("Maintenance Log & History", pageWidth / 2, 30, {
      align: "center",
    });

    // --- Asset name ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text(asset.machineName, pageWidth / 2, 60, { align: "center" });

    // --- Subtitle: Client - Site - Serial ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text(subtitle, pageWidth / 2, 70, { align: "center" });

    // --- QR Code ---
    const qrSize = 80;
    const qrX = (pageWidth - qrSize) / 2;
    doc.addImage(qrImage, "PNG", qrX, 90, qrSize, qrSize);

    // --- Logo at bottom ---
    // Load the logo image from public folder
    try {
      const logoImg = await loadImage("/logo.jpg");
      const logoWidth = 40;
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(
        logoImg.src,
        "JPEG",
        logoX,
        260,
        logoWidth,
        logoHeight
      );
    } catch {
      // If logo fails to load, add text fallback
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 174, 239);
      doc.text("Total Spraybooth Care", pageWidth / 2, 270, {
        align: "center",
      });
    }

    doc.save("qr-code.pdf");
  }

  function handleVisitUrl() {
    if (!asset?.publicCode) return;
    const url = getPublicAssetUrl(asset.publicCode);
    window.open(url, "_blank");
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
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Maintenance action Breakdown by Type
                </h3>
                <div className="flex items-start gap-6">
                  {/* Donut Chart */}
                  <div className="shrink-0" style={{ width: 160, height: 160 }}>
                    {maintenanceItems.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={maintenanceItems}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            strokeWidth={0}
                          >
                            {maintenanceItems.map((_, index) => (
                              <Cell
                                key={index}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const item = payload[0];
                              const percent =
                                maintenanceTotal > 0
                                  ? (
                                      ((item.value as number) /
                                        maintenanceTotal) *
                                      100
                                    ).toFixed(1)
                                  : "0";
                              return (
                                <div className="rounded-[10px] bg-gray-800 px-3 py-1.5 text-xs text-white shadow">
                                  {item.name}: {percent}%
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div
                          className="rounded-full border-[20px] border-gray-100"
                          style={{ width: 150, height: 150 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-cyan-600 font-medium">
                        Total Maintenance Actions
                      </span>
                      <span className="text-2xl font-bold">
                        {maintenanceTotal}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {maintenanceItems.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3.5 w-3.5 rounded-sm shrink-0"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[index % CHART_COLORS.length],
                              }}
                            />
                            <span className="text-sm text-gray-700">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-sm text-cyan-600 font-medium">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-gray-900">Notes</h3>
                  <button
                    onClick={() => setNotesDialogOpen(true)}
                    className="rounded-[10px] p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-400">
                  {asset.notes || "Enter a note about this asset"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Asset Image + Details */}
            <Card>
              <CardContent className="p-5">
                {/* Image placeholder */}
                <div
                  className="flex items-center justify-center rounded-[10px] bg-gray-50 border border-gray-100"
                  style={{ height: 200 }}
                >
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
                  <button
                    onClick={() => setImageDialogOpen(true)}
                    className="rounded-[10px] p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="mt-2 divide-y divide-gray-200">
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">Serial Number</span>
                    <span className="text-sm text-gray-500">
                      {asset.serialNo || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">Purchase Date</span>
                    <span className="text-sm text-gray-500">
                      {purchaseDate ? formatLongDate(purchaseDate) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">Make</span>
                    <span className="text-sm text-gray-500">
                      {makeName || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">Model</span>
                    <span className="text-sm text-gray-500">
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
                  <div className="h-24 w-24 rounded-[10px] bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-xs text-gray-300">QR</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleDownloadQR}
                      className="inline-flex items-center gap-1.5 rounded-[10px] border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button
                      onClick={handleVisitUrl}
                      className="inline-flex items-center gap-1.5 rounded-[10px] border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
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

      {/* Dialogs */}
      <EditImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        currentImage={asset.image}
        onSave={handleSaveImage}
      />

      <EditNotesDialog
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        currentNotes={asset.notes || ""}
        onSave={handleSaveNotes}
      />
    </div>
  );
}

// Helper to load an image as HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
