"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Site {
  _id: string;
  siteName: string;
  address?: string;
  siteId?: string;
  assetCount: number;
}

export default function SitesPage() {
  useEffect(() => { document.title = "TSC - Sites"; }, []);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch("/api/portal/sites");
        const json = await res.json();
        if (json.success) {
          setSites(json.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchSites();
  }, []);

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sites ({sites.length})</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          {sites.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No sites found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Site ID</TableHead>
                  <TableHead>Assets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow key={site._id}>
                    <TableCell className="font-medium">{site.siteName}</TableCell>
                    <TableCell className="text-gray-500">{site.address || "-"}</TableCell>
                    <TableCell className="text-gray-500">{site.siteId || "-"}</TableCell>
                    <TableCell>{site.assetCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
