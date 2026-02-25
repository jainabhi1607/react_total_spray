"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, FolderOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { ResourceDialog } from "@/components/dialogs/resource-dialog";

interface Category {
  _id: string;
  title: string;
}

interface Resource {
  _id: string;
  resourceName: string;
  resourceCategoryId: string | { _id: string; title: string };
  thumbnail?: string;
  resourceFile?: string;
}

function getCategoryId(cat: string | { _id: string } | undefined): string {
  if (!cat) return "";
  if (typeof cat === "string") return cat;
  return cat._id || "";
}

export default function ResourcesPage() {
  useEffect(() => { document.title = "TSC - Resources"; }, []);

  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editResource, setEditResource] = useState<Resource | undefined>(undefined);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, resRes] = await Promise.all([
        fetch("/api/resources/categories"),
        fetch("/api/resources?limit=1000"),
      ]);

      const catJson = await catRes.json();
      const resJson = await resRes.json();

      if (!catRes.ok || !catJson.success) {
        throw new Error(catJson.error || catJson.message || "Failed to load categories");
      }
      if (!resRes.ok || !resJson.success) {
        throw new Error(resJson.error || resJson.message || "Failed to load resources");
      }

      const cats: Category[] = catJson.data || [];
      setCategories(cats);

      const raw = resJson.data?.data || resJson.data || [];
      setResources(Array.isArray(raw) ? raw : []);

      // Set first category as active tab by default (if not already set)
      if (cats.length > 0) {
        setActiveTab((prev) => prev || cats[0]._id);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleAdd() {
    setEditResource(undefined);
    setDialogOpen(true);
  }

  function handleEdit(resource: Resource) {
    setEditResource(resource);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete resource");
    }
  }

  // Filter resources by active tab
  const filteredResources = resources.filter(
    (r) => getCategoryId(r.resourceCategoryId) === activeTab
  );

  if (loading) return <PageLoading />;

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Unable to load resources</p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <Button
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" />
          Add Resource
        </Button>
      </div>

      <hr className="border-gray-200" />

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex gap-6 border-b border-gray-200">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveTab(cat._id)}
              className={`whitespace-nowrap pb-2.5 text-sm font-medium transition-colors ${
                activeTab === cat._id
                  ? "border-b-2 border-cyan-500 text-cyan-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {/* Resource Cards */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No resources found in this category
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredResources.map((resource) => (
            <div
              key={resource._id}
              className="flex items-center gap-4 rounded-[10px] border border-gray-200 bg-white px-5 py-4"
            >
              {/* Thumbnail */}
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-gray-100">
                {resource.thumbnail ? (
                  <img
                    src={resource.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-300" />
                  </div>
                )}
              </div>
              {/* Resource File */}
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-gray-100">
                {resource.resourceFile ? (
                  <img
                    src={resource.resourceFile}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-300" />
                  </div>
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                {resource.resourceName}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(resource)}
                  className="rounded-[10px] p-1.5 text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(resource._id)}
                  className="rounded-[10px] p-1.5 text-gray-400 cursor-pointer hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <ResourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
        resource={editResource}
        categories={categories}
      />
    </div>
  );
}
