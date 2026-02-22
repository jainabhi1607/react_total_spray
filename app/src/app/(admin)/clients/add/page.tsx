"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function AddClientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    address: "",
    abn: "",
    singleSite: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.companyName.trim()) {
      setError("Company name is required");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          address: formData.address.trim(),
          abn: formData.abn.trim(),
          singleSite: formData.singleSite ? 1 : 0,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to create client");
      }

      const newClient = json.data;
      router.push(`/clients/${newClient._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Client</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new client account
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Company Name */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="companyName">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              {/* ABN */}
              <div className="space-y-2">
                <Label htmlFor="abn">ABN</Label>
                <Input
                  id="abn"
                  placeholder="Enter ABN"
                  value={formData.abn}
                  onChange={(e) => handleChange("abn", e.target.value)}
                />
              </div>

              {/* Single Site */}
              <div className="space-y-2">
                <Label>Single Site</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="singleSite"
                    checked={formData.singleSite}
                    onCheckedChange={(checked) =>
                      handleChange("singleSite", checked === true)
                    }
                  />
                  <Label htmlFor="singleSite" className="font-normal cursor-pointer">
                    This client has a single site only
                  </Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Creating..." : "Create Client"}
              </Button>
              <Link href="/clients">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
