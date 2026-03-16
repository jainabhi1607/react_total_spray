"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function PortalSettingsPage() {
  useEffect(() => { document.title = "TSC - Settings"; }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <CardContent className="py-12">
          <p className="text-center text-sm text-gray-500">
            Portal settings coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
