"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Wrench,
  LifeBuoy,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoading } from "@/components/ui/loading";
import { formatDate } from "@/lib/utils";

export default function PublicClientAssetPage() {
  const params = useParams();
  const uniqueId = params.uniqueId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/client-asset/${uniqueId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to load asset");
      }
    } catch {
      setError("Failed to load asset");
    } finally {
      setLoading(false);
    }
  }, [uniqueId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <PageLoading />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500">{error || "Asset not found"}</p>
      </div>
    );
  }

  const { asset, attachments, comments, maintenanceLogs } = data;
  const clientAccessToken = asset.clientId?.accessToken;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
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
            {asset.clientId?.companyName || "Asset Portal"}
          </h1>
          <p className="text-sm text-gray-500">Asset Details</p>
        </div>
      </div>

      {/* Asset Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Asset Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Machine Name:</span>{" "}
              <span className="font-medium">{asset.machineName}</span>
            </div>
            <div>
              <span className="text-gray-500">Serial #:</span>{" "}
              <span className="font-medium">{asset.serialNo || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Client:</span>{" "}
              <span className="font-medium">
                {asset.clientId?.companyName || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Site:</span>{" "}
              <span className="font-medium">
                {asset.clientSiteId?.siteName || "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link href={`/log-maintenance/${uniqueId}`}>
          <Button>
            <Wrench className="h-4 w-4 mr-2" />
            Log Maintenance
          </Button>
        </Link>
        {clientAccessToken && (
          <Link href={`/support/${clientAccessToken}`}>
            <Button variant="outline">
              <LifeBuoy className="h-4 w-4 mr-2" />
              Request Support
            </Button>
          </Link>
        )}
        <Link href={`/history/${uniqueId}`}>
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Full History
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="maintenance" className="w-full">
        <TabsList>
          <TabsTrigger value="maintenance" className="flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Maintenance Log</span>
            <span className="sm:hidden">Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-1.5">
            <LifeBuoy className="h-3.5 w-3.5" />
            <span>Support</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        {/* Maintenance Log Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Maintenance</CardTitle>
                <Badge variant="secondary">{maintenanceLogs?.length || 0} entries</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {maintenanceLogs && maintenanceLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead className="hidden sm:table-cell">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceLogs.slice(0, 10).map((log: any) => (
                      <TableRow key={log._id}>
                        <TableCell className="text-sm">
                          {log.taskDate ? formatDate(log.taskDate) : "N/A"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {log.taskName || log.task || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 hidden sm:table-cell">
                          {log.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No maintenance entries yet</p>
                  <Link href={`/log-maintenance/${uniqueId}`}>
                    <Button variant="link" className="mt-2">
                      Log first maintenance
                    </Button>
                  </Link>
                </div>
              )}
              {maintenanceLogs && maintenanceLogs.length > 10 && (
                <div className="mt-4 text-center">
                  <Link href={`/history/${uniqueId}`}>
                    <Button variant="link">View all {maintenanceLogs.length} entries</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <LifeBuoy className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">
                  Need help with this asset? Submit a support ticket.
                </p>
                {clientAccessToken ? (
                  <Link href={`/support/${clientAccessToken}`}>
                    <Button>
                      <LifeBuoy className="h-4 w-4 mr-2" />
                      Submit Support Ticket
                    </Button>
                  </Link>
                ) : (
                  <p className="text-xs text-gray-400">
                    Contact your administrator to get a support access link.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceLogs && maintenanceLogs.length > 0 ? (
                <div className="space-y-4">
                  {maintenanceLogs.map((log: any) => (
                    <div
                      key={log._id}
                      className="flex gap-4 border-l-2 border-blue-200 pl-4 pb-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {log.taskName || log.task || "Maintenance"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {log.taskDate ? formatDate(log.taskDate) : ""}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-sm text-gray-500">{log.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">Powered by Total Spray Care</p>
      </div>
    </div>
  );
}
