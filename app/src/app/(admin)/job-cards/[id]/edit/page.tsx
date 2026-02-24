"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoading } from "@/components/ui/loading";

// --- Types ---

interface Client {
  _id: string;
  companyName: string;
}

interface Site {
  _id: string;
  siteName: string;
}

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface TitleOption {
  _id: string;
  name: string;
}

interface JobCardType {
  _id: string;
  name: string;
}

interface JobCardData {
  _id: string;
  clientId: { _id: string; companyName: string } | string;
  siteId?: { _id: string; siteName: string } | string;
  contactId?: { _id: string; firstName: string; lastName: string } | string;
  titleId?: { _id: string; name: string } | string;
  jobCardTypeId?: { _id: string; name: string } | string;
  description?: string;
  technicianBriefing?: string;
  jobDate?: string;
  jobEndDate?: string;
  multiDayJob?: boolean;
  warranty?: boolean;
  recurringJob?: boolean;
  recurringPeriod?: number;
  recurringRange?: string;
}

// --- Helpers ---

function extractId(
  field: { _id: string } | string | undefined | null
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field._id || "";
}

function toDateInputValue(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// --- Page component ---

export default function EditJobCardPage() {
  useEffect(() => { document.title = "TSC - Edit Job Card"; }, []);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Lookup data
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [titles, setTitles] = useState<TitleOption[]>([]);
  const [jobCardTypes, setJobCardTypes] = useState<JobCardType[]>([]);

  // Form state
  const [clientId, setClientId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [contactId, setContactId] = useState("");
  const [titleId, setTitleId] = useState("");
  const [description, setDescription] = useState("");
  const [technicianBriefing, setTechnicianBriefing] = useState("");
  const [jobDate, setJobDate] = useState("");
  const [jobEndDate, setJobEndDate] = useState("");
  const [multiDayJob, setMultiDayJob] = useState(false);
  const [warranty, setWarranty] = useState(false);
  const [jobCardTypeId, setJobCardTypeId] = useState("");
  const [recurringJob, setRecurringJob] = useState(false);
  const [recurringPeriod, setRecurringPeriod] = useState("");
  const [recurringRange, setRecurringRange] = useState("");

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track whether client-dependent data has been initially loaded
  const [initialClientId, setInitialClientId] = useState("");
  const [clientDataLoaded, setClientDataLoaded] = useState(false);

  // Fetch job card + lookups
  useEffect(() => {
    async function fetchAll() {
      try {
        const [jobCardRes, clientsRes, titlesRes, typesRes] =
          await Promise.all([
            fetch(`/api/job-cards/${id}`),
            fetch("/api/clients"),
            fetch("/api/settings/titles"),
            fetch("/api/settings/job-card-types"),
          ]);

        const jobCardJson = await jobCardRes.json();
        const clientsJson = await clientsRes.json();
        const titlesJson = await titlesRes.json();
        const typesJson = await typesRes.json();

        if (!jobCardRes.ok || !jobCardJson.success) {
          throw new Error(
            jobCardJson.message || "Failed to load job card"
          );
        }

        const jc: JobCardData = jobCardJson.data;

        if (clientsJson.success) setClients(clientsJson.data || []);
        if (titlesJson.success) setTitles(titlesJson.data || []);
        if (typesJson.success) setJobCardTypes(typesJson.data || []);

        // Populate form
        const cId = extractId(jc.clientId);
        setClientId(cId);
        setInitialClientId(cId);
        setSiteId(extractId(jc.siteId));
        setContactId(extractId(jc.contactId));
        setTitleId(extractId(jc.titleId));
        setJobCardTypeId(extractId(jc.jobCardTypeId));
        setDescription(jc.description || "");
        setTechnicianBriefing(jc.technicianBriefing || "");
        setJobDate(toDateInputValue(jc.jobDate));
        setJobEndDate(toDateInputValue(jc.jobEndDate));
        setMultiDayJob(jc.multiDayJob || false);
        setWarranty(jc.warranty || false);
        setRecurringJob(jc.recurringJob || false);
        setRecurringPeriod(
          jc.recurringPeriod ? String(jc.recurringPeriod) : ""
        );
        setRecurringRange(jc.recurringRange || "");

        // Fetch client sites and contacts for the initial client
        if (cId) {
          const [sitesRes, contactsRes] = await Promise.all([
            fetch(`/api/clients/${cId}/sites`),
            fetch(`/api/clients/${cId}/contacts`),
          ]);
          const sitesJson = await sitesRes.json();
          const contactsJson = await contactsRes.json();
          if (sitesJson.success) setSites(sitesJson.data || []);
          if (contactsJson.success) setContacts(contactsJson.data || []);
        }

        setClientDataLoaded(true);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setPageLoading(false);
      }
    }

    fetchAll();
  }, [id]);

  // Fetch sites and contacts when client changes (after initial load)
  useEffect(() => {
    if (!clientDataLoaded) return;
    if (clientId === initialClientId) return; // Skip if it's the initial value

    if (!clientId) {
      setSites([]);
      setContacts([]);
      setSiteId("");
      setContactId("");
      return;
    }

    async function fetchClientData() {
      try {
        const [sitesRes, contactsRes] = await Promise.all([
          fetch(`/api/clients/${clientId}/sites`),
          fetch(`/api/clients/${clientId}/contacts`),
        ]);

        const sitesJson = await sitesRes.json();
        const contactsJson = await contactsRes.json();

        if (sitesJson.success) setSites(sitesJson.data || []);
        if (contactsJson.success) setContacts(contactsJson.data || []);
      } catch {
        setSites([]);
        setContacts([]);
      }
    }

    setSiteId("");
    setContactId("");
    setInitialClientId(clientId);
    fetchClientData();
  }, [clientId, clientDataLoaded, initialClientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, any> = {
        clientId,
        description,
        technicianBriefing,
        warranty,
        multiDayJob,
      };

      if (siteId) body.siteId = siteId;
      if (contactId) body.contactId = contactId;
      if (titleId) body.titleId = titleId;
      if (jobDate) body.jobDate = jobDate;
      if (jobEndDate) body.jobEndDate = jobEndDate;
      if (jobCardTypeId) body.jobCardTypeId = jobCardTypeId;
      if (recurringJob) {
        body.recurringJob = true;
        body.recurringPeriod = Number(recurringPeriod) || 1;
        body.recurringRange = recurringRange;
      } else {
        body.recurringJob = false;
      }

      const res = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update job card");
      }

      router.push(`/job-cards/${id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (pageLoading) {
    return <PageLoading />;
  }

  if (error && !clientId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            Unable to load job card
          </p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <Link href="/job-cards">
            <Button variant="outline" className="mt-4">
              Back to List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/job-cards/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Job Card</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Client & Site Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client */}
              <div className="space-y-2">
                <Label htmlFor="client">
                  Client <span className="text-red-500">*</span>
                </Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
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
                  disabled={!clientId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        clientId ? "Select a site" : "Select a client first"
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

              {/* Contact */}
              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Select
                  value={contactId}
                  onValueChange={setContactId}
                  disabled={!clientId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        clientId
                          ? "Select a contact"
                          : "Select a client first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact._id} value={contact._id}>
                        {contact.firstName} {contact.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title / Category */}
              <div className="space-y-2">
                <Label htmlFor="title">Title / Category</Label>
                <Select value={titleId} onValueChange={setTitleId}>
                  <SelectTrigger>
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

              {/* Job Card Type */}
              <div className="space-y-2">
                <Label htmlFor="jobCardType">Job Card Type</Label>
                <Select
                  value={jobCardTypeId}
                  onValueChange={setJobCardTypeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobCardTypes.map((type) => (
                      <SelectItem key={type._id} value={type._id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the job..."
                  rows={4}
                />
              </div>

              {/* Technician Briefing */}
              <div className="space-y-2">
                <Label htmlFor="techBriefing">Technician Briefing</Label>
                <Textarea
                  id="techBriefing"
                  value={technicianBriefing}
                  onChange={(e) => setTechnicianBriefing(e.target.value)}
                  placeholder="Briefing notes for the technician..."
                  rows={3}
                />
              </div>

              {/* Job Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobDate">Job Date</Label>
                  <Input
                    id="jobDate"
                    type="date"
                    value={jobDate}
                    onChange={(e) => setJobDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobEndDate">Job End Date</Label>
                  <Input
                    id="jobEndDate"
                    type="date"
                    value={jobEndDate}
                    onChange={(e) => setJobEndDate(e.target.value)}
                    disabled={!multiDayJob}
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="multiDayJob"
                    checked={multiDayJob}
                    onCheckedChange={(checked) =>
                      setMultiDayJob(checked === true)
                    }
                  />
                  <Label htmlFor="multiDayJob" className="cursor-pointer">
                    Multi-day Job
                  </Label>
                </div>
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
              </div>

              {/* Recurring Job */}
              <div className="space-y-3 rounded-[10px] border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="recurringJob"
                    checked={recurringJob}
                    onCheckedChange={(checked) =>
                      setRecurringJob(checked === true)
                    }
                  />
                  <Label htmlFor="recurringJob" className="cursor-pointer">
                    Recurring Job
                  </Label>
                </div>

                {recurringJob && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recurringPeriod">Period</Label>
                      <Input
                        id="recurringPeriod"
                        type="number"
                        min="1"
                        value={recurringPeriod}
                        onChange={(e) => setRecurringPeriod(e.target.value)}
                        placeholder="e.g. 2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recurringRange">Range</Label>
                      <Select
                        value={recurringRange}
                        onValueChange={setRecurringRange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Link href={`/job-cards/${id}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={!clientId || submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
