"use client";

import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Pencil,
  Download,
  ExternalLink,
  X,
} from "lucide-react";
import { TrashIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Attachment {
  _id: string;
  documentName?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  visibility?: number;
  createdAt: string;
}

interface AttachmentsSectionProps {
  attachments: Attachment[];
  /** Base API URL, e.g. "/api/support-tickets/123" or "/api/job-cards/456" */
  apiBaseUrl: string;
  /** Upload folder name, e.g. "ticket-attachments" or "job-card-attachments" */
  uploadFolder: string;
  onRefresh: () => void;
  /** Optional extra content to render after attachments (e.g. Checklist Uploads) */
  children?: React.ReactNode;
}

const EyeOpenIcon = ({ size = 20, color = "#83CE67" }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeClosedIcon = ({ size = 18, color = "#465868" }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export function AttachmentsSection({
  attachments,
  apiBaseUrl,
  uploadFolder,
  onRefresh,
  children,
}: AttachmentsSectionProps) {
  // Local state for instant UI updates
  const [localAttachments, setLocalAttachments] = useState(attachments);
  useEffect(() => {
    setLocalAttachments(attachments);
  }, [attachments]);

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit filename dialog
  const [editFilenameAttId, setEditFilenameAttId] = useState<string | null>(null);
  const [editFilenameName, setEditFilenameName] = useState("");
  const [savingFilename, setSavingFilename] = useState(false);

  // Separate images vs docs
  const imageAttachments = localAttachments.filter((att) => {
    const url = att.fileName || att.fileUrl || "";
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(url);
  });
  const docAttachments = localAttachments.filter((att) => {
    const url = att.fileName || att.fileUrl || "";
    return !/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(url);
  });

  // --- Handlers ---

  async function handleToggleVisibility(attId: string, currentVisibility: number | undefined) {
    const newVisibility = currentVisibility === 2 ? 1 : 2;
    // Optimistic update
    setLocalAttachments((prev) =>
      prev.map((a) => (a._id === attId ? { ...a, visibility: newVisibility } : a))
    );
    try {
      const res = await fetch(`${apiBaseUrl}/attachments/${attId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
    } catch {
      // Revert on failure
      setLocalAttachments((prev) =>
        prev.map((a) => (a._id === attId ? { ...a, visibility: currentVisibility } : a))
      );
    }
  }

  async function handleMakeAllPublic() {
    const snapshot = localAttachments;
    // Optimistic update
    setLocalAttachments((prev) => prev.map((a) => ({ ...a, visibility: 2 })));
    try {
      const res = await fetch(`${apiBaseUrl}/attachments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: 2 }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
    } catch {
      // Revert on failure
      setLocalAttachments(snapshot);
    }
  }

  async function handleDeleteAttachment(attId: string) {
    if (!confirm("Are you sure you want to delete this attachment?")) return;
    const snapshot = localAttachments;
    // Optimistic update
    setLocalAttachments((prev) => prev.filter((a) => a._id !== attId));
    try {
      const res = await fetch(`${apiBaseUrl}/attachments/${attId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
    } catch {
      // Revert on failure
      setLocalAttachments(snapshot);
      alert("Failed to delete attachment");
    }
  }

  async function handleSaveFilename() {
    if (!editFilenameAttId || !editFilenameName.trim()) return;
    setSavingFilename(true);
    try {
      const res = await fetch(`${apiBaseUrl}/attachments/${editFilenameAttId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentName: editFilenameName.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      // Optimistic update
      setLocalAttachments((prev) =>
        prev.map((a) => (a._id === editFilenameAttId ? { ...a, documentName: editFilenameName.trim() } : a))
      );
      setEditFilenameAttId(null);
      setEditFilenameName("");
    } catch {
      alert("Failed to update filename");
    } finally {
      setSavingFilename(false);
    }
  }

  // --- Upload ---

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUploadFiles() {
    if (pendingFiles.length === 0) return;
    setUploading(true);

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      const key = `${file.name}-${i}`;
      setUploadProgress((prev) => ({ ...prev, [key]: 0 }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", uploadFolder);

        const uploadJson: any = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 80);
              setUploadProgress((prev) => ({ ...prev, [key]: pct }));
            }
          });
          xhr.addEventListener("load", () => {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Invalid response"));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });

        if (uploadJson.success) {
          setUploadProgress((prev) => ({ ...prev, [key]: 90 }));
          const createRes = await fetch(`${apiBaseUrl}/attachments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentName: file.name,
              fileName: uploadJson.data.url,
              fileSize: file.size,
              visibility: 1,
            }),
          });
          const createJson = await createRes.json();
          if (!createRes.ok || !createJson.success) {
            setUploadProgress((prev) => ({ ...prev, [key]: -1 }));
            continue;
          }
          setUploadProgress((prev) => ({ ...prev, [key]: 100 }));
        } else {
          setUploadProgress((prev) => ({ ...prev, [key]: -1 }));
        }
      } catch {
        setUploadProgress((prev) => ({ ...prev, [key]: -1 }));
      }
    }

    setUploading(false);
    setTimeout(() => {
      setPendingFiles([]);
      setUploadProgress({});
      setUploadDialogOpen(false);
      onRefresh();
    }, 800);
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-bold text-gray-900">Attachments</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleMakeAllPublic}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-cyan-600 cursor-pointer"
            >
              <EyeOpenIcon size={18} color="currentColor" />
              Make All Images Public
            </button>
            <button
              onClick={() => { setPendingFiles([]); setUploadProgress({}); setUploadDialogOpen(true); }}
              className="p-1.5 text-gray-500 cursor-pointer hover:text-gray-700"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {localAttachments.length === 0 ? (
          <p className="text-sm text-gray-400">No attachments</p>
        ) : (
          <div className="space-y-4">
            {/* Document rows */}
            {docAttachments.length > 0 && (
              <div className="space-y-3">
                {docAttachments.map((att) => {
                  const url = att.fileName || att.fileUrl || "";
                  const isPublic = att.visibility === 2;
                  return (
                    <div key={att._id} className="flex items-center justify-between py-1">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-cyan-600 truncate min-w-0">
                        {att.documentName || att.fileName || "Document"}
                      </a>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <button
                          onClick={() => handleToggleVisibility(att._id, att.visibility)}
                          className="cursor-pointer hover:opacity-80"
                          title={isPublic ? "Make Private" : "Make Public"}
                        >
                          {isPublic ? <EyeOpenIcon /> : <EyeClosedIcon />}
                        </button>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700" title="Open in new tab">
                          <ExternalLink className="h-5 w-5" />
                        </a>
                        <button
                          onClick={() => { setEditFilenameAttId(att._id); setEditFilenameName(att.documentName || att.fileName || ""); }}
                          className="text-gray-500 hover:text-gray-700 cursor-pointer"
                          title="Edit filename"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDeleteAttachment(att._id)} className="text-gray-500 hover:text-red-500 cursor-pointer" title="Delete">
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Image grid */}
            {imageAttachments.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {imageAttachments.map((att) => {
                  const url = att.fileName || att.fileUrl || "";
                  const isPublic = att.visibility === 2;
                  return (
                    <div key={att._id} className="w-[140px] rounded-[10px] border border-gray-200 overflow-hidden">
                      {/* Icons row on top */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-white">
                        <button
                          onClick={() => handleToggleVisibility(att._id, att.visibility)}
                          className="cursor-pointer hover:opacity-80"
                          title={isPublic ? "Make Private" : "Make Public"}
                        >
                          {isPublic ? <EyeOpenIcon size={16} /> : <EyeClosedIcon size={16} />}
                        </button>
                        <a href={url} download className="text-gray-500 hover:text-gray-700" title="Download">
                          <Download className="h-4 w-4" />
                        </a>
                        <button onClick={() => handleDeleteAttachment(att._id)} className="text-gray-500 hover:text-red-500 cursor-pointer" title="Delete">
                          <TrashIcon />
                        </button>
                      </div>
                      {/* Image */}
                      <a href={url} target="_blank" rel="noopener noreferrer" className="block h-[120px] bg-gray-50">
                        <img src={url} alt={att.documentName || ""} className="h-full w-full object-cover" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {children}

      {/* Edit Filename Dialog */}
      <Dialog open={!!editFilenameAttId} onOpenChange={(v) => { if (!v) { setEditFilenameAttId(null); setEditFilenameName(""); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Filename</DialogTitle>
          </DialogHeader>
          <hr style={{ borderTop: "1px solid #D4E3EB" }} />
          <div className="flex items-center gap-6 px-2">
            <Label className="min-w-[80px] text-sm text-gray-600">File name</Label>
            <Input
              value={editFilenameName}
              onChange={(e) => setEditFilenameName(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3 px-2 pt-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleSaveFilename}
              disabled={savingFilename || !editFilenameName.trim()}
            >
              {savingFilename && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
            <button
              onClick={() => { setEditFilenameAttId(null); setEditFilenameName(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Multiple Documents Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(v) => { if (!uploading) { setUploadDialogOpen(v); if (!v) { setPendingFiles([]); setUploadProgress({}); } } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload Multiple Documents</DialogTitle>
          </DialogHeader>
          <hr />

          <div className="space-y-4 px-2">
            {/* File list with progress bars */}
            {pendingFiles.length > 0 && (
              <div className="space-y-3">
                {pendingFiles.map((file, idx) => {
                  const key = `${file.name}-${idx}`;
                  const progress = uploadProgress[key];
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-700 truncate pr-4">{file.name}</p>
                        {progress === undefined && !uploading && (
                          <button
                            onClick={() => removePendingFile(idx)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {progress !== undefined && progress >= 0 && (
                          <span className="text-xs text-cyan-600 flex-shrink-0">{progress}%</span>
                        )}
                        {progress === -1 && (
                          <span className="text-xs text-red-500 flex-shrink-0">Failed</span>
                        )}
                      </div>
                      {progress !== undefined && progress >= 0 && (
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      <hr className="mt-2 border-gray-100" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-[10px] border-2 border-dashed border-cyan-300 bg-cyan-50/30 p-8 text-center cursor-pointer hover:bg-cyan-50/60 transition-colors"
            >
              <p className="text-sm text-gray-600">
                Drag & Drop multiple documents to upload at once
              </p>
              <p className="text-sm text-cyan-600 underline mt-1">
                Or click here to select
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleUploadFiles}
              disabled={uploading || pendingFiles.length === 0}
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload Documents
            </Button>
            <button
              onClick={() => { if (!uploading) { setUploadDialogOpen(false); setPendingFiles([]); setUploadProgress({}); } }}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
