"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserGroupsPage() {
  useEffect(() => { document.title = "TSC - User Groups"; }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">User Groups</h1>

      <Card>
        <CardContent className="py-12">
          <p className="text-center text-sm text-gray-500">
            User groups management coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
