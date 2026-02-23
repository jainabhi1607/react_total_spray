"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  MapPin,
  FileText,
  Users,
  StickyNote,
  Wrench,
  Upload,
  Loader2,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
} from "lucide-react";
import { AddClientDialog } from "@/components/dialogs/add-client-dialog";
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

interface SupportTicket {
  _id: string;
  titleId?: { _id: string; title: string } | null;
  ticketStatus: number;
}

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
    }
  }, [loading, client, fetchSites, fetchAssets, fetchContacts, fetchNotes, fetchDocuments, fetchSupportTickets]);

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


  // ─── Copy support ticket URL ──────────────────────────────────────────

  const handleCopyUrl = () => {
    if (!client?.accessToken) return;
    const url = `${window.location.origin}/support-portal/${client.accessToken}`;
    navigator.clipboard.writeText(url);
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
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
              className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
              className={`whitespace-nowrap border-b-2 text-sm font-normal transition-colors ${
                activeTab === tab.value
                  ? "border-cyan-500 text-gray-900"
                  : "border-transparent text-gray-900 hover:border-gray-300"
              }`}
              style={{ lineHeight: "30px", paddingLeft: 25, paddingRight: 25, fontSize: 14 }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Support Tickets - dark card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="flex items-center justify-between p-5" style={{ height: 106 }}>
            <p className="text-sm font-medium text-slate-300">Support Tickets</p>
            <p className="text-3xl font-bold" style={{ color: "#00AEEF" }}>
              {supportTickets.length}
            </p>
          </CardContent>
        </Card>
        {/* Assets */}
        <Card className="bg-white">
          <CardContent className="flex items-center justify-between p-5" style={{ height: 106 }}>
            <p className="text-sm font-medium text-gray-500">Assets</p>
            <p className="text-3xl font-bold" style={{ color: "#f7cd4b" }}>
              {assets.length}
            </p>
          </CardContent>
        </Card>
        {/* Sites */}
        <Card className="bg-white">
          <CardContent className="flex items-center justify-between p-5" style={{ height: 106 }}>
            <p className="text-sm font-medium text-gray-500">Sites</p>
            <p className="text-3xl font-bold" style={{ color: "#E18230" }}>
              {sites.length}
            </p>
          </CardContent>
        </Card>
        {/* Contacts */}
        <Card className="bg-white">
          <CardContent className="flex items-center justify-between p-5" style={{ height: 106 }}>
            <p className="text-sm font-medium text-gray-500">Contacts</p>
            <p className="text-3xl font-bold" style={{ color: "#82cd66" }}>
              {contacts.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Left Column */}
          <div className="md:col-span-7 space-y-6">
            {/* Client Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Client Information</CardTitle>
                <button
                  onClick={() => setEditDialogOpen(true)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
                  className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
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
                        <div key={doc._id} className="w-40 rounded-xl border border-gray-200 bg-white p-3">
                          {/* Action icons */}
                          <div className="flex items-center gap-2.5 mb-2">
                            <a
                              href={`/uploads/documents/${doc.fileName}`}
                              download={doc.documentName || doc.fileName}
                              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                              title="Download"
                            >
                              <Download className="h-5 w-5" strokeWidth={1.5} />
                            </a>
                            <button
                              onClick={() => handleDeleteDocument(doc._id)}
                              className="rounded p-0.5 hover:opacity-70"
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
                    className="relative mx-4 flex max-h-[90vh] max-w-[90vw] items-center justify-center rounded-2xl bg-white p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close button */}
                    <button
                      onClick={() => setLightboxOpen(false)}
                      className="absolute right-3 top-3 z-10 rounded-full bg-white p-1.5 text-gray-400 shadow hover:text-gray-600"
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
                        className="absolute -left-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-lg hover:text-gray-800"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    )}

                    {/* Image */}
                    <img
                      src={`/uploads/documents/${currentDoc.fileName}`}
                      alt={currentDoc.documentName || "Attachment"}
                      className="max-h-[80vh] max-w-[80vw] rounded-lg object-contain"
                    />

                    {/* Next arrow */}
                    {imageDocuments.length > 1 && (
                      <button
                        onClick={() =>
                          setLightboxIndex((prev) =>
                            prev >= imageDocuments.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute -right-14 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-lg hover:text-gray-800"
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
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${
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
                      <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5">
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
              <CardHeader>
                <CardTitle className="text-lg">Support Ticket URL</CardTitle>
              </CardHeader>
              <CardContent>
                {client.accessToken ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500 truncate">
                        {typeof window !== "undefined" ? `${window.location.origin}/support-portal/${client.accessToken}` : `/support-portal/${client.accessToken}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-500 py-4">No access token configured</p>
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
                <div className="rounded-xl border border-gray-200 bg-sky-50/40 p-4">
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
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
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
                      <div key={note._id} className="rounded-xl border border-gray-200 bg-white p-4">
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
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note._id)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 hover:opacity-70"
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
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500 text-sm">Coming soon</p>
        </div>
      )}

      {activeTab === "work-history" && (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500 text-sm">Coming soon</p>
        </div>
      )}

      {activeTab === "portal-users" && (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500 text-sm">Coming soon</p>
        </div>
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
