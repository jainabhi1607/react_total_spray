"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Tag,
  Layers,
  Wrench,
  Settings2,
  ClipboardList,
  Cog,
  UserCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { PageLoading, InlineLoading } from "@/components/ui/loading";
import { isSuperAdmin } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SettingsItem {
  _id: string;
  title: string;
  [key: string]: any;
}

interface AssetModel extends SettingsItem {
  assetTypeId:
    | string
    | { _id: string; title: string };
}

interface GlobalSettings {
  _id?: string;
  postmarkApikey?: string;
  signupEmailSubject?: string;
  signupEmailContent?: string;
  passwordRecoveryEmailSubject?: string;
  passwordRecoveryEmailContent?: string;
  awsBucket?: string;
  awsAccountId?: string;
  awsAccessKeyId?: string;
  awsAccessKeySecret?: string;
  supportTicketAlertEmails?: string;
  technicianInsuranceNotificationEmails?: string;
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
// Badge-based list (Tags / Titles)
// ---------------------------------------------------------------------------

function BadgeListSection({
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-gray-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Add form */}
        <div className="flex items-center gap-2">
          <Input
            placeholder={`Add new ${title.toLowerCase().replace(/s$/, "")}...`}
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

        {/* Items */}
        {loading ? (
          <div className="py-6">
            <InlineLoading className="mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">No items found.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge
                key={item._id}
                variant="secondary"
                className="gap-1.5 py-1.5 pl-3 pr-1.5 text-sm"
              >
                {item.title}
                <button
                  onClick={() => {
                    setEditId(item._id);
                    setEditValue(item.title);
                  }}
                  className="rounded p-0.5 hover:bg-gray-200"
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${item.title}"?`)) deleteItem(item._id);
                  }}
                  className="rounded p-0.5 hover:bg-red-100 hover:text-red-600"
                  title="Delete"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Edit dialog */}
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
// Table-based CRUD (Asset Makes, Types, Job Card Types)
// ---------------------------------------------------------------------------

function TableCrudSection({
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-gray-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Add form */}
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

        {/* Edit dialog */}
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

function AssetModelsSection() {
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5 text-gray-500" />
          Asset Models
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Add form */}
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
          <Button onClick={handleAdd} disabled={saving || !newTitle.trim() || !newAssetTypeId} size="sm">
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

        {/* Edit dialog */}
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
// Global Settings section (Super Admin only)
// ---------------------------------------------------------------------------

function GlobalSettingsSection() {
  const [settings, setSettings] = useState<GlobalSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings/global");
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to load");
        setSettings(json.data || {});
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field: string, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/settings/global", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to save");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <InlineLoading className="mx-auto" />
      </div>
    );
  }

  const fieldGroup = (
    label: string,
    fields: { key: string; label: string; type?: "input" | "textarea" }[]
  ) => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">{label}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <Label className="mb-1.5 block text-sm">{f.label}</Label>
            {f.type === "textarea" ? (
              <Textarea
                value={(settings as any)[f.key] || ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
                rows={4}
              />
            ) : (
              <Input
                value={(settings as any)[f.key] || ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cog className="h-5 w-5 text-gray-500" />
          Global Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="rounded-xl bg-green-50 p-3 text-sm text-green-600">
            Settings saved successfully.
          </div>
        )}

        {fieldGroup("Email Settings", [
          { key: "postmarkApikey", label: "Postmark API Key" },
          { key: "signupEmailSubject", label: "Signup Email Subject" },
          { key: "signupEmailContent", label: "Signup Email Content", type: "textarea" },
          { key: "passwordRecoveryEmailSubject", label: "Password Recovery Email Subject" },
          {
            key: "passwordRecoveryEmailContent",
            label: "Password Recovery Email Content",
            type: "textarea",
          },
        ])}

        <hr className="border-gray-100" />

        {fieldGroup("AWS Settings", [
          { key: "awsBucket", label: "S3 Bucket" },
          { key: "awsAccountId", label: "Account ID" },
          { key: "awsAccessKeyId", label: "Access Key ID" },
          { key: "awsAccessKeySecret", label: "Access Key Secret" },
        ])}

        <hr className="border-gray-100" />

        {fieldGroup("Alert Recipients", [
          {
            key: "supportTicketAlertEmails",
            label: "Support Ticket Alert Emails",
            type: "textarea",
          },
          {
            key: "technicianInsuranceNotificationEmails",
            label: "Technician Insurance Notification Emails",
            type: "textarea",
          },
        ])}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <InlineLoading /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main settings page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const userRole = (session?.user as any)?.role ?? 0;

  if (status === "loading") {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage tags, titles, asset configuration, and system settings.
        </p>
      </div>

      <Tabs defaultValue="tags">
        <TabsList className="flex-wrap">
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="titles">Titles</TabsTrigger>
          <TabsTrigger value="asset-makes">Asset Makes</TabsTrigger>
          <TabsTrigger value="asset-models">Asset Models</TabsTrigger>
          <TabsTrigger value="asset-types">Asset Types</TabsTrigger>
          <TabsTrigger value="job-card-types">Job Card Types</TabsTrigger>
          {isSuperAdmin(userRole) && (
            <TabsTrigger value="global">Global Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tags" className="mt-4">
          <BadgeListSection title="Tags" endpoint="/api/settings/tags" icon={Tag} />
        </TabsContent>

        <TabsContent value="titles" className="mt-4">
          <BadgeListSection title="Titles" endpoint="/api/settings/titles" icon={UserCircle} />
        </TabsContent>

        <TabsContent value="asset-makes" className="mt-4">
          <TableCrudSection
            title="Asset Makes"
            endpoint="/api/settings/asset-makes"
            icon={Wrench}
          />
        </TabsContent>

        <TabsContent value="asset-models" className="mt-4">
          <AssetModelsSection />
        </TabsContent>

        <TabsContent value="asset-types" className="mt-4">
          <TableCrudSection
            title="Asset Types"
            endpoint="/api/settings/asset-types"
            icon={Settings2}
          />
        </TabsContent>

        <TabsContent value="job-card-types" className="mt-4">
          <TableCrudSection
            title="Job Card Types"
            endpoint="/api/settings/job-card-types"
            icon={ClipboardList}
          />
        </TabsContent>

        {isSuperAdmin(userRole) && (
          <TabsContent value="global" className="mt-4">
            <GlobalSettingsSection />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
