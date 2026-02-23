"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddClientDialog } from "@/components/dialogs/add-client-dialog";

export default function AddClientPage() {
  useEffect(() => { document.title = "TSC - Add Client"; }, []);
  const router = useRouter();
  const [open, setOpen] = useState(true);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) router.push("/clients");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Client</h1>
      </div>

      <AddClientDialog
        open={open}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
}
