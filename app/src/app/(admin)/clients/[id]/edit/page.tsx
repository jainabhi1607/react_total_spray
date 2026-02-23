"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { AddClientDialog } from "@/components/dialogs/add-client-dialog";

interface ClientData {
  _id: string;
  companyName: string;
  abn?: string;
  address?: string;
  singleSite?: number;
  status?: number;
}

export default function EditClientPage() {
  useEffect(() => { document.title = "TSC - Edit Client"; }, []);
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load client");
        setClient(json.data);
      } catch (err: any) {
        setError(err.message || "Failed to load client");
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [clientId]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) router.push(`/clients/${clientId}`);
  }

  if (loading) return <PageLoading />;

  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/clients/${clientId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
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
      <div className="flex items-center gap-4">
        <Link href={`/clients/${clientId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
      </div>

      <AddClientDialog
        open={open}
        onOpenChange={handleOpenChange}
        client={client}
      />
    </div>
  );
}
