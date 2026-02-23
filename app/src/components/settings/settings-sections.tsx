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

interface AssetModel extends SettingsItem {
  assetTypeId: string | { _id: string; title: string };
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
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to load");
      setItems(json.data || []);
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
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to add");
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
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update");
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
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete");
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
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
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
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to load");
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
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to save");
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
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
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
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
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
// Asset Models section (with asset type select)
// ---------------------------------------------------------------------------

export function AssetModelsSection() {
  const { items, loading, saving, error, setError, addItem, updateItem, deleteItem } =
    useSettingsCrud("/api/settings/asset-models");
  const [assetTypes, setAssetTypes] = useState<SettingsItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newAssetTypeId, setNewAssetTypeId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAssetTypeId, setEditAssetTypeId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings/asset-types");
        const json = await res.json();
        if (json.success) setAssetTypes(json.data || []);
      } catch {}
    })();
  }, []);

  const handleAdd = async () => {
    if (!newTitle.trim() || !newAssetTypeId) return;
    const ok = await addItem({ title: newTitle.trim(), assetTypeId: newAssetTypeId });
    if (ok) {
      setNewTitle("");
      setNewAssetTypeId("");
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editTitle.trim()) return;
    const body: Record<string, string> = { title: editTitle.trim() };
    if (editAssetTypeId) body.assetTypeId = editAssetTypeId;
    const ok = await updateItem(editId, body);
    if (ok) {
      setEditId(null);
      setEditTitle("");
      setEditAssetTypeId("");
    }
  };

  const models = items as AssetModel[];

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Model Name</Label>
            <Input
              placeholder="Model name..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-48"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Asset Type</Label>
            <Select value={newAssetTypeId} onValueChange={setNewAssetTypeId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAdd}
            disabled={saving || !newTitle.trim() || !newAssetTypeId}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {loading ? (
          <div className="py-6">
            <InlineLoading className="mx-auto" />
          </div>
        ) : models.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">No asset models found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Asset Type</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((item) => {
                const typeName =
                  typeof item.assetTypeId === "object"
                    ? item.assetTypeId?.title
                    : assetTypes.find((t) => t._id === item.assetTypeId)?.title || "-";
                return (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{typeName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditId(item._id);
                            setEditTitle(item.title);
                            setEditAssetTypeId(
                              typeof item.assetTypeId === "object"
                                ? item.assetTypeId?._id || ""
                                : item.assetTypeId || ""
                            );
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
                );
              })}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Asset Model</DialogTitle>
              <DialogDescription>Update the asset model details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={editAssetTypeId} onValueChange={setEditAssetTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditId(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={saving || !editTitle.trim()}>
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
// Asset Settings (combines Makes, Types, Models in tabs)
// ---------------------------------------------------------------------------

export function AssetSettingsSection() {
  return (
    <Tabs defaultValue="asset-makes">
      <TabsList>
        <TabsTrigger value="asset-makes">Asset Makes</TabsTrigger>
        <TabsTrigger value="asset-types">Asset Types</TabsTrigger>
        <TabsTrigger value="asset-models">Asset Models</TabsTrigger>
      </TabsList>
      <TabsContent value="asset-makes" className="mt-4">
        <TableCrudSection
          title="Asset Makes"
          endpoint="/api/settings/asset-makes"
          icon={Wrench}
        />
      </TabsContent>
      <TabsContent value="asset-types" className="mt-4">
        <TableCrudSection
          title="Asset Types"
          endpoint="/api/settings/asset-types"
          icon={Settings2}
        />
      </TabsContent>
      <TabsContent value="asset-models" className="mt-4">
        <AssetModelsSection />
      </TabsContent>
    </Tabs>
  );
}
