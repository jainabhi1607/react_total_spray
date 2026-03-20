"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Pencil, Loader2, ChevronRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CompanyUser {
  _id: string;
  name: string;
  lastName?: string;
  email?: string;
  role: number;
  status: number;
}

interface CompanyData {
  _id: string;
  companyName: string;
  companyLogo?: string;
  address?: string;
  abn?: string;
  siteCount: number;
  assetCount: number;
  contactCount: number;
  userCount: number;
  users: CompanyUser[];
}

const ROLE_LABELS: Record<number, string> = {
  4: "Administrator",
  6: "Client User",
};

export default function CompanyPage() {
  useEffect(() => { document.title = "TSC - Company"; }, []);
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [companyName, setCompanyName] = useState("");
  const [abn, setAbn] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Upload image dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("File size must be under 3 MB");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function resetUploadDialog() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploading(false);
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUploadImage() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", "company-logos");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success) {
        alert(uploadJson.error || "Upload failed");
        return;
      }
      const logoUrl = uploadJson.data.url;
      const saveRes = await fetch("/api/portal/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyLogo: logoUrl }),
      });
      const saveJson = await saveRes.json();
      if (saveRes.ok && saveJson.success) {
        setData((prev) => prev ? { ...prev, companyLogo: logoUrl } : prev);
        setUploadOpen(false);
        resetUploadDialog();
      } else {
        alert(saveJson.error || "Failed to save logo");
      }
    } catch {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/company");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setCompanyName(json.data.companyName || "");
        setAbn(json.data.abn || "");
        setAddress(json.data.address || "");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/portal/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, abn, address }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData((prev) => prev ? { ...prev, companyName, abn, address } : prev);
      } else {
        alert(json.error || "Failed to save");
      }
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading />;
  if (!data) return <div className="text-center py-8 text-gray-500">Company information not available</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company</h1>
        <p className="text-[14px] text-gray-400 mt-0.5">{data.companyName}</p>
      </div>

      <div className="flex gap-6">
        {/* LEFT COLUMN */}
        <div className="w-[320px] shrink-0">
          <div className="rounded-[10px] border border-gray-200 bg-white p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-[160px] h-[160px] rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 mb-2">
                {data.companyLogo ? (
                  <img src={data.companyLogo} alt="Logo" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><path d="M5 9l2-2m0 0l2-2M7 7l2 2M7 7L5 5" /><path d="M19 9l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2" /><path d="M12 15l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2" /></svg>
                )}
              </div>
              <button
                onClick={() => { resetUploadDialog(); setUploadOpen(true); }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <p className="text-[12px] text-gray-400 mt-2 text-center">
                Allowed *.jpeg, *.jpg, *.png, *.gif<br />max size of 3 Mb
              </p>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              {[
                { label: "Sites", desc: "Current number of sites", count: data.siteCount },
                { label: "Assets", desc: "Current number of assets", count: data.assetCount },
                { label: "Contacts", desc: "Current number of contacts", count: data.contactCount },
                { label: "Users", desc: "Current number of users", count: data.userCount },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">{stat.label}</p>
                    <p className="text-[12px] text-gray-400">{stat.desc}</p>
                  </div>
                  <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-gray-100 px-2 text-[12px] font-medium text-gray-600">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 space-y-6">
          {/* Company Details Form */}
          <div className="rounded-[10px] border border-gray-200 bg-white p-8">
            <div className="space-y-5">
              <div>
                <label className="text-[14px] font-medium text-gray-900 mb-2 block">Company Name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="rounded-[10px] text-[14px]"
                />
              </div>
              <div>
                <label className="text-[14px] font-medium text-gray-900 mb-2 block">ABN</label>
                <Input
                  value={abn}
                  onChange={(e) => setAbn(e.target.value)}
                  className="rounded-[10px] text-[14px]"
                />
              </div>
              <div>
                <label className="text-[14px] font-medium text-gray-900 mb-2 block">Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-[10px] text-[14px]"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Save
              </Button>
            </div>
          </div>

          {/* Users Section */}
          <div className="rounded-[10px] border border-gray-200 bg-white p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-gray-900">Users</h3>
              <Link href="/portal-users" className="flex items-center gap-1 text-[13px] text-gray-900 hover:text-cyan-500 cursor-pointer">
                Manage Users <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <hr className="border-gray-200 mb-4" />
            {data.users.length === 0 ? (
              <p className="text-[13px] text-gray-400">No users found</p>
            ) : (
              <div className="space-y-0">
                {data.users.map((user) => (
                  <div key={user._id}>
                    <div className="flex items-center justify-between py-3">
                      <p className="text-[13px] text-gray-900">
                        {user.name}{user.lastName ? ` ${user.lastName}` : ""}{" "}
                        {user.email && <span className="text-gray-500">{user.email}</span>}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-0.5 text-[12px] font-medium text-green-700 border border-green-200">
                        {ROLE_LABELS[user.role] || "User"}
                      </span>
                    </div>
                    <hr className="border-gray-200" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Image Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) resetUploadDialog(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Upload Image</DialogTitle>
            <DialogDescription className="sr-only">Upload a company logo image</DialogDescription>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="space-y-4">
            <p className="text-[14px] text-gray-400">Please upload image</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className={`flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed p-10 transition-colors ${
                dragOver ? "border-cyan-500 bg-cyan-50" : "border-cyan-300 bg-[#E8F8FE]"
              }`}
            >
              {previewUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={previewUrl} alt="Preview" className="max-h-[140px] max-w-full rounded-[10px] object-contain" />
                  <p className="text-[13px] text-gray-600 truncate max-w-[300px]">{selectedFile?.name}</p>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-[13px] text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[14px] text-gray-600 mb-3">Drag & Drop single image</p>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]"
                  >
                    Select Files
                  </Button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4">
            <Button
              onClick={handleUploadImage}
              disabled={!selectedFile || uploading}
              className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]"
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Upload Image
            </Button>
            <button
              type="button"
              onClick={() => { setUploadOpen(false); resetUploadDialog(); }}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
