"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Category {
  _id: string;
  title: string;
}

interface ResourceData {
  _id: string;
  resourceName: string;
  resourceCategoryId?: string | { _id: string; title: string };
  thumbnail?: string;
  resourceFile?: string;
}

interface ResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  resource?: ResourceData;
  categories: Category[];
}

const EMPTY_FORM = {
  resourceName: "",
  resourceCategoryId: "",
};

function getCategoryId(cat: string | { _id: string } | undefined): string {
  if (!cat) return "";
  if (typeof cat === "string") return cat;
  return cat._id || "";
}

function uploadFile(
  file: File,
  folder: string,
  onProgress: (pct: number) => void
): Promise<{ url: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener("load", () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (json.success) resolve(json.data);
        else reject(new Error(json.error || "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}

export function ResourceDialog({
  open,
  onOpenChange,
  onSuccess,
  resource,
  categories,
}: ResourceDialogProps) {
  const isEdit = !!resource;

  const [form, setForm] = useState(EMPTY_FORM);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [resourceFileProgress, setResourceFileProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && resource) {
      setForm({
        resourceName: resource.resourceName || "",
        resourceCategoryId: getCategoryId(resource.resourceCategoryId),
      });
      setError("");
      setThumbnailFile(null);
      setResourceFile(null);
      setThumbnailProgress(0);
      setResourceFileProgress(0);
    } else if (open) {
      setForm(EMPTY_FORM);
      setError("");
      setThumbnailFile(null);
      setResourceFile(null);
      setThumbnailProgress(0);
      setResourceFileProgress(0);
    }
  }, [open, resource]);

  function reset() {
    setForm(EMPTY_FORM);
    setError("");
    setThumbnailFile(null);
    setResourceFile(null);
    setThumbnailProgress(0);
    setResourceFileProgress(0);
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.resourceName.trim()) {
      setError("Resource name is required");
      return;
    }
    if (!form.resourceCategoryId) {
      setError("Please select a category");
      return;
    }

    try {
      setSubmitting(true);

      let thumbnailUrl = resource?.thumbnail || "";
      let resourceFileUrl = resource?.resourceFile || "";

      // Upload thumbnail if selected
      if (thumbnailFile) {
        const result = await uploadFile(thumbnailFile, "resources", setThumbnailProgress);
        thumbnailUrl = result.url;
      }

      // Upload resource file if selected
      if (resourceFile) {
        const result = await uploadFile(resourceFile, "resources", setResourceFileProgress);
        resourceFileUrl = result.url;
      }

      const url = isEdit ? `/api/resources/${resource._id}` : "/api/resources";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceName: form.resourceName.trim(),
          resourceCategoryId: form.resourceCategoryId,
          thumbnail: thumbnailUrl,
          resourceFile: resourceFileUrl,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || `Failed to ${isEdit ? "update" : "create"} resource`);
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? "update" : "create"} resource`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Resource" : "Add Resource"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="dr-resourceName">Resource Name</Label>
            <Input
              id="dr-resourceName"
              value={form.resourceName}
              onChange={(e) => setForm((f) => ({ ...f, resourceName: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dr-category">Category</Label>
            <select
              id="dr-category"
              className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              value={form.resourceCategoryId}
              onChange={(e) => setForm((f) => ({ ...f, resourceCategoryId: e.target.value }))}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dr-thumbnail">Thumbnail</Label>
            <Input
              id="dr-thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) => {
                setThumbnailFile(e.target.files?.[0] || null);
                setThumbnailProgress(0);
              }}
            />
            {thumbnailProgress > 0 && thumbnailProgress < 100 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${thumbnailProgress}%` }}
                />
              </div>
            )}
            {isEdit && resource?.thumbnail && !thumbnailFile && (
              <p className="text-xs text-gray-500">Current: {resource.thumbnail.split("/").pop()}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dr-resourceFile">Resource File</Label>
            <Input
              id="dr-resourceFile"
              type="file"
              onChange={(e) => {
                setResourceFile(e.target.files?.[0] || null);
                setResourceFileProgress(0);
              }}
            />
            {resourceFileProgress > 0 && resourceFileProgress < 100 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${resourceFileProgress}%` }}
                />
              </div>
            )}
            {isEdit && resource?.resourceFile && !resourceFile && (
              <p className="text-xs text-gray-500">Current: {resource.resourceFile.split("/").pop()}</p>
            )}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Resource"}
            </Button>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
