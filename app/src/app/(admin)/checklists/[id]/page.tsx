"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  GripVertical,
  Save,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading, InlineLoading } from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Types ---

interface ChecklistItem {
  _id: string;
  details: string;
  type: number;
  mandatory: boolean;
  sortOrder: number;
}

interface ChecklistTag {
  _id: string;
  name: string;
}

interface ChecklistDetail {
  _id: string;
  title: string;
  items: ChecklistItem[];
  tags: ChecklistTag[];
  createdAt: string;
}

interface AvailableTag {
  _id: string;
  name: string;
}

// --- Constants ---

const ITEM_TYPE_LABELS: Record<number, string> = {
  1: "Yes/No",
  2: "Text",
  3: "Number",
  4: "Photo",
  5: "Signature",
  6: "Date",
  7: "Checkbox",
  10: "Rating",
};

const ITEM_TYPE_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-800",
  2: "bg-gray-100 text-gray-800",
  3: "bg-purple-100 text-purple-800",
  4: "bg-green-100 text-green-800",
  5: "bg-orange-100 text-orange-800",
  6: "bg-yellow-100 text-yellow-800",
  7: "bg-teal-100 text-teal-800",
  10: "bg-pink-100 text-pink-800",
};

// --- Page ---

export default function ChecklistDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [checklist, setChecklist] = useState<ChecklistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);

  // Add item form
  const [newItemDetails, setNewItemDetails] = useState("");
  const [newItemType, setNewItemType] = useState("");
  const [newItemMandatory, setNewItemMandatory] = useState(false);
  const [itemSaving, setItemSaving] = useState(false);

  // Tags
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [tagSaving, setTagSaving] = useState(false);

  const fetchChecklist = useCallback(async () => {
    try {
      const res = await fetch(`/api/checklists/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load checklist");
      }
      setChecklist(json.data);
      setTitleValue(json.data.title || "");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/checklists/tags");
      const json = await res.json();
      if (res.ok && json.success) {
        setAvailableTags(json.data || []);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchChecklist();
    fetchTags();
  }, [fetchChecklist, fetchTags]);

  // --- Title handlers ---

  async function handleSaveTitle() {
    if (!titleValue.trim()) return;
    setTitleSaving(true);
    try {
      const res = await fetch(`/api/checklists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleValue.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update title");
      }
      setEditingTitle(false);
      fetchChecklist();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTitleSaving(false);
    }
  }

  // --- Item handlers ---

  async function handleAddItem() {
    if (!newItemDetails.trim() || !newItemType) return;
    setItemSaving(true);
    try {
      const res = await fetch(`/api/checklists/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: newItemDetails.trim(),
          type: parseInt(newItemType),
          mandatory: newItemMandatory,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add item");
      }
      setNewItemDetails("");
      setNewItemType("");
      setNewItemMandatory(false);
      fetchChecklist();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setItemSaving(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Are you sure you want to delete this checklist item?"))
      return;
    try {
      const res = await fetch(`/api/checklists/${id}/items/${itemId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete item");
      }
      fetchChecklist();
    } catch (err: any) {
      alert(err.message);
    }
  }

  // --- Tag handlers ---

  async function handleAddTag() {
    if (!selectedTagId) return;
    setTagSaving(true);
    try {
      const res = await fetch(`/api/checklists/${id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: selectedTagId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add tag");
      }
      setSelectedTagId("");
      fetchChecklist();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTagSaving(false);
    }
  }

  async function handleRemoveTag(tagId: string) {
    try {
      const res = await fetch(`/api/checklists/${id}/tags/${tagId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to remove tag");
      }
      fetchChecklist();
    } catch (err: any) {
      alert(err.message);
    }
  }

  // --- Rendering ---

  if (loading) {
    return <PageLoading />;
  }

  if (error || !checklist) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load checklist
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {error || "Checklist not found"}
          </p>
          <Link href="/checklists" className="mt-4 inline-block">
            <Button variant="outline">Back to Checklists</Button>
          </Link>
        </div>
      </div>
    );
  }

  const assignedTagIds = new Set(checklist.tags?.map((t) => t._id) || []);
  const unassignedTags = availableTags.filter(
    (t) => !assignedTagIds.has(t._id)
  );

  const sortedItems = [...(checklist.items || [])].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/checklists">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                className="max-w-md text-lg font-bold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setEditingTitle(false);
                    setTitleValue(checklist.title);
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleSaveTitle}
                disabled={titleSaving}
              >
                {titleSaving ? <InlineLoading /> : <Save className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingTitle(false);
                  setTitleValue(checklist.title);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1
              className="cursor-pointer text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              onClick={() => setEditingTitle(true)}
              title="Click to edit title"
            >
              {checklist.title}
            </h1>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Checklist template detail and items
          </p>
        </div>
      </div>

      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Checklist Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedItems.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">
                No items added yet. Add your first checklist item below.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedItems.map((item, index) => (
                <div
                  key={item._id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 cursor-grab text-gray-400">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <span className="flex-shrink-0 text-sm font-medium text-gray-400">
                    {index + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.details}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        className={
                          ITEM_TYPE_COLORS[item.type] ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {ITEM_TYPE_LABELS[item.type] || "Unknown"}
                      </Badge>
                      {item.mandatory && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteItem(item._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add item form */}
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
              Add New Item
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-5">
                <Input
                  placeholder="Item details / question"
                  value={newItemDetails}
                  onChange={(e) => setNewItemDetails(e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Select
                  value={newItemType}
                  onValueChange={setNewItemType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Yes/No</SelectItem>
                    <SelectItem value="2">Text</SelectItem>
                    <SelectItem value="3">Number</SelectItem>
                    <SelectItem value="4">Photo</SelectItem>
                    <SelectItem value="5">Signature</SelectItem>
                    <SelectItem value="6">Date</SelectItem>
                    <SelectItem value="7">Checkbox</SelectItem>
                    <SelectItem value="10">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Switch
                  checked={newItemMandatory}
                  onCheckedChange={setNewItemMandatory}
                  id="mandatory"
                />
                <Label htmlFor="mandatory" className="text-sm">
                  Required
                </Label>
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleAddItem}
                  disabled={
                    itemSaving || !newItemDetails.trim() || !newItemType
                  }
                  className="w-full"
                >
                  {itemSaving ? (
                    <InlineLoading />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Tag className="h-5 w-5 text-gray-500" />
          <CardTitle className="text-lg">Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assigned tags */}
          <div className="flex flex-wrap gap-2">
            {(!checklist.tags || checklist.tags.length === 0) ? (
              <p className="text-sm text-gray-500">No tags assigned</p>
            ) : (
              checklist.tags.map((tag) => (
                <Badge
                  key={tag._id}
                  variant="default"
                  className="flex items-center gap-1 pl-3 pr-1.5 py-1"
                >
                  {tag.name}
                  <button
                    onClick={() => handleRemoveTag(tag._id)}
                    className="ml-1 rounded-full p-0.5 hover:bg-blue-200 transition-colors"
                    aria-label={`Remove tag ${tag.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>

          {/* Add tag */}
          {unassignedTags.length > 0 && (
            <div className="flex items-end gap-3 pt-2">
              <div className="flex-1 space-y-2">
                <Label>Add Tag</Label>
                <Select
                  value={selectedTagId}
                  onValueChange={setSelectedTagId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedTags.map((tag) => (
                      <SelectItem key={tag._id} value={tag._id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddTag}
                disabled={tagSaving || !selectedTagId}
              >
                {tagSaving ? <InlineLoading /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
