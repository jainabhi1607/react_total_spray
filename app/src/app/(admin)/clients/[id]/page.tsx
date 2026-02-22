"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Building2,
  MapPin,
  FileText,
  Users,
  StickyNote,
  Wrench,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoading } from "@/components/ui/loading";
import { formatDate } from "@/lib/utils";

// ─── Type definitions ───────────────────────────────────────────────────────

interface Client {
  _id: string;
  companyName: string;
  companyLogo?: string;
  address?: string;
  abn?: string;
  singleSite?: number;
  status: number;
  createdAt?: string;
  clientDetail?: {
    _id: string;
    about?: string;
  };
}

interface Site {
  _id: string;
  siteName: string;
  address?: string;
  siteId?: string;
  status: number;
  createdAt?: string;
}

interface Asset {
  _id: string;
  machineName: string;
  serialNo?: string;
  clientSiteId?: string;
  status: number;
  createdAt?: string;
}

interface Contact {
  _id: string;
  name: string;
  lastName?: string;
  position?: string;
  email?: string;
  phone?: string;
  clientSiteId?: string;
  createdAt?: string;
}

interface Note {
  _id: string;
  notes: string;
  noteType?: number;
  userId?: { _id: string; name: string; email: string };
  dateTime?: string;
  createdAt?: string;
}

interface ClientDocument {
  _id: string;
  documentName?: string;
  fileName?: string;
  fileSize?: string;
  dateTime?: string;
  createdAt?: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // ─── Fetch client ───────────────────────────────────────────────────────

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load client");
      setClient(json.data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [clientId]);

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/sites`);
      const json = await res.json();
      if (json.success) setSites(json.data);
    } catch {}
  }, [clientId]);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/assets`);
      const json = await res.json();
      if (json.success) setAssets(json.data);
    } catch {}
  }, [clientId]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/contacts`);
      const json = await res.json();
      if (json.success) setContacts(json.data);
    } catch {}
  }, [clientId]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`);
      const json = await res.json();
      if (json.success) setNotes(json.data);
    } catch {}
  }, [clientId]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/documents`);
      const json = await res.json();
      if (json.success) setDocuments(json.data);
    } catch {}
  }, [clientId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchClient();
      setLoading(false);
    };
    load();
  }, [fetchClient]);

  // Fetch tab data when switching tabs
  useEffect(() => {
    if (activeTab === "sites") fetchSites();
    if (activeTab === "assets") fetchAssets();
    if (activeTab === "contacts") fetchContacts();
    if (activeTab === "notes") fetchNotes();
    if (activeTab === "documents") fetchDocuments();
  }, [activeTab, fetchSites, fetchAssets, fetchContacts, fetchNotes, fetchDocuments]);

  if (loading) return <PageLoading />;

  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Client Not Found</h1>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error || "The requested client could not be found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {client.companyName}
              </h1>
              <Badge variant={client.status === 1 ? "success" : "destructive"}>
                {client.status === 1 ? "Active" : "Inactive"}
              </Badge>
            </div>
            {client.abn && (
              <p className="text-sm text-gray-500 mt-1">ABN: {client.abn}</p>
            )}
          </div>
        </div>
        <Link href={`/clients/${clientId}/edit`}>
          <Button variant="outline">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ──────────────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Company Name</p>
                  <p className="mt-1 text-gray-900">{client.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ABN</p>
                  <p className="mt-1 text-gray-900">{client.abn || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1 text-gray-900">{client.address || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Single Site</p>
                  <p className="mt-1 text-gray-900">
                    {client.singleSite === 1 ? "Yes" : "No"}
                  </p>
                </div>
                {client.createdAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="mt-1 text-gray-900">
                      {formatDate(client.createdAt)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {client.clientDetail?.about || "No information available."}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Sites Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="sites">
          <SitesTab clientId={clientId} sites={sites} onRefresh={fetchSites} />
        </TabsContent>

        {/* ── Assets Tab ────────────────────────────────────────────────── */}
        <TabsContent value="assets">
          <AssetsTab
            clientId={clientId}
            assets={assets}
            sites={sites}
            onRefresh={fetchAssets}
          />
        </TabsContent>

        {/* ── Contacts Tab ──────────────────────────────────────────────── */}
        <TabsContent value="contacts">
          <ContactsTab
            clientId={clientId}
            contacts={contacts}
            sites={sites}
            onRefresh={fetchContacts}
          />
        </TabsContent>

        {/* ── Notes Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="notes">
          <NotesTab clientId={clientId} notes={notes} onRefresh={fetchNotes} />
        </TabsContent>

        {/* ── Documents Tab ─────────────────────────────────────────────── */}
        <TabsContent value="documents">
          <DocumentsTab documents={documents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sites Tab
// ═══════════════════════════════════════════════════════════════════════════

function SitesTab({
  clientId,
  sites,
  onRefresh,
}: {
  clientId: string;
  sites: Site[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ siteName: "", address: "", siteId: "" });

  const resetForm = () => {
    setForm({ siteName: "", address: "", siteId: "" });
    setEditingSite(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (site: Site) => {
    setEditingSite(site);
    setForm({
      siteName: site.siteName,
      address: site.address || "",
      siteId: site.siteId || "",
    });
    setError("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.siteName.trim()) {
      setError("Site name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const url = editingSite
        ? `/api/clients/${clientId}/sites/${editingSite._id}`
        : `/api/clients/${clientId}/sites`;

      const res = await fetch(url, {
        method: editingSite ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: form.siteName.trim(),
          address: form.address.trim(),
          siteId: form.siteId.trim(),
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save site");

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm("Are you sure you want to delete this site?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/sites/${siteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete site");
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-gray-500" />
            Sites
          </CardTitle>
          <CardDescription>{sites.length} site(s)</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSite ? "Edit Site" : "Add Site"}</DialogTitle>
              <DialogDescription>
                {editingSite
                  ? "Update the site details below."
                  : "Enter the details for the new site."}
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">
                  Site Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="siteName"
                  placeholder="Enter site name"
                  value={form.siteName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, siteName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteAddress">Address</Label>
                <Input
                  id="siteAddress"
                  placeholder="Enter address"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteCode">Site ID / Code</Label>
                <Input
                  id="siteCode"
                  placeholder="Enter site ID"
                  value={form.siteId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, siteId: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingSite ? "Update" : "Add"} Site
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Site ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No sites found
                </TableCell>
              </TableRow>
            ) : (
              sites.map((site) => (
                <TableRow key={site._id}>
                  <TableCell className="font-medium">{site.siteName}</TableCell>
                  <TableCell>{site.address || "-"}</TableCell>
                  <TableCell>{site.siteId || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={site.status === 1 ? "success" : "destructive"}>
                      {site.status === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(site)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(site._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Assets Tab
// ═══════════════════════════════════════════════════════════════════════════

function AssetsTab({
  clientId,
  assets,
  sites,
  onRefresh,
}: {
  clientId: string;
  assets: Asset[];
  sites: Site[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    machineName: "",
    serialNo: "",
    clientSiteId: "",
  });

  const resetForm = () => {
    setForm({ machineName: "", serialNo: "", clientSiteId: "" });
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.machineName.trim()) {
      setError("Machine name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`/api/clients/${clientId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineName: form.machineName.trim(),
          serialNo: form.serialNo.trim(),
          clientSiteId: form.clientSiteId || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to add asset");

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/assets/${assetId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete asset");
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getSiteName = (siteId?: string) => {
    if (!siteId) return "-";
    const site = sites.find((s) => s._id === siteId);
    return site?.siteName || "-";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5 text-gray-500" />
            Assets
          </CardTitle>
          <CardDescription>{assets.length} asset(s)</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Asset</DialogTitle>
              <DialogDescription>
                Enter the details for the new asset.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="machineName">
                  Machine Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="machineName"
                  placeholder="Enter machine name"
                  value={form.machineName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, machineName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNo">Serial Number</Label>
                <Input
                  id="serialNo"
                  placeholder="Enter serial number"
                  value={form.serialNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, serialNo: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetSite">Site</Label>
                <select
                  id="assetSite"
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  value={form.clientSiteId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientSiteId: e.target.value }))
                  }
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site._id} value={site._id}>
                      {site.siteName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Asset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Machine Name</TableHead>
              <TableHead>Serial No</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No assets found
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset._id}>
                  <TableCell className="font-medium">
                    {asset.machineName}
                  </TableCell>
                  <TableCell>{asset.serialNo || "-"}</TableCell>
                  <TableCell>{getSiteName(asset.clientSiteId)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={asset.status === 1 ? "success" : "destructive"}
                    >
                      {asset.status === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(asset._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Contacts Tab
// ═══════════════════════════════════════════════════════════════════════════

function ContactsTab({
  clientId,
  contacts,
  sites,
  onRefresh,
}: {
  clientId: string;
  contacts: Contact[];
  sites: Site[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    clientSiteId: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      clientSiteId: "",
    });
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Contact name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`/api/clients/${clientId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          position: form.position.trim(),
          clientSiteId: form.clientSiteId || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to add contact");

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      const res = await fetch(
        `/api/clients/${clientId}/contacts/${contactId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.success)
        throw new Error(json.error || "Failed to delete contact");
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getSiteName = (siteId?: string) => {
    if (!siteId) return "-";
    const site = sites.find((s) => s._id === siteId);
    return site?.siteName || "-";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-gray-500" />
            Contacts
          </CardTitle>
          <CardDescription>{contacts.length} contact(s)</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
              <DialogDescription>
                Enter the details for the new contact.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    placeholder="First name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactLastName">Last Name</Label>
                  <Input
                    id="contactLastName"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPosition">Position</Label>
                <Input
                  id="contactPosition"
                  placeholder="Job title / position"
                  value={form.position}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, position: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactSite">Site</Label>
                <select
                  id="contactSite"
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  value={form.clientSiteId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientSiteId: e.target.value }))
                  }
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site._id} value={site._id}>
                      {site.siteName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Contact
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Site</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact._id}>
                  <TableCell className="font-medium">
                    {contact.name}
                    {contact.lastName ? ` ${contact.lastName}` : ""}
                  </TableCell>
                  <TableCell>{contact.email || "-"}</TableCell>
                  <TableCell>{contact.phone || "-"}</TableCell>
                  <TableCell>{contact.position || "-"}</TableCell>
                  <TableCell>{getSiteName(contact.clientSiteId)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contact._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Notes Tab
// ═══════════════════════════════════════════════════════════════════════════

function NotesTab({
  clientId,
  notes,
  onRefresh,
}: {
  clientId: string;
  notes: Note[];
  onRefresh: () => void;
}) {
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText.trim() }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to add note");

      setNoteText("");
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="h-5 w-5 text-gray-500" />
            Add Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Write a note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
            <Button type="submit" size="sm" disabled={submitting || !noteText.trim()}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Adding..." : "Add Note"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notes List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
          <CardDescription>{notes.length} note(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No notes yet</p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note._id}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {note.notes}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">
                      {note.userId?.name || "Unknown User"}
                    </span>
                    <span>&middot;</span>
                    <span>
                      {note.dateTime
                        ? formatDate(note.dateTime)
                        : note.createdAt
                        ? formatDate(note.createdAt)
                        : "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Documents Tab
// ═══════════════════════════════════════════════════════════════════════════

function DocumentsTab({ documents }: { documents: ClientDocument[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-gray-500" />
            Documents
          </CardTitle>
          <CardDescription>{documents.length} document(s)</CardDescription>
        </div>
        <Button size="sm" variant="outline" disabled>
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>File Size</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell className="font-medium">
                    {doc.documentName || doc.fileName || "Untitled"}
                  </TableCell>
                  <TableCell>{doc.fileSize || "-"}</TableCell>
                  <TableCell>
                    {doc.dateTime
                      ? formatDate(doc.dateTime)
                      : doc.createdAt
                      ? formatDate(doc.createdAt)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
