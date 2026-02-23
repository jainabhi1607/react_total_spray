"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineLoading } from "@/components/ui/loading";

interface TechnicianForm {
  companyName: string;
  email: string;
  phone: string;
  abn: string;
  licenceNumber: string;
  licenceExpiry: string;
  address: string;
}

const initialForm: TechnicianForm = {
  companyName: "",
  email: "",
  phone: "",
  abn: "",
  licenceNumber: "",
  licenceExpiry: "",
  address: "",
};

export default function AddTechnicianPage() {
  useEffect(() => { document.title = "TSC - Add Technician"; }, []);
  const router = useRouter();
  const [form, setForm] = useState<TechnicianForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim()) {
      setError("Company Name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create technician");
      }

      const newId = json.data?._id || json.data?.id;
      router.push(`/technicians/${newId}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/technicians">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Technician</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="04XX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abn">ABN / GST No.</Label>
                <Input
                  id="abn"
                  name="abn"
                  value={form.abn}
                  onChange={handleChange}
                  placeholder="XX XXX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenceNumber">Licence Number</Label>
                <Input
                  id="licenceNumber"
                  name="licenceNumber"
                  value={form.licenceNumber}
                  onChange={handleChange}
                  placeholder="Licence number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenceExpiry">Licence Expiry</Label>
                <Input
                  id="licenceExpiry"
                  name="licenceExpiry"
                  type="date"
                  value={form.licenceExpiry}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Full address"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/technicians">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <InlineLoading />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Technician
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
