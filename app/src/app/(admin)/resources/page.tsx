"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  FolderOpen,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";

// --- Types ---

interface ResourceCategory {
  _id: string;
  name: string;
}

interface Resource {
  _id: string;
  name: string;
  category: string | { _id: string; name: string };
  thumbnail?: string;
  fileName?: string;
  fileUrl?: string;
  createdAt: string;
}

// --- Helpers ---

function getCategoryName(
  category: string | { _id: string; name: string }
): string {
  if (typeof category === "string") return category;
  return category?.name || "Uncategorized";
}

function getCategoryId(
  category: string | { _id: string; name: string }
): string {
  if (typeof category === "string") return category;
  return category?._id || "";
}

// --- Page ---

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, resRes] = await Promise.all([
        fetch("/api/resources/categories"),
        fetch("/api/resources"),
      ]);

      const catJson = await catRes.json();
      const resJson = await resRes.json();

      if (!catRes.ok || !catJson.success) {
        throw new Error(catJson.message || "Failed to load categories");
      }
      if (!resRes.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to load resources");
      }

      setCategories(catJson.data || []);
      setResources(resJson.data || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter resources by active category
  const filteredResources =
    activeCategory === "all"
      ? resources
      : resources.filter((r) => {
          const catId = getCategoryId(r.category);
          return catId === activeCategory;
        });

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load resources
          </p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and manage resource documents and files
          </p>
        </div>
        <Link href="/resources/add">
          <Button>
            <Plus className="h-4 w-4" />
            Add Resource
          </Button>
        </Link>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
            >
              <FolderOpen className="h-4 w-4" />
              All
              <Badge variant="secondary" className="ml-1.5">
                {resources.length}
              </Badge>
            </Button>
            {categories.map((cat) => {
              const count = resources.filter(
                (r) => getCategoryId(r.category) === cat._id
              ).length;
              return (
                <Button
                  key={cat._id}
                  variant={
                    activeCategory === cat._id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setActiveCategory(cat._id)}
                >
                  {cat.name}
                  <Badge variant="secondary" className="ml-1.5">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resource Grid */}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredResources.map((resource) => (
            <Card
              key={resource._id}
              className="group cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="flex h-40 items-center justify-center rounded-t-2xl bg-gray-100">
                  {resource.thumbnail ? (
                    <img
                      src={resource.thumbnail}
                      alt={resource.name}
                      className="h-full w-full rounded-t-2xl object-cover"
                    />
                  ) : (
                    <FileText className="h-12 w-12 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="truncate text-sm font-semibold text-gray-900">
                    {resource.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {getCategoryName(resource.category)}
                  </p>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2">
                    {resource.fileUrl && (
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm">
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      </a>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
