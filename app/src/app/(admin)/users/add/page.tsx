"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineLoading } from "@/components/ui/loading";
import { ROLE_LABELS } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientOption {
  _id: string;
  companyName: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AddUserPage() {
  useEffect(() => { document.title = "TSC - Add User"; }, []);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);

  const [form, setForm] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    position: "",
    role: "",
    clientId: "",
  });

  const needsClient = form.role === "4" || form.role === "6";

  useEffect(() => {
    if (needsClient && clients.length === 0) {
      (async () => {
        try {
          const res = await fetch("/api/clients");
          const json = await res.json();
          if (json.success) setClients(json.data?.data || json.data || []);
        } catch {}
      })();
    }
  }, [needsClient, clients.length]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.role) {
      setError("Email, password, and role are required.");
      return;
    }
    if (needsClient && !form.clientId) {
      setError("Please select a client for this role.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const body: Record<string, any> = {
        name: form.name,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        position: form.position,
        role: Number(form.role),
      };
      if (needsClient) body.clientId = form.clientId;

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to create user");

      const newId = json.data?._id || json.data?.id;
      router.push(newId ? `/users/${newId}` : "/users");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/users">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add User</h1>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-gray-500" />
            User Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">First Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+61 400 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={form.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  placeholder="Manager"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsClient && (
                <div className="space-y-2">
                  <Label>
                    Client <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.clientId}
                    onValueChange={(v) => handleChange("clientId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/users">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <InlineLoading /> : <Save className="h-4 w-4" />}
                Create User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
