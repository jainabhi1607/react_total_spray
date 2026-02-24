"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  Wrench,
  Settings2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InlineLoading } from "@/components/ui/loading";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SettingsItem {
  _id: string;
  title: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Generic CRUD hook
// ---------------------------------------------------------------------------

function useSettingsCrud(endpoint: string) {
  const [items, setItems] = useState<SettingsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to load");
      const raw = json.data;
      setItems(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (body: Record<string, any>) => {
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to add");
      await fetchItems();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (id: string, body: Record<string, any>) => {
    setSaving(true);
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to update");
      await fetchItems();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to delete");
      await fetchItems();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { items, loading, saving, error, setError, addItem, updateItem, deleteItem, fetchItems };
}

// ---------------------------------------------------------------------------
// SettingsListSection — new design with search, table, pagination, dialogs
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 10;

export function SettingsListSection({
  entityName,
  endpoint,
}: {
  entityName: string;
  endpoint: string;
}) {
  const { items, loading, saving, error, setError, addItem, updateItem, deleteItem } =
    useSettingsCrud(endpoint);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogValue, setDialogValue] = useState("");

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  function openCreate() {
    setEditId(null);
    setDialogValue("");
    setDialogOpen(true);
  }

  function openEdit(item: SettingsItem) {
    setEditId(item._id);
    setDialogValue(item.title);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!dialogValue.trim()) return;
    let ok: boolean;
    if (editId) {
      ok = await updateItem(editId, { title: dialogValue.trim() });
    } else {
      ok = await addItem({ title: dialogValue.trim() });
    }
    if (ok) {
      setDialogOpen(false);
      setEditId(null);
      setDialogValue("");
    }
  }

  async function handleDelete(item: SettingsItem) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await deleteItem(item._id);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-[10px] bg-red-50 p-3 text-sm text-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Search + Create */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={`Search ${entityName}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create New {entityName}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <InlineLoading />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#EBF5FF] hover:bg-[#EBF5FF]">
                    <TableHead className="font-semibold text-gray-700">Title</TableHead>
                    <TableHead className="w-[100px] text-right font-semibold text-gray-700">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="py-8 text-center text-sm text-gray-500"
                      >
                        {search
                          ? "No matching items found."
                          : `No ${entityName.toLowerCase()}s found.`}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium text-gray-900">
                          {item.title}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(item)}
                              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}, showing {filteredItems.length} record(s)
                  out of {items.length} total
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit" : "Create"} {entityName}
            </DialogTitle>
            <DialogDescription>
              {editId
                ? `Update the ${entityName.toLowerCase()} title.`
                : `Add a new ${entityName.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={dialogValue}
              onChange={(e) => setDialogValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={`Enter ${entityName.toLowerCase()} title...`}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !dialogValue.trim()}>
              {saving ? <InlineLoading /> : <Save className="h-4 w-4" />}
              {editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tags Settings — tabbed for Technicians Tags + Checklist Template Tags
// ---------------------------------------------------------------------------

export function TagsSettingsSection() {
  return (
    <Tabs defaultValue="technician-tags">
      <TabsList>
        <TabsTrigger value="technician-tags">Technicians Tags</TabsTrigger>
        <TabsTrigger value="checklist-tags">Checklist Template Tags</TabsTrigger>
      </TabsList>
      <TabsContent value="technician-tags" className="mt-4">
        <SettingsListSection entityName="Tag" endpoint="/api/settings/tags" />
      </TabsContent>
      <TabsContent value="checklist-tags" className="mt-4">
        <SettingsListSection entityName="Tag" endpoint="/api/checklists/tags" />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Email Notification Settings — matches the screenshot design
// ---------------------------------------------------------------------------

export function EmailNotificationSection() {
  const [settings, setSettings] = useState({
    technicianInvalidInsuranceNotificationEmails: "",
    supportTicketAlertRecipients: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings/global");
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to load");
        setSettings({
          technicianInvalidInsuranceNotificationEmails:
            json.data?.technicianInvalidInsuranceNotificationEmails || "",
          supportTicketAlertRecipients:
            json.data?.supportTicketAlertRecipients || "",
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleUpdate(field: keyof typeof settings) {
    setSavingField(field);
    setError(null);
    try {
      const res = await fetch("/api/settings/global", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: settings[field] }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to save");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingField(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <InlineLoading />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-[10px] bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <hr className="border-gray-200" />

      {/* Technician Invalid Insurance Notifications */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="shrink-0 md:w-80">
          <h3 className="text-base font-semibold text-gray-900">
            Technician Invalid Insurance Notifications
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Add email address, one in each line.
          </p>
        </div>
        <div className="flex-1 max-w-lg space-y-3">
          <Textarea
            value={settings.technicianInvalidInsuranceNotificationEmails}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                technicianInvalidInsuranceNotificationEmails: e.target.value,
              }))
            }
            rows={5}
            className="w-full"
          />
          <Button
            onClick={() =>
              handleUpdate("technicianInvalidInsuranceNotificationEmails")
            }
            disabled={
              savingField === "technicianInvalidInsuranceNotificationEmails"
            }
            className="bg-[#1B3A5C] hover:bg-[#152d49]"
          >
            {savingField === "technicianInvalidInsuranceNotificationEmails" ? (
              <InlineLoading />
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* New Support Ticket Alert Recipients */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="shrink-0 md:w-80">
          <h3 className="text-base font-semibold text-gray-900">
            New Support Ticket Alert Recipients
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Add email address, one in each line.
          </p>
        </div>
        <div className="flex-1 max-w-lg space-y-3">
          <Textarea
            value={settings.supportTicketAlertRecipients}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                supportTicketAlertRecipients: e.target.value,
              }))
            }
            rows={5}
            className="w-full"
          />
          <Button
            onClick={() => handleUpdate("supportTicketAlertRecipients")}
            disabled={savingField === "supportTicketAlertRecipients"}
            className="bg-[#1B3A5C] hover:bg-[#152d49]"
          >
            {savingField === "supportTicketAlertRecipients" ? (
              <InlineLoading />
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table-based CRUD (used by Asset Settings internally)
// ---------------------------------------------------------------------------

export function TableCrudSection({
  title,
  endpoint,
  icon: Icon,
}: {
  title: string;
  endpoint: string;
  icon: React.ElementType;
}) {
  const { items, loading, saving, error, setError, addItem, updateItem, deleteItem } =
    useSettingsCrud(endpoint);
  const [newValue, setNewValue] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    const ok = await addItem({ title: newValue.trim() });
    if (ok) setNewValue("");
  };

  const handleUpdate = async () => {
    if (!editId || !editValue.trim()) return;
    const ok = await updateItem(editId, { title: editValue.trim() });
    if (ok) {
      setEditId(null);
      setEditValue("");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {error && (
          <div className="rounded-[10px] bg-red-50 p-3 text-sm text-red-600">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            placeholder={`New ${title.toLowerCase().replace(/s$/, "")} name...`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="max-w-xs"
          />
          <Button onClick={handleAdd} disabled={saving || !newValue.trim()} size="sm">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {loading ? (
          <div className="py-6">
            <InlineLoading className="mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">No items found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditId(item._id);
                          setEditValue(item.title);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete "${item.title}"?`)) deleteItem(item._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {title.replace(/s$/, "")}</DialogTitle>
              <DialogDescription>
                Update the name of this {title.toLowerCase().replace(/s$/, "")}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditId(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={saving || !editValue.trim()}>
                {saving ? <InlineLoading /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared type for populated asset model
// ---------------------------------------------------------------------------

interface MakeModelMapping {
  _id: string;
  assetMakeId: string;
  assetModelId: string;
}

// ---------------------------------------------------------------------------
// Shared hook — fetches makes, models, types, and make-model mappings
// ---------------------------------------------------------------------------

function useAssetData() {
  const [makes, setMakes] = useState<SettingsItem[]>([]);
  const [models, setModels] = useState<SettingsItem[]>([]);
  const [types, setTypes] = useState<SettingsItem[]>([]);
  const [mappings, setMappings] = useState<MakeModelMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [makesRes, modelsRes, typesRes, mappingsRes] = await Promise.all([
        fetch("/api/settings/asset-makes"),
        fetch("/api/settings/asset-models"),
        fetch("/api/settings/asset-types"),
        fetch("/api/settings/asset-make-models"),
      ]);
      const [makesJson, modelsJson, typesJson, mappingsJson] = await Promise.all([
        makesRes.json(),
        modelsRes.json(),
        typesRes.json(),
        mappingsRes.json(),
      ]);
      if (makesJson.success) setMakes(makesJson.data || []);
      else setError(makesJson.error || "Failed to load makes");
      if (modelsJson.success) setModels(modelsJson.data || []);
      else setError(modelsJson.error || "Failed to load models");
      if (typesJson.success) setTypes(typesJson.data || []);
      else setError(typesJson.error || "Failed to load types");
      if (mappingsJson.success) {
        // Normalize mappings — populated refs → plain IDs
        const normalized = (mappingsJson.data || []).map((m: any) => ({
          _id: m._id,
          assetMakeId: typeof m.assetMakeId === "object" ? m.assetMakeId?._id : m.assetMakeId,
          assetModelId: typeof m.assetModelId === "object" ? m.assetModelId?._id : m.assetModelId,
        }));
        setMappings(normalized);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { makes, models, types, mappings, loading, error, setError, fetchAll };
}

// ---------------------------------------------------------------------------
// Asset Makes section — shows makes with linked model badges
// ---------------------------------------------------------------------------

export function AssetMakesSection() {
  const { makes, models, mappings, loading, error, setError, fetchAll } = useAssetData();
  const [saving, setSaving] = useState(false);

  // Make dialog
  const [makeDialogOpen, setMakeDialogOpen] = useState(false);
  const [editMakeId, setEditMakeId] = useState<string | null>(null);
  const [makeTitle, setMakeTitle] = useState("");

  // Add Model dialog — checkboxes to link/unlink models
  const [linkModelsMakeId, setLinkModelsMakeId] = useState<string | null>(null);
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());

  function modelsForMake(makeId: string) {
    const linkedModelIds = mappings
      .filter((m) => m.assetMakeId === makeId)
      .map((m) => m.assetModelId);
    return models.filter((m) => linkedModelIds.includes(m._id));
  }

  function openAddMake() {
    setEditMakeId(null);
    setMakeTitle("");
    setMakeDialogOpen(true);
  }

  function openEditMake(make: SettingsItem) {
    setEditMakeId(make._id);
    setMakeTitle(make.title);
    setMakeDialogOpen(true);
  }

  function openLinkModels(makeId: string) {
    const linkedModelIds = new Set(
      mappings
        .filter((m) => m.assetMakeId === makeId)
        .map((m) => m.assetModelId)
    );
    setSelectedModelIds(linkedModelIds);
    setLinkModelsMakeId(makeId);
  }

  function toggleModel(modelId: string) {
    setSelectedModelIds((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  }

  async function handleSaveMake() {
    if (!makeTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const url = editMakeId
        ? `/api/settings/asset-makes/${editMakeId}`
        : "/api/settings/asset-makes";
      const res = await fetch(url, {
        method: editMakeId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: makeTitle.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to save");
      setMakeDialogOpen(false);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMake(make: SettingsItem) {
    if (!confirm(`Delete "${make.title}"?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/asset-makes/${make._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to delete");
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLinkedModels() {
    if (!linkModelsMakeId) return;
    setSaving(true);
    setError(null);
    try {
      const currentLinked = mappings.filter((m) => m.assetMakeId === linkModelsMakeId);
      const currentLinkedModelIds = new Set(currentLinked.map((m) => m.assetModelId));
      const ops: Promise<Response>[] = [];

      // Create new mappings for newly selected models
      for (const modelId of selectedModelIds) {
        if (!currentLinkedModelIds.has(modelId)) {
          ops.push(
            fetch("/api/settings/asset-make-models", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assetMakeId: linkModelsMakeId, assetModelId: modelId }),
            })
          );
        }
      }

      // Delete mappings for unselected models
      for (const mapping of currentLinked) {
        if (!selectedModelIds.has(mapping.assetModelId)) {
          ops.push(
            fetch(`/api/settings/asset-make-models/${mapping._id}`, { method: "DELETE" })
          );
        }
      }

      await Promise.all(ops);
      setLinkModelsMakeId(null);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-[10px] bg-red-50 p-3 text-sm text-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={openAddMake}>
          <Plus className="h-4 w-4" />
          Add New Make
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <InlineLoading />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#EBF5FF] hover:bg-[#EBF5FF]">
                  <TableHead className="font-semibold text-gray-700">Makes</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {makes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-gray-500">
                      No makes found.
                    </TableCell>
                  </TableRow>
                ) : (
                  makes.map((make) => {
                    const makeModels = modelsForMake(make._id);
                    return (
                      <TableRow key={make._id}>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {make.title}
                            </span>
                            {makeModels.map((model) => (
                              <span
                                key={model._id}
                                className="rounded-full bg-cyan-100 px-4 py-1 text-sm font-medium text-cyan-700"
                              >
                                {model.title}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-nowrap items-center justify-end gap-2">
                            <button
                              onClick={() => openLinkModels(make._id)}
                              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[10px] border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Model
                            </button>
                            <button
                              onClick={() => openEditMake(make)}
                              className="shrink-0 rounded-[10px] border border-gray-200 p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMake(make)}
                              className="shrink-0 rounded-[10px] border border-gray-200 p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Make Dialog */}
      <Dialog open={makeDialogOpen} onOpenChange={setMakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMakeId ? "Edit" : "Add New"} Make</DialogTitle>
            <DialogDescription>
              {editMakeId ? "Update make name." : "Create a new asset make."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Make Name</Label>
            <Input
              value={makeTitle}
              onChange={(e) => setMakeTitle(e.target.value)}
              placeholder="Enter make name..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveMake()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMakeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMake} disabled={saving || !makeTitle.trim()}>
              {saving ? <InlineLoading /> : <Save className="h-4 w-4" />}
              {editMakeId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Models Dialog — checkboxes of all models */}
      <Dialog
        open={!!linkModelsMakeId}
        onOpenChange={(open) => !open && setLinkModelsMakeId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Model</DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="grid grid-cols-2 gap-3 py-4">
            {(() => {
              // Only show models that are unlinked or already linked to THIS make
              const modelsLinkedToOtherMakes = new Set(
                mappings
                  .filter((m) => m.assetMakeId !== linkModelsMakeId)
                  .map((m) => m.assetModelId)
              );
              const availableModels = models.filter(
                (m) => !modelsLinkedToOtherMakes.has(m._id)
              );
              return availableModels.length === 0 ? (
                <p className="col-span-2 text-sm text-gray-500">
                  No models available. Create models in the Models tab first.
                </p>
              ) : (
                availableModels.map((model) => (
                  <label
                    key={model._id}
                    className="flex cursor-pointer items-center gap-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModelIds.has(model._id)}
                      onChange={() => toggleModel(model._id)}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">{model.title}</span>
                  </label>
                ))
              );
            })()}
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleSaveLinkedModels}
              disabled={saving}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {saving ? <InlineLoading /> : "Save Changes"}
            </Button>
            <button
              onClick={() => setLinkModelsMakeId(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset Models section — matches screenshot design
// ---------------------------------------------------------------------------

export function AssetModelsSection() {
  const { makes, models, types, mappings, loading, error, setError, fetchAll } = useAssetData();
  const [saving, setSaving] = useState(false);

  // Add / Edit model dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");

  // Add / Edit type dialog (inline per row)
  const [typeDialogModelId, setTypeDialogModelId] = useState<string | null>(null);
  const [typeDialogValue, setTypeDialogValue] = useState("");

  function getMakeName(model: SettingsItem) {
    const mapping = mappings.find((m) => m.assetModelId === model._id);
    if (!mapping) return null;
    return makes.find((m) => m._id === mapping.assetMakeId)?.title || null;
  }

  function getType(model: SettingsItem) {
    const typeId = (model as any).assetTypeId;
    if (!typeId) return null;
    if (typeof typeId === "object") return { _id: typeId._id, title: typeId.title };
    const found = types.find((t) => t._id === typeId);
    return found ? { _id: found._id, title: found.title } : null;
  }

  function openAddModel() {
    setEditId(null);
    setFormTitle("");
    setDialogOpen(true);
  }

  function openEditModel(model: SettingsItem) {
    setEditId(model._id);
    setFormTitle(model.title);
    setDialogOpen(true);
  }

  async function handleSaveModel() {
    if (!formTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, any> = { title: formTitle.trim() };
      const url = editId
        ? `/api/settings/asset-models/${editId}`
        : "/api/settings/asset-models";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to save");
      setDialogOpen(false);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteModel(model: SettingsItem) {
    if (!confirm(`Delete "${model.title}"?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/asset-models/${model._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to delete");
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openTypeDialog(model: SettingsItem) {
    setTypeDialogModelId(model._id);
    const type = getType(model);
    setTypeDialogValue(type?._id || "");
  }

  async function handleSaveType() {
    if (!typeDialogModelId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/asset-models/${typeDialogModelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetTypeId: typeDialogValue || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to update");
      setTypeDialogModelId(null);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-[10px] bg-red-50 p-3 text-sm text-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={openAddModel}>
          <Plus className="h-4 w-4" />
          Add New Model
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <InlineLoading />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#EBF5FF] hover:bg-[#EBF5FF]">
                  <TableHead className="font-semibold text-gray-700">Models</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-gray-500">
                      No models found.
                    </TableCell>
                  </TableRow>
                ) : (
                  models.map((model) => {
                    const makeName = getMakeName(model);
                    const type = getType(model);
                    return (
                      <TableRow key={model._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">
                              {model.title}
                            </span>
                            {makeName && (
                              <span className="rounded-[10px] bg-gray-100 px-3 py-1 text-sm text-gray-500">
                                {makeName}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-nowrap items-center justify-end gap-2">
                            {type ? (
                              <>
                                <span className="shrink-0 whitespace-nowrap rounded-full bg-cyan-500 px-4 py-1 text-sm font-medium text-white">
                                  {type.title}
                                </span>
                                <button
                                  onClick={() => openTypeDialog(model)}
                                  className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[10px] border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit Type
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => openTypeDialog(model)}
                                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[10px] border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Type
                              </button>
                            )}
                            <button
                              onClick={() => openEditModel(model)}
                              className="shrink-0 rounded-[10px] border border-gray-200 p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(model)}
                              className="shrink-0 rounded-[10px] border border-gray-200 p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Model Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Add"} Model</DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-6 py-2">
            <Label className="shrink-0 text-sm text-gray-700">Model</Label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder=""
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveModel()}
            />
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleSaveModel}
              disabled={saving || !formTitle.trim()}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {saving ? <InlineLoading /> : editId ? "Update Model" : "Add Model"}
            </Button>
            <button
              onClick={() => setDialogOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Type Dialog — matches screenshot */}
      <Dialog
        open={!!typeDialogModelId}
        onOpenChange={(open) => !open && setTypeDialogModelId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{typeDialogValue ? "Edit" : "Add"} Type</DialogTitle>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-6 py-2">
            <Label className="shrink-0 text-sm text-gray-700">Select Type</Label>
            <Select value={typeDialogValue} onValueChange={setTypeDialogValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={handleSaveType}
              disabled={saving}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {saving ? <InlineLoading /> : typeDialogValue ? "Update" : "Add"}
            </Button>
            <button
              onClick={() => setTypeDialogModelId(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset Settings (combines Makes, Models, Types in tabs)
// ---------------------------------------------------------------------------

export function AssetSettingsSection() {
  return (
    <Tabs defaultValue="asset-makes">
      <TabsList>
        <TabsTrigger value="asset-makes">Makes</TabsTrigger>
        <TabsTrigger value="asset-models">Models</TabsTrigger>
        <TabsTrigger value="asset-types">Types</TabsTrigger>
      </TabsList>
      <TabsContent value="asset-makes" className="mt-4">
        <AssetMakesSection />
      </TabsContent>
      <TabsContent value="asset-models" className="mt-4">
        <AssetModelsSection />
      </TabsContent>
      <TabsContent value="asset-types" className="mt-4">
        <SettingsListSection
          entityName="Type"
          endpoint="/api/settings/asset-types"
        />
      </TabsContent>
    </Tabs>
  );
}
