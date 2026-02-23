"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Contact, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
                  <TableHead>Client</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead className="w-[80px] text-right">Link</TableHead>
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
                    typeof contact.siteId === "object"
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
                      <TableCell>{clientName}</TableCell>
                      <TableCell>{siteName}</TableCell>
                      <TableCell className="text-right">
                        {clientId && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/clients/${clientId}?tab=contacts`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
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
    </div>
  );
}
