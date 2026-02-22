"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Send, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PublicSupportPage() {
  const params = useParams();
  const accessToken = params.accessToken as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNo, setTicketNo] = useState<number | null>(null);

  // Form state
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedTitleId, setSelectedTitleId] = useState("");
  const [description, setDescription] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/support/${accessToken}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Invalid access link");
      }
    } catch {
      setError("Failed to load form data");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter assets by selected site
  const filteredAssets =
    data?.assets?.filter(
      (a: any) => !selectedSiteId || a.clientSiteId === selectedSiteId
    ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/public/support/${accessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSiteId: selectedSiteId || undefined,
          clientAssetId: selectedAssetId || undefined,
          clientContactId: selectedContactId || undefined,
          titleId: selectedTitleId || undefined,
          description: description.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
        setTicketNo(json.data.ticketNo);
      } else {
        setError(json.error || "Failed to submit ticket");
      }
    } catch {
      setError("Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading />;

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 sm:py-20">
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank you!</h2>
          <p className="text-gray-600 mb-2">
            Your support ticket has been submitted successfully.
          </p>
          {ticketNo && (
            <p className="text-lg font-semibold text-blue-600">
              Ticket #{ticketNo}
            </p>
          )}
          <p className="text-sm text-gray-400 mt-6">
            Our team will review your request and get back to you as soon as possible.
          </p>
        </div>
      </div>
    );
  }

  const { client, sites, contacts, titles } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src="/logo.jpg"
          alt="Total Spray Care"
          width={56}
          height={56}
          className="rounded-xl"
        />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {client?.companyName || "Support"}
          </h1>
          <p className="text-sm text-gray-500">Submit a Support Ticket</p>
        </div>
      </div>

      {/* Support Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Support Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Site */}
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Select value={selectedSiteId} onValueChange={(val) => {
                setSelectedSiteId(val);
                setSelectedAssetId("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site..." />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site: any) => (
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
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an asset..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredAssets.map((asset: any) => (
                    <SelectItem key={asset._id} value={asset._id}>
                      {asset.machineName}
                      {asset.serialNo ? ` (${asset.serialNo})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label htmlFor="contact">Contact</Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact: any) => (
                    <SelectItem key={contact._id} value={contact._id}>
                      {contact.name}
                      {contact.lastName ? ` ${contact.lastName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title / Category */}
            <div className="space-y-2">
              <Label htmlFor="title">Category</Label>
              <Select value={selectedTitleId} onValueChange={setSelectedTitleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {titles?.map((title: any) => (
                    <SelectItem key={title._id} value={title._id}>
                      {title.title}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue or request..."
                rows={5}
                required
              />
            </div>

            {/* Supporting Evidence Placeholders */}
            <div className="space-y-2">
              <Label>Supporting Evidence</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-6 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-400">Upload file {n}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" disabled={submitting} size="lg" className="w-full">
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Support Ticket
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">Powered by Total Spray Care</p>
      </div>
    </div>
  );
}
