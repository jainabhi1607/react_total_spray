"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Contact, ExternalLink, Pencil, Loader2 } from "lucide-react";
import { TrashIcon } from "@/components/ui/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoading } from "@/components/ui/loading";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactItem {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  position?: string;
  clientId?: string | { _id: string; companyName: string };
  clientSiteId?: string | { _id: string; siteName?: string };
  siteId?: string | { _id: string; name: string; siteName?: string };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContactsPage() {
  useEffect(() => { document.title = "TSC - Contacts"; }, []);
  const [allContacts, setAllContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState<number | null>(null);

  // Edit contact dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editContact, setEditContact] = useState<ContactItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", lastName: "", position: "", email: "", phone: "" });
  const [editSaving, setEditSaving] = useState(false);

  const isPortal = userRole === 4 || userRole === 6;

  // Fetch session
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        const json = await res.json();
        if (json?.user?.role) setUserRole(json.user.role);
      } catch {
        // silent
      }
    }
    fetchSession();
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try dedicated contacts endpoint first
      const res = await fetch("/api/contacts");
      const json = await res.json();

      if (res.ok && json.success) {
        setAllContacts(json.data || []);
        return;
      }

      // Fallback: fetch clients and their contacts
      const clientRes = await fetch("/api/clients");
      const clientJson = await clientRes.json();
      if (!clientRes.ok || !clientJson.success)
        throw new Error(clientJson.message || "Failed to load clients");

      const clients = clientJson.data?.data || clientJson.data || [];
      const contactPromises = clients.map(async (client: any) => {
        try {
          const cRes = await fetch(`/api/clients/${client._id}/contacts`);
          const cJson = await cRes.json();
          if (cRes.ok && cJson.success) {
            return (cJson.data || []).map((c: any) => ({
              ...c,
              clientId: { _id: client._id, companyName: client.companyName },
            }));
          }
        } catch {}
        return [];
      });

      const results = await Promise.all(contactPromises);
      setAllContacts(results.flat());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const getContactName = (c: ContactItem): string => {
    if (c.name) return c.name;
    return [c.firstName, c.lastName].filter(Boolean).join(" ") || "-";
  };

  const filteredContacts = search.trim()
    ? allContacts.filter((c) => {
        const q = search.toLowerCase();
        const name = getContactName(c).toLowerCase();
        const email = (c.email || "").toLowerCase();
        return name.includes(q) || email.includes(q);
      })
    : allContacts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <PageLoading />
      ) : error ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Unable to load contacts</p>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchContacts}>
              Retry
            </Button>
          </div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Contact className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">No contacts found</p>
            <p className="mt-1 text-sm text-gray-500">
              {search.trim()
                ? "Try adjusting your search."
                : "No contacts have been added yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Position</TableHead>
                  {!isPortal && <TableHead>Client</TableHead>}
                  {!isPortal && <TableHead>Site</TableHead>}
                  <TableHead className="w-[80px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => {
                  const clientId =
                    typeof contact.clientId === "object"
                      ? contact.clientId?._id
                      : contact.clientId;
                  const clientName =
                    typeof contact.clientId === "object"
                      ? contact.clientId?.companyName || "-"
                      : "-";
                  const siteName =
                    typeof contact.clientSiteId === "object"
                      ? contact.clientSiteId?.siteName || "-"
                      : typeof contact.siteId === "object"
                        ? contact.siteId?.siteName || contact.siteId?.name || "-"
                        : "-";

                  return (
                    <TableRow key={contact._id}>
                      <TableCell className="font-medium">
                        {getContactName(contact)}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {contact.email || "-"}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {contact.phone || "-"}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {contact.position || "-"}
                      </TableCell>
                      {!isPortal && <TableCell>{clientName}</TableCell>}
                      {!isPortal && <TableCell>{siteName}</TableCell>}
                      <TableCell className="text-right">
                        {isPortal ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditContact(contact);
                                setEditForm({
                                  name: contact.name || "",
                                  lastName: contact.lastName || "",
                                  position: contact.position || "",
                                  email: contact.email || "",
                                  phone: contact.phone || "",
                                });
                                setEditOpen(true);
                              }}
                              className="text-gray-400 hover:text-cyan-500 cursor-pointer"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm("Are you sure you want to delete this contact?")) return;
                                try {
                                  const res = await fetch(`/api/portal/contacts/${contact._id}`, { method: "DELETE" });
                                  const json = await res.json();
                                  if (res.ok && json.success) {
                                    setAllContacts((prev) => prev.filter((c) => c._id !== contact._id));
                                  } else {
                                    alert(json.error || "Failed to delete contact");
                                  }
                                } catch {
                                  alert("Failed to delete contact");
                                }
                              }}
                              className="text-gray-400 hover:text-red-500 cursor-pointer"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        ) : (
                          clientId && (
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/clients/${clientId}?tab=contacts`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {!loading && !error && filteredContacts.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {filteredContacts.length} contact
          {filteredContacts.length !== 1 ? "s" : ""}
          {search.trim() ? ` matching "${search}"` : ""}
        </p>
      )}

      {/* Edit Contact Dialog (Portal) */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) { setEditOpen(false); setEditContact(null); } }}>
        <DialogContent className="max-w-xl rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4">
            <DialogTitle className="text-lg font-bold">Edit Contact</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">Edit contact details</DialogDescription>
          <hr className="border-gray-200" />
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-4">
              <Label className="w-[100px] shrink-0 text-[13px] text-gray-700">First Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="flex-1 rounded-[10px] text-[13px]"
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-[100px] shrink-0 text-[13px] text-gray-700">Last Name</Label>
              <Input
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                className="flex-1 rounded-[10px] text-[13px]"
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-[100px] shrink-0 text-[13px] text-gray-700">Position</Label>
              <Input
                value={editForm.position}
                onChange={(e) => setEditForm((f) => ({ ...f, position: e.target.value }))}
                className="flex-1 rounded-[10px] text-[13px]"
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-[100px] shrink-0 text-[13px] text-gray-700">Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                className="flex-1 rounded-[10px] text-[13px]"
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="w-[100px] shrink-0 text-[13px] text-gray-700">Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                className="flex-1 rounded-[10px] text-[13px]"
              />
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-3 px-6 py-4">
            <Button
              onClick={async () => {
                if (!editContact || !editForm.name.trim()) return;
                setEditSaving(true);
                try {
                  const res = await fetch(`/api/portal/contacts/${editContact._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editForm),
                  });
                  const json = await res.json();
                  if (res.ok && json.success) {
                    setAllContacts((prev) =>
                      prev.map((c) =>
                        c._id === editContact._id
                          ? { ...c, name: editForm.name, lastName: editForm.lastName, position: editForm.position, email: editForm.email, phone: editForm.phone }
                          : c
                      )
                    );
                    setEditOpen(false);
                    setEditContact(null);
                  } else {
                    alert(json.error || "Failed to update contact");
                  }
                } catch {
                  alert("Failed to update contact");
                } finally {
                  setEditSaving(false);
                }
              }}
              disabled={editSaving || !editForm.name.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]"
            >
              {editSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Update
            </Button>
            <button
              onClick={() => { setEditOpen(false); setEditContact(null); }}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
