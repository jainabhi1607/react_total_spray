"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Types ---

interface Client {
  _id: string;
  companyName: string;
}

interface Site {
  _id: string;
  siteName: string;
}

interface Asset {
  _id: string;
  assetName: string;
  assetNo?: string;
}

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Title {
  _id: string;
  name: string;
}

// --- Page component ---

export default function AddSupportTicketPage() {
  useEffect(() => { document.title = "TSC - Add Support Ticket"; }, []);
  const router = useRouter();

  // Data lists
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);

  // Form state
  const [clientId, setClientId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [contactId, setContactId] = useState("");
  const [titleId, setTitleId] = useState("");
  const [description, setDescription] = useState("");
  const [warranty, setWarranty] = useState(false);
  const [partsRequired, setPartsRequired] = useState(false);
  const [productionImpact, setProductionImpact] = useState(false);
  const [onSiteTechnicianRequired, setOnSiteTechnicianRequired] = useState(false);

  // UI state
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSites, setLoadingSites] = useState(false);

  // Fetch clients and titles on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [clientsRes, titlesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/settings/titles"),
        ]);

        const clientsJson = await clientsRes.json();
        const titlesJson = await titlesRes.json();

        if (clientsJson.success) {
          const raw = clientsJson.data?.data || clientsJson.data || [];
          setClients(Array.isArray(raw) ? raw : []);
        }
        if (titlesJson.success) {
          const raw = titlesJson.data?.data || titlesJson.data || [];
          setTitles(Array.isArray(raw) ? raw : []);
        }
      } catch {
        setError("Failed to load form data");
      } finally {
        setPageLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  // Fetch sites, assets, contacts when client changes
  useEffect(() => {
    if (!clientId) {
      setSites([]);
      setAssets([]);
      setContacts([]);
      setSiteId("");
      setAssetId("");
      setContactId("");
      return;
    }

    async function fetchClientData() {
      setLoadingSites(true);
      setSiteId("");
      setAssetId("");
      setContactId("");

      try {
        const [sitesRes, assetsRes, contactsRes] = await Promise.all([
          fetch(`/api/clients/${clientId}/sites`),
          fetch(`/api/clients/${clientId}/assets`),
          fetch(`/api/clients/${clientId}/contacts`),
        ]);

        const sitesJson = await sitesRes.json();
        const assetsJson = await assetsRes.json();
        const contactsJson = await contactsRes.json();

        if (sitesJson.success) {
          const raw = sitesJson.data?.data || sitesJson.data || [];
          setSites(Array.isArray(raw) ? raw : []);
        }
        if (assetsJson.success) {
          const raw = assetsJson.data?.data || assetsJson.data || [];
          setAssets(Array.isArray(raw) ? raw : []);
        }
        if (contactsJson.success) {
          const raw = contactsJson.data?.data || contactsJson.data || [];
          setContacts(Array.isArray(raw) ? raw : []);
        }
      } catch {
        // Silently handle; dropdowns will just be empty
      } finally {
        setLoadingSites(false);
      }
    }

    fetchClientData();
  }, [clientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Please select a client");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    setSubmitting(true);

    try {
      const body: Record<string, any> = {
        clientId,
        description: description.trim(),
        warranty,
        partsRequired,
        productionImpact,
        onSiteTechnicianRequired,
      };

      if (siteId) body.siteId = siteId;
      if (assetId) body.assetId = assetId;
      if (contactId) body.contactId = contactId;
      if (titleId) body.titleId = titleId;

      const res = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create ticket");
      }

      const newId = json.data?._id || json.data?.id;
      router.push(`/support-tickets/${newId}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setSubmitting(false);
    }
  }

  if (pageLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/support-tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          New Support Ticket
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client">
                Client <span className="text-red-500">*</span>
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Site */}
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Select
                value={siteId}
                onValueChange={setSiteId}
                disabled={!clientId || loadingSites}
              >
                <SelectTrigger id="site">
                  <SelectValue
                    placeholder={
                      loadingSites ? "Loading sites..." : "Select a site"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site._id} value={site._id}>
                      {site.siteName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Asset */}
            <div className="space-y-2">
              <Label htmlFor="asset">Asset</Label>
              <Select
                value={assetId}
                onValueChange={setAssetId}
                disabled={!clientId || loadingSites}
              >
                <SelectTrigger id="asset">
                  <SelectValue
                    placeholder={
                      loadingSites ? "Loading assets..." : "Select an asset"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset._id} value={asset._id}>
                      {asset.assetName}
                      {asset.assetNo ? ` (${asset.assetNo})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label htmlFor="contact">Contact</Label>
              <Select
                value={contactId}
                onValueChange={setContactId}
                disabled={!clientId || loadingSites}
              >
                <SelectTrigger id="contact">
                  <SelectValue
                    placeholder={
                      loadingSites
                        ? "Loading contacts..."
                        : "Select a contact"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact._id} value={contact._id}>
                      {contact.firstName} {contact.lastName}
                      {contact.email ? ` (${contact.email})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title / Category */}
            <div className="space-y-2">
              <Label htmlFor="title">Title / Category</Label>
              <Select value={titleId} onValueChange={setTitleId}>
                <SelectTrigger id="title">
                  <SelectValue placeholder="Select a title" />
                </SelectTrigger>
                <SelectContent>
                  {titles.map((title) => (
                    <SelectItem key={title._id} value={title._id}>
                      {title.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the issue..."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="warranty"
                  checked={warranty}
                  onCheckedChange={(checked) =>
                    setWarranty(checked === true)
                  }
                />
                <Label htmlFor="warranty" className="cursor-pointer">
                  Warranty
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="partsRequired"
                  checked={partsRequired}
                  onCheckedChange={(checked) =>
                    setPartsRequired(checked === true)
                  }
                />
                <Label htmlFor="partsRequired" className="cursor-pointer">
                  Parts Required
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="productionImpact"
                  checked={productionImpact}
                  onCheckedChange={(checked) =>
                    setProductionImpact(checked === true)
                  }
                />
                <Label htmlFor="productionImpact" className="cursor-pointer">
                  Production Impact
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="onSiteTechnician"
                  checked={onSiteTechnicianRequired}
                  onCheckedChange={(checked) =>
                    setOnSiteTechnicianRequired(checked === true)
                  }
                />
                <Label htmlFor="onSiteTechnician" className="cursor-pointer">
                  On-site Technician Required
                </Label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/support-tickets">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
