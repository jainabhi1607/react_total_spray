"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,

  Save,
  X,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading, InlineLoading } from "@/components/ui/loading";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Types ---

interface ChecklistTemplate {
  _id: string;
  title: string;
}

interface ChecklistItemAPI {
  _id: string;
  details: string;
  checklistItemType: number;
  makeResponseMandatory: number;
  orderNo: number;
  fileName?: string;
  fileSize?: string;
}

interface TemplateTagAPI {
  _id: string;
  checklistTagId: {
    _id: string;
    title: string;
  };
}

interface ChecklistDetailAPI {
  _id: string;
  title: string;
  items: ChecklistItemAPI[];
  tags: TemplateTagAPI[];
}

interface AvailableTag {
  _id: string;
  title: string;
}

// --- Constants ---

const SECTION_BREAK_TYPE = 0;

const RESPONSE_TYPES = [
  { value: 1, label: "Checkbox", color: "bg-teal-100 text-teal-800" },
  { value: 2, label: "Pass/Fail/N/A", color: "bg-orange-100 text-orange-800" },
  { value: 3, label: "Image", color: "bg-green-100 text-green-800" },
  { value: 4, label: "Comment", color: "bg-gray-200 text-gray-800" },
  { value: 5, label: "Yes/No", color: "bg-blue-100 text-blue-800" },
  { value: 6, label: "Poor/Fair/Good", color: "bg-purple-100 text-purple-800" },
  { value: 7, label: "Signature", color: "bg-amber-100 text-amber-800" },
  { value: 8, label: "Set Date & Time", color: "bg-indigo-100 text-indigo-800" },
  { value: 9, label: "Text Only - No Response", color: "bg-slate-100 text-slate-700" },
];

function getTypeLabel(type: number): string {
  if (type === SECTION_BREAK_TYPE) return "Section Break";
  return RESPONSE_TYPES.find((t) => t.value === type)?.label || "Unknown";
}

function getTypeColor(type: number): string {
  return (
    RESPONSE_TYPES.find((t) => t.value === type)?.color ||
    "bg-gray-100 text-gray-800"
  );
}

// --- Component ---

export function ChecklistTemplatesSection() {
  // Template list
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Selected template detail
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChecklistDetailAPI | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add template dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  // Edit template title
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);

  // Tags dialog
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [tagSaving, setTagSaving] = useState<string | null>(null);

  // Add Section Break dialog
  const [sectionBreakOpen, setSectionBreakOpen] = useState(false);
  const [sectionBreakDetails, setSectionBreakDetails] = useState("");
  const [sectionBreakSaving, setSectionBreakSaving] = useState(false);

  // Add Checklist Item dialog
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemDetails, setAddItemDetails] = useState("");
  const [addItemType, setAddItemType] = useState("");
  const [addItemMandatory, setAddItemMandatory] = useState(false);
  const [addItemFile, setAddItemFile] = useState<File | null>(null);
  const [addItemSaving, setAddItemSaving] = useState(false);

  // Edit Item dialog
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editItemIsSectionBreak, setEditItemIsSectionBreak] = useState(false);
  const [editItemDetails, setEditItemDetails] = useState("");
  const [editItemType, setEditItemType] = useState("");
  const [editItemMandatory, setEditItemMandatory] = useState(false);
  const [editItemFileName, setEditItemFileName] = useState("");
  const [editItemFile, setEditItemFile] = useState<File | null>(null);
  const [editItemSaving, setEditItemSaving] = useState(false);

  // Drag and drop
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // --- Fetch templates ---
  const fetchTemplates = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/checklists?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        const raw = json.data;
        setTemplates(
          Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
        );
      }
    } catch {
      // silent
    } finally {
      setListLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // --- Fetch detail ---
  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/checklists/${id}`);
      const json = await res.json();
      if (json.success) {
        setDetail(json.data);
        setTitleValue(json.data.title || "");
      }
    } catch {
      // silent
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // --- Fetch available tags ---
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/checklists/tags");
        const json = await res.json();
        if (json.success) setAvailableTags(json.data || []);
      } catch {
        // silent
      }
    })();
  }, []);

  // --- Select template ---
  function handleSelect(id: string) {
    setSelectedId(id);
    setEditingTitle(false);
    fetchDetail(id);
  }

  // --- Add template ---
  async function handleAddTemplate() {
    if (!addTitle.trim()) return;
    setAddSaving(true);
    try {
      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: addTitle.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setAddOpen(false);
        setAddTitle("");
        await fetchTemplates();
        handleSelect(json.data._id);
      }
    } catch {
      // silent
    } finally {
      setAddSaving(false);
    }
  }

  // --- Delete template ---
  async function handleDeleteTemplate(id: string) {
    if (!confirm("Delete this checklist template?")) return;
    try {
      const res = await fetch(`/api/checklists/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        if (selectedId === id) {
          setSelectedId(null);
          setDetail(null);
        }
        fetchTemplates();
      }
    } catch {
      // silent
    }
  }

  // --- Save Title ---
  async function handleSaveTitle() {
    if (!titleValue.trim() || !selectedId) return;
    setTitleSaving(true);
    try {
      const res = await fetch(`/api/checklists/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleValue.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingTitle(false);
        fetchDetail(selectedId);
        fetchTemplates();
      }
    } catch {
      // silent
    } finally {
      setTitleSaving(false);
    }
  }

  // --- Tags ---
  async function handleToggleTag(tagId: string, isAssigned: boolean) {
    if (!selectedId) return;
    setTagSaving(tagId);
    try {
      if (isAssigned) {
        await fetch(`/api/checklists/${selectedId}/tags/${tagId}`, {
          method: "DELETE",
        });
      } else {
        await fetch(`/api/checklists/${selectedId}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checklistTagId: tagId }),
        });
      }
      await fetchDetail(selectedId);
    } catch {
      // silent
    } finally {
      setTagSaving(null);
    }
  }

  async function handleRemoveTag(checklistTagId: string) {
    if (!selectedId) return;
    try {
      await fetch(`/api/checklists/${selectedId}/tags/${checklistTagId}`, {
        method: "DELETE",
      });
      fetchDetail(selectedId);
    } catch {
      // silent
    }
  }

  // --- Add Section Break ---
  async function handleAddSectionBreak() {
    if (!sectionBreakDetails.trim() || !selectedId) return;
    setSectionBreakSaving(true);
    try {
      const maxOrder = Math.max(
        0,
        ...(detail?.items?.map((i) => i.orderNo || 0) || [])
      );
      const res = await fetch(`/api/checklists/${selectedId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: sectionBreakDetails.trim(),
          checklistItemType: SECTION_BREAK_TYPE,
          makeResponseMandatory: 0,
          orderNo: maxOrder + 1,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSectionBreakOpen(false);
        setSectionBreakDetails("");
        fetchDetail(selectedId);
      }
    } catch {
      // silent
    } finally {
      setSectionBreakSaving(false);
    }
  }

  // --- Add Checklist Item ---
  async function handleAddItem() {
    if (!addItemDetails.trim() || !addItemType || !selectedId) return;
    setAddItemSaving(true);
    try {
      const maxOrder = Math.max(
        0,
        ...(detail?.items?.map((i) => i.orderNo || 0) || [])
      );
      const res = await fetch(`/api/checklists/${selectedId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details: addItemDetails.trim(),
          checklistItemType: parseInt(addItemType),
          makeResponseMandatory: addItemMandatory ? 1 : 0,
          orderNo: maxOrder + 1,
          fileName: addItemFile?.name || "",
          fileSize: addItemFile ? String(addItemFile.size) : "",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAddItemOpen(false);
        setAddItemDetails("");
        setAddItemType("");
        setAddItemMandatory(false);
        setAddItemFile(null);
        fetchDetail(selectedId);
      }
    } catch {
      // silent
    } finally {
      setAddItemSaving(false);
    }
  }

  // --- Edit Item ---
  function openEditItem(item: ChecklistItemAPI) {
    const isSB = item.checklistItemType === SECTION_BREAK_TYPE;
    setEditItemId(item._id);
    setEditItemIsSectionBreak(isSB);
    setEditItemDetails(item.details || "");
    setEditItemType(String(item.checklistItemType));
    setEditItemMandatory(item.makeResponseMandatory === 1);
    setEditItemFileName(item.fileName || "");
    setEditItemFile(null);
    setEditItemOpen(true);
  }

  async function handleEditItem() {
    if (!editItemDetails.trim() || !editItemId || !selectedId) return;
    setEditItemSaving(true);
    try {
      const res = await fetch(
        `/api/checklists/${selectedId}/items/${editItemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            details: editItemDetails.trim(),
            checklistItemType: parseInt(editItemType),
            makeResponseMandatory: editItemIsSectionBreak
              ? 0
              : editItemMandatory
                ? 1
                : 0,
            fileName: editItemFile
              ? editItemFile.name
              : editItemFileName || "",
            fileSize: editItemFile
              ? String(editItemFile.size)
              : editItemFileName
                ? undefined
                : "",
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setEditItemOpen(false);
        fetchDetail(selectedId);
      }
    } catch {
      // silent
    } finally {
      setEditItemSaving(false);
    }
  }

  // --- Delete Item ---
  async function handleDeleteItem(itemId: string) {
    if (!confirm("Delete this item?") || !selectedId) return;
    try {
      await fetch(`/api/checklists/${selectedId}/items/${itemId}`, {
        method: "DELETE",
      });
      fetchDetail(selectedId);
    } catch {
      // silent
    }
  }

  // --- Drag and Drop ---
  async function handleDrop(fromIndex: number, toIndex: number) {
    if (!detail || fromIndex === toIndex) return;
    const sorted = [...detail.items].sort(
      (a, b) => (a.orderNo || 0) - (b.orderNo || 0)
    );
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);

    const reordered = sorted.map((item, i) => ({
      ...item,
      orderNo: i + 1,
    }));

    // Optimistic update
    setDetail((prev) => (prev ? { ...prev, items: reordered } : null));

    if (selectedId) {
      try {
        await fetch(`/api/checklists/${selectedId}/items`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: reordered.map((item) => ({
              id: item._id,
              orderNo: item.orderNo,
            })),
          }),
        });
      } catch {
        fetchDetail(selectedId);
      }
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  // --- Render ---

  if (listLoading && templates.length === 0) return <PageLoading />;

  const sortedItems = detail
    ? [...detail.items].sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0))
    : [];

  const validTags = (detail?.tags || []).filter((t) => t.checklistTagId);
  const assignedTagIds = new Set(
    validTags.map((t) => t.checklistTagId._id)
  );

  let itemCounter = 0;

  return (
    <>
      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
        {/* Left Panel — Template list */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Templates
              </h2>
              <p className="text-sm text-gray-400">
                Create new template here
              </p>
            </div>
            <Button
              onClick={() => {
                setAddTitle("");
                setAddOpen(true);
              }}
              className="mb-4 bg-cyan-500 hover:bg-cyan-600"
            >
              <Plus className="h-4 w-4" />
              Add New Template
            </Button>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search Checklist Templates"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Template list */}
            <div className="space-y-3">
              {templates.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  No templates found
                </p>
              ) : (
                templates.map((t) => (
                  <div
                    key={t._id}
                    className={`flex items-center justify-between rounded-[10px] border p-4 transition-colors ${
                      selectedId === t._id
                        ? "border-cyan-300 bg-cyan-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <button
                      onClick={() => handleSelect(t._id)}
                      className="min-w-0 flex-1 text-left text-sm font-medium text-orange-500 hover:text-orange-600"
                    >
                      {t.title}
                    </button>
                    <div className="ml-3 flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => handleSelect(t._id)}
                        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(t._id)}
                        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel — Detail */}
        <Card className="min-h-[200px]">
          <CardContent className="p-6">
            {!selectedId ? (
              <div className="flex h-full items-center justify-center py-16">
                <p className="text-sm text-cyan-500">
                  Please select a template
                </p>
              </div>
            ) : detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <InlineLoading />
              </div>
            ) : !detail ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-gray-400">Template not found</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Title */}
                <div>
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
                            setTitleValue(detail.title);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveTitle}
                        disabled={titleSaving}
                      >
                        {titleSaving ? (
                          <InlineLoading />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingTitle(false);
                          setTitleValue(detail.title);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <h2
                      className="cursor-pointer text-xl font-bold text-gray-900 transition-colors hover:text-cyan-600"
                      onClick={() => setEditingTitle(true)}
                      title="Click to edit title"
                    >
                      {detail.title}
                    </h2>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  {validTags.map((tag) => (
                    <span
                      key={tag._id}
                      className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-800"
                    >
                      {tag.checklistTagId.title}
                      <button
                        onClick={() =>
                          handleRemoveTag(tag.checklistTagId._id)
                        }
                        className="ml-0.5 rounded-full p-0.5 hover:bg-cyan-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => setTagDialogOpen(true)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-cyan-400 hover:text-cyan-500"
                    title="Add Tags"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setSectionBreakDetails("");
                      setSectionBreakOpen(true);
                    }}
                    className="text-sm font-medium text-cyan-500 hover:text-cyan-600"
                  >
                    + Add Section Break
                  </button>
                  <button
                    onClick={() => {
                      setAddItemDetails("");
                      setAddItemType("");
                      setAddItemMandatory(false);
                      setAddItemFile(null);
                      setAddItemOpen(true);
                    }}
                    className="text-sm font-medium text-cyan-500 hover:text-cyan-600"
                  >
                    + Add Checklist Item
                  </button>
                </div>

                {/* Items list */}
                {sortedItems.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-400">
                    No items added yet
                  </p>
                ) : (
                  <div className="space-y-[10px]">
                    {sortedItems.map((item, index) => {
                      const isSectionBreak =
                        item.checklistItemType === SECTION_BREAK_TYPE;
                      if (!isSectionBreak) itemCounter++;
                      const displayNum = itemCounter;

                      return (
                        <div
                          key={item._id}
                          draggable
                          onDragStart={() => setDragIndex(index)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverIndex(index);
                          }}
                          onDragEnd={() => {
                            setDragIndex(null);
                            setDragOverIndex(null);
                          }}
                          onDrop={() => {
                            if (dragIndex !== null)
                              handleDrop(dragIndex, index);
                          }}
                          style={{ padding: "27px 15px 27px 35px", lineHeight: "30px" }}
                          className={`flex items-center gap-3 rounded-[10px] border border-[#d0dfe6] transition-all ${
                            isSectionBreak
                              ? "!bg-gray-800 !text-white !border-gray-700"
                              : "bg-white hover:bg-gray-50"
                          } ${
                            dragOverIndex === index && dragIndex !== index
                              ? "border-cyan-400 shadow-sm"
                              : ""
                          } ${dragIndex === index ? "opacity-50" : ""}`}
                        >
                          {/* Drag handle */}
                          <div className="shrink-0 cursor-grab active:cursor-grabbing">
                            <img
                              src="/move.svg"
                              alt="Move"
                              className={`h-5 w-5 ${
                                isSectionBreak ? "opacity-60" : "opacity-40"
                              }`}
                            />
                          </div>

                          {isSectionBreak ? (
                            <>
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold">
                                  {item.details}
                                </span>
                              </div>
                              <span className="shrink-0 text-xs text-gray-400">
                                Section Break
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="shrink-0 text-sm font-medium text-gray-400">
                                {displayNum}.
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="text-sm text-gray-900">
                                  {item.details}
                                </span>
                                {item.makeResponseMandatory === 1 && (
                                  <span className="ml-1 text-red-500">*</span>
                                )}
                              </div>
                              <Badge
                                className={`shrink-0 text-xs ${getTypeColor(
                                  item.checklistItemType
                                )}`}
                              >
                                {getTypeLabel(item.checklistItemType)}
                              </Badge>
                            </>
                          )}

                          {/* Edit / Delete */}
                          <div className="ml-1 flex shrink-0 items-center gap-1">
                            <button
                              onClick={() => openEditItem(item)}
                              className={`rounded p-1 ${
                                isSectionBreak
                                  ? "text-gray-400 hover:text-white"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              className={`rounded p-1 ${
                                isSectionBreak
                                  ? "text-gray-400 hover:text-red-300"
                                  : "text-gray-400 hover:text-red-600"
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Template Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Template</DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-6 py-2">
            <Label className="shrink-0 text-sm text-gray-700">Template</Label>
            <Input
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddTemplate()}
            />
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleAddTemplate}
              disabled={addSaving || !addTitle.trim()}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {addSaving ? <InlineLoading /> : "Add Template"}
            </Button>
            <button
              onClick={() => setAddOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Tags Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="py-3">
            {availableTags.length === 0 ? (
              <p className="text-sm text-gray-400">No tags available</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isAssigned = assignedTagIds.has(tag._id);
                  const isToggling = tagSaving === tag._id;
                  return (
                    <button
                      key={tag._id}
                      onClick={() => handleToggleTag(tag._id, isAssigned)}
                      disabled={isToggling}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        isAssigned
                          ? "bg-cyan-500 text-white hover:bg-cyan-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${isToggling ? "opacity-50" : ""}`}
                    >
                      {tag.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center pt-2">
            <button
              onClick={() => setTagDialogOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Section Break Dialog */}
      <Dialog open={sectionBreakOpen} onOpenChange={setSectionBreakOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Section Break</DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-6 py-2">
            <Label className="shrink-0 text-sm text-gray-700">Details</Label>
            <Input
              value={sectionBreakDetails}
              onChange={(e) => setSectionBreakDetails(e.target.value)}
              autoFocus
              onKeyDown={(e) =>
                e.key === "Enter" && handleAddSectionBreak()
              }
            />
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleAddSectionBreak}
              disabled={sectionBreakSaving || !sectionBreakDetails.trim()}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {sectionBreakSaving ? <InlineLoading /> : "Add Section Break"}
            </Button>
            <button
              onClick={() => setSectionBreakOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Checklist Item Dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Checklist Item</DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="space-y-4 py-3">
            {/* Details */}
            <div className="flex items-center gap-6">
              <Label className="w-28 shrink-0 text-sm text-gray-700">
                Details
              </Label>
              <Input
                value={addItemDetails}
                onChange={(e) => setAddItemDetails(e.target.value)}
                autoFocus
              />
            </div>
            {/* Response Type */}
            <div className="flex items-center gap-6">
              <Label className="w-28 shrink-0 text-sm text-gray-700">
                Response Type
              </Label>
              <Select value={addItemType} onValueChange={setAddItemType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select response type" />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSE_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={String(rt.value)}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Make response mandatory */}
            <div className="flex items-center gap-3 pl-[7.5rem]">
              <Checkbox
                id="add-mandatory"
                checked={addItemMandatory}
                onCheckedChange={(v) => setAddItemMandatory(v === true)}
              />
              <Label
                htmlFor="add-mandatory"
                className="text-sm text-gray-700"
              >
                Make response mandatory
              </Label>
            </div>
            {/* Item Image */}
            <div className="flex items-center gap-6">
              <Label className="w-28 shrink-0 text-sm text-gray-700">
                Item Image
              </Label>
              <div className="flex flex-1 items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  {addItemFile ? addItemFile.name : "Choose File"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setAddItemFile(e.target.files?.[0] || null)
                    }
                  />
                </label>
                {addItemFile && (
                  <button
                    onClick={() => setAddItemFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleAddItem}
              disabled={
                addItemSaving || !addItemDetails.trim() || !addItemType
              }
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {addItemSaving ? <InlineLoading /> : "Add Checklist Item"}
            </Button>
            <button
              onClick={() => setAddItemOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItemIsSectionBreak
                ? "Edit Section Break"
                : "Edit Checklist Item"}
            </DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="space-y-4 py-3">
            {/* Details */}
            <div className="flex items-center gap-6">
              <Label className="w-28 shrink-0 text-sm text-gray-700">
                Details
              </Label>
              <Input
                value={editItemDetails}
                onChange={(e) => setEditItemDetails(e.target.value)}
                autoFocus
              />
            </div>
            {/* Response Type (only for non-section-break) */}
            {!editItemIsSectionBreak && (
              <>
                <div className="flex items-center gap-6">
                  <Label className="w-28 shrink-0 text-sm text-gray-700">
                    Response Type
                  </Label>
                  <Select
                    value={editItemType}
                    onValueChange={setEditItemType}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select response type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESPONSE_TYPES.map((rt) => (
                        <SelectItem key={rt.value} value={String(rt.value)}>
                          {rt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pl-[7.5rem]">
                  <Checkbox
                    id="edit-mandatory"
                    checked={editItemMandatory}
                    onCheckedChange={(v) => setEditItemMandatory(v === true)}
                  />
                  <Label
                    htmlFor="edit-mandatory"
                    className="text-sm text-gray-700"
                  >
                    Make response mandatory
                  </Label>
                </div>
                {/* Item Image */}
                <div className="flex items-center gap-6">
                  <Label className="w-28 shrink-0 text-sm text-gray-700">
                    Item Image
                  </Label>
                  <div className="flex flex-1 items-center gap-3">
                    {editItemFile ? (
                      <>
                        <span className="text-sm text-gray-700">
                          {editItemFile.name}
                        </span>
                        <button
                          onClick={() => setEditItemFile(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : editItemFileName ? (
                      <>
                        <span className="text-sm text-gray-700">
                          {editItemFileName}
                        </span>
                        <button
                          onClick={() => setEditItemFileName("")}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        Choose File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            setEditItemFile(e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleEditItem}
              disabled={
                editItemSaving ||
                !editItemDetails.trim() ||
                (!editItemIsSectionBreak && !editItemType)
              }
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {editItemSaving ? (
                <InlineLoading />
              ) : editItemIsSectionBreak ? (
                "Save Section Break"
              ) : (
                "Update Checklist Item"
              )}
            </Button>
            <button
              onClick={() => setEditItemOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
