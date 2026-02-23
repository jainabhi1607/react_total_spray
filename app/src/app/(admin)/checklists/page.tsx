"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChecklistTemplatesSection } from "@/components/settings/checklist-templates-section";

export default function ChecklistsPage() {
  useEffect(() => {
    document.title = "TSC - Checklists";
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Checklist</h1>
      </div>
      <ChecklistTemplatesSection />
    </div>
  );
}
