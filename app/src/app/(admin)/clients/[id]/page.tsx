"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  FileText,
  Wrench,
  Upload,
  Loader2,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  User,
  X,
} from "lucide-react";
import { AddClientDialog } from "@/components/dialogs/add-client-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PageLoading } from "@/components/ui/loading";
import { formatDate, formatDateTime } from "@/lib/utils";

// ─── Type definitions ───────────────────────────────────────────────────────

interface Client {
  _id: string;
  companyName: string;
  companyLogo?: string;
  address?: string;
  abn?: string;
  singleSite?: number;
  status: number;
  accessToken?: string;
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
  assetTypeId?: string;
  assetMakeId?: string | { _id: string; title: string };
  assetModelId?: string | { _id: string; title: string };
  status: number;
  createdAt?: string;
}

interface AssetTypeOption {
  _id: string;
  title: string;
}

interface AssetMakeOption {
  _id: string;
  title: string;
}

interface AssetModelOption {
  _id: string;
  title: string;
  assetTypeId?: string;
}

interface AssetMakeModelMapping {
  _id: string;
  assetMakeId: string;
  assetModelId: string;
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

interface SupportTicket {
  _id: string;
  titleId?: { _id: string; title: string } | null;
  ticketStatus: number;
}

interface ServiceAgreement {
  _id: string;
  title: string;
  agreementNumber?: string;
  serviceType?: string;
  frequency?: number;
  startDate?: string;
  endDate?: string;
  status: number;
  coveredSiteIds?: string[];
  contractValue?: number;
  billingFrequency?: string;
  notes?: string;
  document?: string;
  createdAt?: string;
}

const FREQUENCY_LABELS: Record<number, string> = {
  1: "Monthly",
  2: "Quarterly",
  3: "Annually",
};

const SERVICE_TYPES = [
  "Pest Control",
  "Termite Protection",
  "Hygiene Services",
  "Bird Control",
  "Vegetation Management",
  "Other",
];

// ─── Tab Definitions ────────────────────────────────────────────────────────

const TABS = [
  { label: "Overview", value: "overview" },
  { label: "Service Agreements", value: "service-agreements" },
  { label: "Work History", value: "work-history" },
  { label: "Sites", value: "sites" },
  { label: "Contacts", value: "contacts" },
  { label: "Assets", value: "assets" },
  { label: "Portal Users", value: "portal-users" },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  useEffect(() => { document.title = "TSC - Client Details"; }, []);
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [serviceAgreements, setServiceAgreements] = useState<ServiceAgreement[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // About section edit state
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState("");
  const [savingAbout, setSavingAbout] = useState(false);

  // Notes inline state
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);
  const [selectedNoteType, setSelectedNoteType] = useState<number>(3); // default: message
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  // Document upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Image lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ─── Fetch functions ──────────────────────────────────────────────────

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

  const fetchSupportTickets = useCallback(async () => {
    try {
      const res = await fetch(`/api/support-tickets?clientId=${clientId}&limit=1000`);
      const json = await res.json();
      if (json.success) {
        const data = json.data?.data || json.data || [];
        setSupportTickets(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, [clientId]);

  const fetchServiceAgreements = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/service-agreements`);
      const json = await res.json();
      if (json.success) setServiceAgreements(json.data);
    } catch {}
  }, [clientId]);

  // Load all data upfront for stat cards + overview
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchClient();
      setLoading(false);
    };
    load();
  }, [fetchClient]);

  useEffect(() => {
    if (!loading && client) {
      fetchSites();
      fetchAssets();
      fetchContacts();
      fetchNotes();
      fetchDocuments();
      fetchSupportTickets();
      fetchServiceAgreements();
    }
  }, [loading, client, fetchSites, fetchAssets, fetchContacts, fetchNotes, fetchDocuments, fetchSupportTickets, fetchServiceAgreements]);

  // ─── About section handlers ───────────────────────────────────────────

  const handleEditAbout = () => {
    setAboutText(client?.clientDetail?.about || "");
    setEditingAbout(true);
  };

  const handleSaveAbout = async () => {
    try {
      setSavingAbout(true);
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ about: aboutText }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.message || "Failed to save");
      setEditingAbout(false);
      fetchClient();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAbout(false);
    }
  };

  // ─── Notes handler ────────────────────────────────────────────────────

  const NOTE_TYPES = [
    { value: 1, icon: "/phone.svg", label: "Phone" },
    { value: 2, icon: "/mail.svg", label: "Email" },
    { value: 3, icon: "/message-circle.svg", label: "Message" },
    { value: 4, icon: "/users.svg", label: "Meeting" },
    { value: 5, icon: "/file_text.svg", label: "Document" },
  ];

  const getNoteTypeIcon = (noteType?: number) => {
    const found = NOTE_TYPES.find((t) => t.value === noteType);
    return found ? found.icon : "/message-circle.svg";
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      setSubmittingNote(true);
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText.trim(), noteType: selectedNoteType }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.message || "Failed to add note");
      setNoteText("");
      setNoteFocused(false);
      setSelectedNoteType(3);
      fetchNotes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editNoteText.trim()) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editNoteText.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.message || "Failed to update note");
      setEditingNoteId(null);
      setEditNoteText("");
      fetchNotes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/notes/${noteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.message || "Failed to delete note");
      fetchNotes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ─── Document upload handler ──────────────────────────────────────────

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleUploadDocuments = async () => {
    if (pendingFiles.length === 0) return;

    try {
      setUploading(true);

      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "documents");

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadJson = await uploadRes.json();
        if (!uploadJson.success) throw new Error(uploadJson.error || "Upload failed");

        const docRes = await fetch(`/api/clients/${clientId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentName: file.name,
            fileName: uploadJson.data?.fileName || uploadJson.data?.filename,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          }),
        });
        const docJson = await docRes.json();
        if (!docJson.success) throw new Error(docJson.error || "Failed to save document");
      }

      setPendingFiles([]);
      setUploadDialogOpen(false);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/documents/${docId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete document");
      fetchDocuments();
    } catch (err: any) {
      alert(err.message);
    }
  };


  // ─── Support Ticket URL handlers ─────────────────────────────────────

  const handleCopyUrl = () => {
    if (!client?.accessToken) return;
    const url = `${window.location.origin}/support/${client.accessToken}`;
    navigator.clipboard.writeText(url);
  };

  const handleActivateUrl = async () => {
    if (!confirm("Are you sure you want to activate the Support Ticket URL?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activateAccessToken: true }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.message || "Failed to activate");
      fetchClient();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeactivateUrl = async () => {
    if (!confirm("Are you sure you want to deactivate the Support Ticket URL?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deactivateAccessToken: true }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || json.message || "Failed to deactivate");
      fetchClient();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ─── Support tickets grouped by title ─────────────────────────────────

  const ticketsByTitle = supportTickets.reduce<Record<string, { title: string; count: number }>>((acc, t) => {
    const key = t.titleId?._id || "uncategorized";
    const title = t.titleId?.title || "Uncategorized";
    if (!acc[key]) acc[key] = { title, count: 0 };
    acc[key].count++;
    return acc;
  }, {});

  // ─── Render ───────────────────────────────────────────────────────────

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
        <div className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error || "The requested client could not be found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{client.companyName}</h1>
        </div>
        {sites.length > 0 && (
          <div className="relative">
            <select
              className="appearance-none rounded-[10px] border border-gray-200 bg-white px-4 py-2 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select Site</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>{s.siteName}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        )}
      </div>

      {/* Edit Client Dialog */}
      <AddClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={client}
        onSuccess={() => fetchClient()}
      />

      {/* Underline-Style Tabs */}
      <div className="border-b border-gray-200 mt-4">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`whitespace-nowrap border-b-2 text-sm font-normal cursor-pointer transition-colors ${
                activeTab === tab.value
                  ? "border-[#00AEEF] text-[#00AEEF]"
                  : "border-transparent text-gray-900 hover:border-gray-300"
              }`}
              style={{ lineHeight: "30px", paddingLeft: 25, paddingRight: 25, fontSize: 14 }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Support Tickets - dark card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center justify-between p-5" style={{ height: 98 }}>
              <p className="text-sm font-medium text-slate-300">Support Tickets</p>
              <p className="text-3xl font-bold" style={{ color: "#00AEEF" }}>
                {supportTickets.length}
              </p>
            </CardContent>
          </Card>
          {/* Assets */}
          <Card className="bg-white">
            <CardContent className="flex items-center justify-between p-5" style={{ height: 98 }}>
              <p className="text-sm font-medium text-gray-500">Assets</p>
              <p className="text-3xl font-bold" style={{ color: "#f7cd4b" }}>
                {assets.length}
              </p>
            </CardContent>
          </Card>
          {/* Sites */}
          <Card className="bg-white">
            <CardContent className="flex items-center justify-between p-5" style={{ height: 98 }}>
              <p className="text-sm font-medium text-gray-500">Sites</p>
              <p className="text-3xl font-bold" style={{ color: "#E18230" }}>
                {sites.length}
              </p>
            </CardContent>
          </Card>
          {/* Contacts */}
          <Card className="bg-white">
            <CardContent className="flex items-center justify-between p-5" style={{ height: 98 }}>
              <p className="text-sm font-medium text-gray-500">Contacts</p>
              <p className="text-3xl font-bold" style={{ color: "#82cd66" }}>
                {contacts.length}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-12">
          {/* Left Column */}
          <div className="md:col-span-7 space-y-6">
            {/* Client Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Client Information</CardTitle>
                <button
                  onClick={() => setEditDialogOpen(true)}
                  className="rounded-[10px] p-1.5 text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  <div className="flex items-center px-6 py-3">
                    <span className="w-40 text-sm font-medium text-gray-500 shrink-0">Date Created</span>
                    <span className="text-sm text-gray-900">{client.createdAt ? formatDate(client.createdAt) : "-"}</span>
                  </div>
                  <div className="flex items-center px-6 py-3">
                    <span className="w-40 text-sm font-medium text-gray-500 shrink-0">Company</span>
                    <span className="text-sm text-gray-900">{client.companyName}</span>
                  </div>
                  <div className="flex items-center px-6 py-3">
                    <span className="w-40 text-sm font-medium text-gray-500 shrink-0">Address</span>
                    <span className="text-sm text-gray-900">{client.address || "-"}</span>
                  </div>
                  <div className="flex items-center px-6 py-3">
                    <span className="w-40 text-sm font-medium text-gray-500 shrink-0">ABN</span>
                    <span className="text-sm text-gray-900">{client.abn || "-"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">About</CardTitle>
                <button
                  onClick={handleEditAbout}
                  className="rounded-[10px] p-1.5 text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {client.clientDetail?.about || "No information available."}
                </p>
              </CardContent>
            </Card>

            {/* About Edit Dialog */}
            <Dialog open={editingAbout} onOpenChange={setEditingAbout}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit About</DialogTitle>
                  <DialogDescription>Update the about information for this client.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    rows={6}
                    placeholder="Enter information about this client..."
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingAbout(false)} disabled={savingAbout}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAbout} disabled={savingAbout}>
                    {savingAbout && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Attachments Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Attachments</CardTitle>
                <button
                  onClick={() => { setPendingFiles([]); setUploadDialogOpen(true); }}
                  className="rounded-[10px] border border-gray-200 p-1.5 text-gray-500 cursor-pointer hover:bg-gray-50 hover:text-gray-700"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-6">No attachments yet</p>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {documents.map((doc) => {
                      const name = doc.fileName || doc.documentName || "";
                      const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name);
                      return (
                        <div key={doc._id} className="w-40 rounded-[10px] border border-gray-200 bg-white p-3">
                          {/* Action icons */}
                          <div className="flex items-center gap-2.5 mb-2">
                            <a
                              href={`/uploads/documents/${doc.fileName}`}
                              download={doc.documentName || doc.fileName}
                              className="rounded p-0.5 text-gray-400 cursor-pointer hover:text-gray-600"
                              title="Download"
                            >
                              <Download className="h-5 w-5" strokeWidth={1.5} />
                            </a>
                            <button
                              onClick={() => handleDeleteDocument(doc._id)}
                              className="rounded p-0.5 cursor-pointer hover:opacity-70"
                              title="Delete"
                            >
                              <img src="/trash.svg" alt="Delete" className="h-5 w-5" />
                            </button>
                          </div>
                          {/* Thumbnail */}
                          {isImage ? (
                            <img
                              src={`/uploads/documents/${doc.fileName}`}
                              alt={doc.documentName || "Attachment"}
                              className="h-32 w-full rounded border border-gray-100 object-contain bg-gray-50 cursor-pointer"
                              onClick={() => {
                                const imageDocuments = documents.filter((d) => {
                                  const n = d.fileName || d.documentName || "";
                                  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(n);
                                });
                                const idx = imageDocuments.findIndex((d) => d._id === doc._id);
                                setLightboxIndex(idx >= 0 ? idx : 0);
                                setLightboxOpen(true);
                              }}
                            />
                          ) : (
                            <div className="flex h-32 w-full items-center justify-center rounded border border-gray-100 bg-gray-50">
                              <FileText className="h-10 w-10 text-gray-300" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image Lightbox */}
            {lightboxOpen && (() => {
              const imageDocuments = documents.filter((d) => {
                const n = d.fileName || d.documentName || "";
                return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(n);
              });
              if (imageDocuments.length === 0) return null;
              const currentDoc = imageDocuments[lightboxIndex] || imageDocuments[0];
              return (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                  onClick={() => setLightboxOpen(false)}
                >
                  {/* Lightbox container */}
                  <div
                    className="relative mx-4 flex max-h-[90vh] max-w-[90vw] items-center justify-center rounded-[10px] bg-white p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close button */}
                    <button
                      onClick={() => setLightboxOpen(false)}
                      className="absolute right-3 top-3 z-10 rounded-full bg-white p-1.5 text-gray-400 cursor-pointer shadow hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>

                    {/* Previous arrow */}
                    {imageDocuments.length > 1 && (
                      <button
                        onClick={() =>
                          setLightboxIndex((prev) =>
                            prev <= 0 ? imageDocuments.length - 1 : prev - 1
                          )
                        }
                        className="absolute -left-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-500 cursor-pointer shadow-lg hover:text-gray-800"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    )}

                    {/* Image */}
                    <img
                      src={`/uploads/documents/${currentDoc.fileName}`}
                      alt={currentDoc.documentName || "Attachment"}
                      className="max-h-[80vh] max-w-[80vw] rounded-[10px] object-contain"
                    />

                    {/* Next arrow */}
                    {imageDocuments.length > 1 && (
                      <button
                        onClick={() =>
                          setLightboxIndex((prev) =>
                            prev >= imageDocuments.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute -right-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-500 cursor-pointer shadow-lg hover:text-gray-800"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Upload Documents Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Multiple Documents</DialogTitle>
                </DialogHeader>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed p-10 transition-colors ${
                    dragOver
                      ? "border-cyan-500 bg-cyan-50"
                      : "border-cyan-300 bg-cyan-50/30"
                  }`}
                >
                  <p className="text-sm text-gray-600">Drag & Drop multiple documents to upload at once</p>
                  <label className="mt-1 cursor-pointer text-sm font-medium text-cyan-600 underline hover:text-cyan-700">
                    Or click here to select
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFilesSelected}
                    />
                  </label>
                </div>
                {pendingFiles.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm">
                        <span className="truncate">{f.name}</span>
                        <button
                          onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-2 hover:opacity-70 shrink-0"
                        >
                          <img src="/trash.svg" alt="Remove" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleUploadDocuments}
                    disabled={uploading || pendingFiles.length === 0}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {uploading ? "Uploading..." : "Upload Documents"}
                  </Button>
                  <button
                    onClick={() => setUploadDialogOpen(false)}
                    disabled={uploading}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Column */}
          <div className="md:col-span-5 space-y-6">
            {/* Support Tickets by Title */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Support Tickets by Title</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(ticketsByTitle).length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">No tickets yet</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(ticketsByTitle).map(([key, { title, count }]) => (
                      <div key={key} className="flex items-center justify-between rounded-[10px] border border-gray-100 bg-gray-50 px-4 py-2.5">
                        <span className="text-sm text-gray-700">{title}</span>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Ticket URL */}
            <Card>
              <CardContent className="p-6">
                {client.accessToken ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">Support Ticket URL</span>
                        <button
                          onClick={handleCopyUrl}
                          className="flex items-center gap-1.5 text-sm text-[#00AEEF] hover:text-[#009ad6] font-medium"
                        >
                          <Copy className="h-4 w-4" />
                          Copy link
                        </button>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeactivateUrl}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50 px-4"
                      >
                        <Copy className="h-4 w-4" />
                        Deactivate
                      </Button>
                    </div>
                    <div className="rounded-[10px] bg-[#eef6fa] px-4 py-3">
                      <p className="text-sm text-gray-600 break-all">
                        {typeof window !== "undefined"
                          ? `${window.location.origin}/support/${client.accessToken}`
                          : `/support/${client.accessToken}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Support Ticket URL</span>
                    <Button
                      size="sm"
                      onClick={handleActivateUrl}
                      className="bg-[#00AEEF] hover:bg-[#009ad6] text-white px-5"
                    >
                      <Copy className="h-4 w-4" />
                      Activate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* General Site Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Site Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add note */}
                <div className="rounded-[10px] border border-gray-200 bg-sky-50/40 p-4">
                  <Textarea
                    placeholder="Start typing..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onFocus={() => setNoteFocused(true)}
                    rows={3}
                    className="border-gray-200 bg-white resize-none"
                  />
                  {(noteFocused || noteText.trim()) && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Save As:</p>
                        <div className="flex items-center gap-1.5">
                          {NOTE_TYPES.map((t) => (
                            <button
                              key={t.value}
                              onClick={() => setSelectedNoteType(t.value)}
                              className={`flex h-9 w-9 items-center justify-center rounded-[10px] border transition-colors ${
                                selectedNoteType === t.value
                                  ? "border-cyan-500 bg-cyan-50"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                              title={t.label}
                            >
                              <img src={t.icon} alt={t.label} className="h-5 w-5" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={submittingNote || !noteText.trim()}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                      >
                        {submittingNote && <Loader2 className="h-4 w-4 animate-spin" />}
                        {submittingNote ? "Saving..." : "Save As"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notes list */}
                {notes.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">No notes yet</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note._id} className="rounded-[10px] border border-gray-200 bg-white p-4">
                        {/* Note header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={getNoteTypeIcon(note.noteType)}
                              alt=""
                              className="h-4 w-4 opacity-60"
                            />
                            <span className="text-sm font-semibold text-gray-900">
                              {note.userId?.name || "Unknown User"}
                            </span>
                            <span className="text-xs" style={{ color: "#00AEEF" }}>
                              {note.dateTime
                                ? formatDate(note.dateTime)
                                : note.createdAt
                                ? formatDate(note.createdAt)
                                : "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingNoteId(note._id);
                                setEditNoteText(note.notes);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note._id)}
                              className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-gray-200 hover:bg-gray-50 hover:opacity-70"
                              title="Delete"
                            >
                              <img src="/trash.svg" alt="Delete" className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* Note body */}
                        {editingNoteId === note._id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editNoteText}
                              onChange={(e) => setEditNoteText(e.target.value)}
                              rows={3}
                              className="resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditNote(note._id)}
                                disabled={!editNoteText.trim()}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                              >
                                Save
                              </Button>
                              <button
                                onClick={() => { setEditingNoteId(null); setEditNoteText(""); }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </>
      )}

      {activeTab === "sites" && (
        <SitesTab clientId={clientId} sites={sites} onRefresh={fetchSites} />
      )}

      {activeTab === "assets" && (
        <AssetsTab clientId={clientId} assets={assets} sites={sites} onRefresh={fetchAssets} />
      )}

      {activeTab === "contacts" && (
        <ContactsTab clientId={clientId} contacts={contacts} sites={sites} onRefresh={fetchContacts} />
      )}

      {activeTab === "service-agreements" && (
        <ServiceAgreementsTab clientId={clientId} serviceAgreements={serviceAgreements} sites={sites} onRefresh={fetchServiceAgreements} />
      )}

      {activeTab === "work-history" && (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500 text-sm">Coming soon</p>
        </div>
      )}

      {activeTab === "portal-users" && (
        <PortalUsersTab clientId={clientId} />
      )}
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
        <CardTitle className="text-lg">Sites ({sites.length})</CardTitle>
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
              <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
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
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form fields
  const [machineName, setMachineName] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [clientSiteId, setClientSiteId] = useState("");

  // Asset settings data
  const [assetTypes, setAssetTypes] = useState<AssetTypeOption[]>([]);
  const [assetMakes, setAssetMakes] = useState<AssetMakeOption[]>([]);
  const [assetModels, setAssetModels] = useState<AssetModelOption[]>([]);
  const [makeModelMappings, setMakeModelMappings] = useState<AssetMakeModelMapping[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Selection state
  const [selectedTypeIds, setSelectedTypeIds] = useState<Set<string>>(new Set());
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");

  const fetchAssetSettings = async (asset?: Asset | null) => {
    setLoadingSettings(true);
    try {
      const [typesRes, makesRes, modelsRes, mappingsRes] = await Promise.all([
        fetch("/api/settings/asset-types").then((r) => r.json()),
        fetch("/api/settings/asset-makes").then((r) => r.json()),
        fetch("/api/settings/asset-models").then((r) => r.json()),
        fetch("/api/settings/asset-make-models").then((r) => r.json()),
      ]);

      const types = typesRes.success ? typesRes.data : [];
      const makes = makesRes.success ? makesRes.data : [];
      const models = modelsRes.success ? modelsRes.data : [];
      const mappings = mappingsRes.success ? mappingsRes.data : [];

      setAssetTypes(types);
      setAssetMakes(makes);
      setAssetModels(models);
      setMakeModelMappings(mappings);

      // Select all types by default
      setSelectedTypeIds(new Set(types.map((t: AssetTypeOption) => t._id)));

      // If editing, pre-select make and model
      if (asset) {
        const makeId = typeof asset.assetMakeId === "object" ? asset.assetMakeId._id : asset.assetMakeId || "";
        const modelId = typeof asset.assetModelId === "object" ? asset.assetModelId._id : asset.assetModelId || "";
        setSelectedMakeId(makeId);
        setSelectedModelId(modelId);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSettings(false);
    }
  };

  const resetForm = () => {
    setMachineName("");
    setSerialNo("");
    setClientSiteId("");
    setEditingAsset(null);
    setSelectedTypeIds(new Set(assetTypes.map((t) => t._id)));
    setSelectedMakeId("");
    setSelectedModelId("");
    setError("");
  };

  const openAdd = () => {
    resetForm();
    fetchAssetSettings();
    setDialogOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setMachineName(asset.machineName);
    setSerialNo(asset.serialNo || "");
    setClientSiteId(asset.clientSiteId || "");
    setError("");
    fetchAssetSettings(asset);
    setDialogOpen(true);
  };

  // Toggle a type selection
  const toggleType = (typeId: string) => {
    setSelectedTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return next;
    });
    // Clear make/model when types change
    setSelectedMakeId("");
    setSelectedModelId("");
  };

  // Compute filtered makes based on selected types
  // A make is shown if it has at least one make-model mapping where the model's assetTypeId is in selectedTypeIds
  const filteredMakes = (() => {
    if (selectedTypeIds.size === 0) return [];

    // Get model IDs that belong to selected types
    const typeModelIds = new Set(
      assetModels
        .filter((m) => m.assetTypeId && selectedTypeIds.has(m.assetTypeId))
        .map((m) => m._id)
    );

    // Get make IDs that have mappings to those models
    const validMakeIds = new Set(
      makeModelMappings
        .filter((mm) => typeModelIds.has(mm.assetModelId))
        .map((mm) => mm.assetMakeId)
    );

    // Also include makes that have ANY mapping (if no type filter would exclude them)
    // If all types are selected, show all makes
    if (selectedTypeIds.size === assetTypes.length) {
      return assetMakes;
    }

    return assetMakes.filter((m) => validMakeIds.has(m._id));
  })();

  // Compute filtered models for the selected make
  const filteredModels = (() => {
    if (!selectedMakeId) return [];

    // Get model IDs mapped to this make
    const mappedModelIds = new Set(
      makeModelMappings
        .filter((mm) => mm.assetMakeId === selectedMakeId)
        .map((mm) => mm.assetModelId)
    );

    // Filter models by mapped IDs and selected types
    return assetModels.filter(
      (m) =>
        mappedModelIds.has(m._id) &&
        (!m.assetTypeId || selectedTypeIds.has(m.assetTypeId))
    );
  })();

  // Clear model if make changes and current model is not valid
  useEffect(() => {
    if (selectedModelId && !filteredModels.find((m) => m._id === selectedModelId)) {
      setSelectedModelId("");
    }
  }, [selectedMakeId, filteredModels, selectedModelId]);

  // Clear make if it's no longer in filtered makes
  useEffect(() => {
    if (selectedMakeId && !filteredMakes.find((m) => m._id === selectedMakeId)) {
      setSelectedMakeId("");
      setSelectedModelId("");
    }
  }, [selectedTypeIds, filteredMakes, selectedMakeId]);

  const handleSubmit = async () => {
    if (!machineName.trim()) {
      setError("Machine name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // Determine the assetTypeId from the selected model if available
      let assetTypeId: string | undefined;
      if (selectedModelId) {
        const model = assetModels.find((m) => m._id === selectedModelId);
        if (model?.assetTypeId) assetTypeId = model.assetTypeId;
      }

      const payload = {
        machineName: machineName.trim(),
        serialNo: serialNo.trim() || undefined,
        clientSiteId: clientSiteId || undefined,
        assetTypeId,
        assetMakeId: selectedMakeId || undefined,
        assetModelId: selectedModelId || undefined,
      };

      const url = editingAsset
        ? `/api/clients/${clientId}/assets/${editingAsset._id}`
        : `/api/clients/${clientId}/assets`;

      const res = await fetch(url, {
        method: editingAsset ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || `Failed to ${editingAsset ? "update" : "add"} asset`);

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

  const getMakeName = (makeId?: string | { _id: string; title: string }) => {
    if (!makeId) return "";
    if (typeof makeId === "object") return makeId.title;
    return "";
  };

  const getModelName = (modelId?: string | { _id: string; title: string }) => {
    if (!modelId) return "";
    if (typeof modelId === "object") return modelId.title;
    return "";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Assets ({assets.length})</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={openAdd}
              className="bg-[#00AEEF] hover:bg-[#0098d4] text-white"
            >
              <Plus className="h-4 w-4" />
              Add Machine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader className="p-0">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-base font-semibold">{editingAsset ? "Edit Asset" : "Add Asset"}</DialogTitle>
                <select
                  className="h-9 rounded-[10px] border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={clientSiteId}
                  onChange={(e) => setClientSiteId(e.target.value)}
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site._id} value={site._id}>
                      {site.siteName}
                    </option>
                  ))}
                </select>
              </div>
              <DialogDescription className="sr-only">
                {editingAsset ? "Edit asset details" : "Add a new asset to this client"}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Machine Name & Serial Number */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600">Machine Name</Label>
                <Input
                  placeholder="Enter machine name"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600">Serial Number</Label>
                <Input
                  placeholder="Enter serial number"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Three-column Type / Make / Model selector */}
            {loadingSettings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 min-h-[280px]">
                {/* Type Column */}
                <div className="flex flex-col">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {assetTypes.map((type) => {
                      const isSelected = selectedTypeIds.has(type._id);
                      return (
                        <button
                          key={type._id}
                          type="button"
                          onClick={() => toggleType(type._id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-[#E0F4FB] text-[#2EA4D0] border border-[#2EA4D0]"
                              : "bg-gray-100 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {type.title}
                        </button>
                      );
                    })}
                    {assetTypes.length === 0 && (
                      <p className="text-sm text-gray-400">No types available</p>
                    )}
                  </div>
                </div>

                {/* Make Column */}
                <div className="flex flex-col">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Make</h4>
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-1">
                    {filteredMakes.map((make) => {
                      const isSelected = selectedMakeId === make._id;
                      return (
                        <button
                          key={make._id}
                          type="button"
                          onClick={() => {
                            setSelectedMakeId(isSelected ? "" : make._id);
                            setSelectedModelId("");
                          }}
                          className={`px-3 py-2 rounded-[10px] text-sm text-left transition-colors border ${
                            isSelected
                              ? "border-[#2EA4D0] bg-[#E0F4FB] text-[#2EA4D0] font-medium"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {make.title}
                        </button>
                      );
                    })}
                    {filteredMakes.length === 0 && (
                      <p className="text-sm text-gray-400">
                        {selectedTypeIds.size === 0
                          ? "Select a type to see makes"
                          : "No makes available"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Model Column */}
                <div className="flex flex-col">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Model</h4>
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[260px] pr-1">
                    {selectedMakeId ? (
                      filteredModels.length > 0 ? (
                        filteredModels.map((model) => {
                          const isSelected = selectedModelId === model._id;
                          return (
                            <button
                              key={model._id}
                              type="button"
                              onClick={() =>
                                setSelectedModelId(isSelected ? "" : model._id)
                              }
                              className={`px-3 py-2 rounded-[10px] text-sm text-left transition-colors border ${
                                isSelected
                                  ? "border-[#2EA4D0] bg-[#E0F4FB] text-[#2EA4D0] font-medium"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              {model.title}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-400">No models available</p>
                      )
                    ) : (
                      <p className="text-sm text-gray-400">Select a make to see models</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <hr className="border-gray-200" />

            {/* Footer */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#00AEEF] hover:bg-[#0098d4] text-white"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingAsset ? "Update Asset" : "Add Asset"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Machine Name</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Make</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No assets found
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset._id}>
                  <TableCell>{getSiteName(asset.clientSiteId)}</TableCell>
                  <TableCell>{asset.machineName}</TableCell>
                  <TableCell>{asset.serialNo || ""}</TableCell>
                  <TableCell>{getMakeName(asset.assetMakeId)}</TableCell>
                  <TableCell>{getModelName(asset.assetModelId)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="h-9 w-9 inline-flex items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(asset)}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(asset._id)}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50"
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
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
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
    setEditingContact(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      lastName: contact.lastName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      position: contact.position || "",
      clientSiteId: contact.clientSiteId || "",
    });
    setError("");
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

      const url = editingContact
        ? `/api/clients/${clientId}/contacts/${editingContact._id}`
        : `/api/clients/${clientId}/contacts`;

      const res = await fetch(url, {
        method: editingContact ? "PUT" : "POST",
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
      if (!json.success) throw new Error(json.error || "Failed to save contact");

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
        <CardTitle className="text-lg">Contacts ({contacts.length})</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
            </DialogHeader>
            {error && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div className="divide-y divide-gray-100">
              <div className="flex items-center gap-4 py-3">
                <Label htmlFor="contactSite" className="w-32 shrink-0 text-sm font-semibold text-gray-900">Select Site</Label>
                <select
                  id="contactSite"
                  className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  value={form.clientSiteId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientSiteId: e.target.value }))
                  }
                >
                  <option value="">Set as General Contact</option>
                  {sites.map((site) => (
                    <option key={site._id} value={site._id}>
                      {site.siteName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4 py-3">
                <Label htmlFor="contactName" className="w-32 shrink-0 text-sm font-semibold text-gray-900">First Name</Label>
                <Input
                  id="contactName"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-4 py-3">
                <Label htmlFor="contactLastName" className="w-32 shrink-0 text-sm font-semibold text-gray-900">Last Name</Label>
                <Input
                  id="contactLastName"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-4 py-3">
                <Label htmlFor="contactPosition" className="w-32 shrink-0 text-sm font-semibold text-gray-900">Position</Label>
                <Input
                  id="contactPosition"
                  value={form.position}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, position: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-4 py-3">
                <Label htmlFor="contactEmail" className="w-32 shrink-0 text-sm font-semibold text-gray-900">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-4 py-3">
                <Label htmlFor="contactPhone" className="w-32 shrink-0 text-sm font-semibold text-gray-900">Phone</Label>
                <Input
                  id="contactPhone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={submitting} className="bg-[#00AEEF] hover:bg-[#009ad6] text-white">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingContact ? "Update" : "Add"} Contact
              </Button>
              <button
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
                className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
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
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(contact)}
                        className="rounded-[10px] p-1.5 text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-600"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact._id)}
                        className="rounded-[10px] p-1.5 text-gray-400 cursor-pointer hover:bg-red-50 hover:text-red-500"
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
          <CardTitle className="text-lg">Add Note</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
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
          <CardTitle className="text-lg">Notes ({notes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No notes yet</p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note._id}
                  className="rounded-[10px] border border-gray-100 bg-gray-50 p-4"
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
        <CardTitle className="text-lg">Documents ({documents.length})</CardTitle>
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

// ═══════════════════════════════════════════════════════════════════════════
// Portal Users Tab
// ═══════════════════════════════════════════════════════════════════════════

interface PortalUser {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  position?: string;
  role: number;
  status: number;
  lastLogin?: string;
  createdAt?: string;
  userDetail?: {
    _id: string;
    profilePic?: string;
  };
}

interface LoginEntry {
  _id: string;
  ipAddress?: string;
  city?: string;
  dateTime?: string;
  loginResponse?: string;
}

function PortalUsersTab({ clientId }: { clientId: string }) {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // View user state
  const [viewingUser, setViewingUser] = useState<PortalUser | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit user state
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    lastName: "",
    phone: "",
    position: "",
    role: 4,
  });

  // Change password state
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users?clientId=${clientId}&limit=100`);
      const json = await res.json();
      if (json.success) {
        const data = json.data?.data || json.data || [];
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getRoleName = (role: number) => {
    if (role === 4) return "Administrator";
    if (role === 6) return "Client User";
    return "User";
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }

    try {
      setInviteSubmitting(true);
      setInviteError("");

      // Create user with pending status, then send invite
      const createRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteEmail.split("@")[0],
          email: inviteEmail.trim(),
          password: crypto.randomUUID(),
          role: 4,
          clientId,
        }),
      });

      const createJson = await createRes.json();
      if (!createJson.success) throw new Error(createJson.error || "Failed to create user");

      const userId = createJson.data._id;

      // Send invite
      const inviteRes = await fetch(`/api/users/${userId}/invite`, {
        method: "POST",
      });

      const inviteJson = await inviteRes.json();
      if (!inviteJson.success) throw new Error(inviteJson.error || "Failed to send invite");

      setInviteOpen(false);
      setInviteEmail("");
      fetchUsers();
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteSubmitting(false);
    }
  };

  const openUserView = async (user: PortalUser) => {
    setViewingUser(user);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/users/${user._id}/login-history`);
      const json = await res.json();
      if (json.success) {
        setLoginHistory(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  const openEditUser = () => {
    if (!viewingUser) return;
    setEditForm({
      name: viewingUser.name || "",
      lastName: viewingUser.lastName || "",
      phone: viewingUser.phone || "",
      position: viewingUser.position || "",
      role: viewingUser.role,
    });
    setEditError("");
    setEditOpen(true);
  };

  const handleEditUser = async () => {
    if (!viewingUser) return;
    if (!editForm.name.trim()) {
      setEditError("First name is required");
      return;
    }
    try {
      setEditSubmitting(true);
      setEditError("");
      const res = await fetch(`/api/users/${viewingUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          lastName: editForm.lastName.trim(),
          phone: editForm.phone.trim(),
          position: editForm.position.trim(),
          role: editForm.role,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update user");

      // Update local state
      const updated = {
        ...viewingUser,
        name: editForm.name.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        position: editForm.position.trim(),
        role: editForm.role,
      };
      setViewingUser(updated);
      setEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const openChangePassword = () => {
    setPasswordForm({ password: "", confirmPassword: "" });
    setPasswordError("");
    setPasswordOpen(true);
  };

  const handleChangePassword = async () => {
    if (!viewingUser) return;
    if (!passwordForm.password) {
      setPasswordError("Password is required");
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    try {
      setPasswordSubmitting(true);
      setPasswordError("");
      const res = await fetch(`/api/users/${viewingUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordForm.password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to change password");
      setPasswordOpen(false);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // View user detail page
  if (viewingUser) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewingUser(null)}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold">
            {viewingUser.name}{viewingUser.lastName ? ` ${viewingUser.lastName}` : ""}
          </h2>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-600 border border-green-200">
            {getRoleName(viewingUser.role)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Card - Avatar & Details */}
          <Card className="lg:col-span-4">
            <CardContent className="p-6">
              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="h-40 w-40 rounded-full bg-[#E8F6FC] flex items-center justify-center">
                  <User className="h-20 w-20 text-[#b0d8e8]" />
                </div>
              </div>

              {/* User Details */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">User Details</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openEditUser}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={openChangePassword}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    <img src="/change-password.svg" alt="Change password" width={16} height={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2EA4D0]">Name</span>
                  <span className="text-sm text-gray-800">
                    {viewingUser.name}{viewingUser.lastName ? ` ${viewingUser.lastName}` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2EA4D0]">Email</span>
                  <span className="text-sm text-gray-800">{viewingUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2EA4D0]">Phone</span>
                  <span className="text-sm text-gray-400">{viewingUser.phone || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2EA4D0]">Position</span>
                  <span className="text-sm text-gray-400">{viewingUser.position || "Not set"}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-[#2EA4D0]">User Groups</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Details Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Edit Details</DialogTitle>
                <DialogDescription className="sr-only">Edit portal user details</DialogDescription>
              </DialogHeader>

              {editError && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {editError}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label className="w-32 shrink-0 text-sm text-gray-600">First Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-32 shrink-0 text-sm text-gray-600">Last Name</Label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-32 shrink-0 text-sm text-gray-600">Phone Number</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-32 shrink-0 text-sm text-gray-600">Position</Label>
                  <Input
                    value={editForm.position}
                    onChange={(e) => setEditForm((f) => ({ ...f, position: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-32 shrink-0 text-sm text-gray-600">Role</Label>
                  <select
                    className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: parseInt(e.target.value) }))}
                  >
                    <option value={4}>Administrator</option>
                    <option value={6}>Client User</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button
                  onClick={handleEditUser}
                  disabled={editSubmitting}
                  className="bg-[#00AEEF] hover:bg-[#0098d4] text-white"
                >
                  {editSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update
                </Button>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={editSubmitting}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Change Password Dialog */}
          <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Change Password</DialogTitle>
                <DialogDescription className="sr-only">Change portal user password</DialogDescription>
              </DialogHeader>

              {passwordError && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {passwordError}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label className="w-40 shrink-0 text-sm text-gray-600">Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-40 shrink-0 text-sm text-gray-600">Confirm Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordSubmitting}
                  className="bg-[#00AEEF] hover:bg-[#0098d4] text-white"
                >
                  {passwordSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update
                </Button>
                <button
                  type="button"
                  onClick={() => setPasswordOpen(false)}
                  disabled={passwordSubmitting}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Right Card - Login History */}
          <Card className="lg:col-span-8 p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-semibold">Login History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingHistory ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : loginHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No login history
                      </TableCell>
                    </TableRow>
                  ) : (
                    loginHistory.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell className="text-sm">
                          {entry.dateTime ? formatDateTime(entry.dateTime) : "-"}
                        </TableCell>
                        <TableCell className="text-sm">{entry.ipAddress || "-"}</TableCell>
                        <TableCell className="text-sm">{entry.city || "-"}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`px-3 py-1 rounded-[10px] text-xs font-medium border ${
                              entry.loginResponse === "Success"
                                ? "text-green-600 border-green-200 bg-green-50"
                                : "text-red-600 border-red-200 bg-red-50"
                            }`}
                          >
                            {entry.loginResponse || "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Listing view
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Portal Users ({users.length})</CardTitle>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-[#00AEEF] hover:bg-[#0098d4] text-white"
              onClick={() => {
                setInviteEmail("");
                setInviteError("");
              }}
            >
              <Plus className="h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Invite User</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                Enter the email address below of a colleague you would like to invite to be able to login and manage your Total Spraybooth Care system.
              </DialogDescription>
            </DialogHeader>

            {inviteError && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {inviteError}
              </div>
            )}

            <div className="py-2">
              <Input
                placeholder="Email address"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button
                onClick={handleInvite}
                disabled={inviteSubmitting}
                className="bg-[#00AEEF] hover:bg-[#0098d4] text-white"
              >
                {inviteSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Invite
              </Button>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                disabled={inviteSubmitting}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No portal users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        {user.name}{user.lastName ? ` ${user.lastName}` : ""}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.lastLogin ? formatDateTime(user.lastLogin) : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1 rounded-[10px] text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                          {getRoleName(user.role)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          type="button"
                          onClick={() => openUserView(user)}
                          className="text-sm text-gray-600 hover:text-gray-800 inline-flex items-center gap-1"
                        >
                          View <ChevronRight className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Service Agreements Tab
// ═══════════════════════════════════════════════════════════════════════════

function ServiceAgreementsTab({
  clientId,
  serviceAgreements,
  sites,
  onRefresh,
}: {
  clientId: string;
  serviceAgreements: ServiceAgreement[];
  sites: Site[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ServiceAgreement | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [agreementNumber, setAgreementNumber] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [frequency, setFrequency] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<number>(3);
  const [coveredSiteIds, setCoveredSiteIds] = useState<string[]>([]);
  const [contractValue, setContractValue] = useState("");
  const [billingFrequency, setBillingFrequency] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingDocument, setExistingDocument] = useState("");

  const resetForm = () => {
    setTitle("");
    setAgreementNumber("");
    setServiceType("");
    setFrequency("");
    setStartDate("");
    setEndDate("");
    setStatus(3);
    setCoveredSiteIds([]);
    setContractValue("");
    setBillingFrequency("");
    setNotes("");
    setFile(null);
    setUploadProgress(0);
    setExistingDocument("");
    setEditing(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (ag: ServiceAgreement) => {
    setEditing(ag);
    setTitle(ag.title);
    setAgreementNumber(ag.agreementNumber || "");
    setServiceType(ag.serviceType || "");
    setFrequency(ag.frequency || "");
    setStartDate(ag.startDate ? ag.startDate.slice(0, 10) : "");
    setEndDate(ag.endDate ? ag.endDate.slice(0, 10) : "");
    setStatus(ag.status);
    setCoveredSiteIds(ag.coveredSiteIds || []);
    setContractValue(ag.contractValue != null ? String(ag.contractValue) : "");
    setBillingFrequency(ag.billingFrequency || "");
    setNotes(ag.notes || "");
    setExistingDocument(ag.document || "");
    setFile(null);
    setUploadProgress(0);
    setError("");
    setDialogOpen(true);
  };

  const toggleSite = (siteId: string) => {
    setCoveredSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const uploadFile = (
    f: File,
    folder: string,
    onProgress: (pct: number) => void
  ): Promise<{ url: string; fileName: string; fileSize: number }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", f);
      formData.append("folder", folder);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable)
          onProgress(Math.round((e.loaded / e.total) * 100));
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
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      let documentPath = existingDocument;
      if (file) {
        const result = await uploadFile(file, "service-agreements", setUploadProgress);
        documentPath = result.fileName;
      }

      const payload: Record<string, any> = {
        title: title.trim(),
        agreementNumber: agreementNumber.trim() || undefined,
        serviceType: serviceType || undefined,
        frequency: frequency || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
        coveredSiteIds,
        contractValue: contractValue ? Number(contractValue) : undefined,
        billingFrequency: billingFrequency.trim() || undefined,
        notes: notes.trim() || undefined,
        document: documentPath || undefined,
      };

      const url = editing
        ? `/api/clients/${clientId}/service-agreements/${editing._id}`
        : `/api/clients/${clientId}/service-agreements`;

      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || `Failed to ${editing ? "update" : "add"} agreement`);

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service agreement?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/service-agreements/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete agreement");
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (s: number) => {
    switch (s) {
      case 1:
        return <Badge variant="success">Active</Badge>;
      case 2:
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Service Agreements ({serviceAgreements.length})</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={openAdd}
              className="bg-[#00AEEF] hover:bg-[#0098d4] text-white"
            >
              <Plus className="h-4 w-4" />
              Add Agreement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Service Agreement</DialogTitle>
              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}
            </DialogHeader>

            <div className="divide-y divide-gray-100">
              <div className="flex items-center gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter agreement title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">Agreement #</Label>
                <Input
                  placeholder="e.g. SA-001"
                  value={agreementNumber}
                  onChange={(e) => setAgreementNumber(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">Service Type</Label>
                <select
                  className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  <option value="">Select service type</option>
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">Frequency</Label>
                <select
                  className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Select frequency</option>
                  {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">Status</Label>
                <select
                  className="flex h-10 w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                >
                  <option value={3}>Draft</option>
                  <option value={1}>Active</option>
                  <option value={2}>Expired</option>
                </select>
              </div>

              {sites.length > 0 && (
                <div className="flex items-start gap-4 py-3">
                  <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900 pt-2">Covered Sites</Label>
                  <div className="flex flex-wrap gap-2">
                    {sites.map((site) => (
                      <button
                        key={site._id}
                        type="button"
                        onClick={() => toggleSite(site._id)}
                        className={`px-3 py-1.5 rounded-[10px] text-xs font-medium border transition-colors ${
                          coveredSiteIds.includes(site._id)
                            ? "border-[#2EA4D0] bg-[#E0F4FB] text-[#2EA4D0]"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {site.siteName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">Contract Value</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">Billing Frequency</Label>
                <Input
                  placeholder="e.g. Monthly, Quarterly"
                  value={billingFrequency}
                  onChange={(e) => setBillingFrequency(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">Document</Label>
                <div className="flex-1">
                  <Input
                    type="file"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setUploadProgress(0);
                    }}
                  />
                  {existingDocument && !file && (
                    <p className="mt-1 text-xs text-gray-500">Current: {existingDocument}</p>
                  )}
                </div>
              </div>

              {file && (
                <div className="flex items-center gap-4 py-3">
                  <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900">Upload Progress</Label>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4 py-3">
                <Label className="w-40 shrink-0 text-sm font-semibold text-gray-900 pt-2">Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { resetForm(); setDialogOpen(false); }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Update" : "Add"} Agreement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agreement #</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serviceAgreements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No service agreements found
                </TableCell>
              </TableRow>
            ) : (
              serviceAgreements.map((ag) => (
                <TableRow key={ag._id}>
                  <TableCell className="font-medium">{ag.agreementNumber || "-"}</TableCell>
                  <TableCell>{ag.title}</TableCell>
                  <TableCell>{ag.serviceType || "-"}</TableCell>
                  <TableCell>{ag.frequency ? FREQUENCY_LABELS[ag.frequency] || "-" : "-"}</TableCell>
                  <TableCell>{ag.startDate ? formatDate(ag.startDate) : "-"}</TableCell>
                  <TableCell>{ag.endDate ? formatDate(ag.endDate) : "-"}</TableCell>
                  <TableCell>{getStatusBadge(ag.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(ag)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ag._id)}
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
