"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Clock, AlertCircle, Calendar } from "lucide-react";
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
import { PageLoading } from "@/components/ui/loading";
import { formatDate } from "@/lib/utils";

export default function PublicHistoryPage() {
  const params = useParams();
  const uniqueId = params.uniqueId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/history/${uniqueId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to load history");
      }
    } catch {
      setError("Failed to load history");
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
        <p className="text-gray-500">{error || "Failed to load history"}</p>
      </div>
    );
  }

  const { asset, maintenanceLogs } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Image
          src="/logo.jpg"
          alt="Total Spray Care"
          width={56}
          height={56}
          className="rounded-[10px]"
        />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Maintenance History
          </h1>
          <p className="text-sm text-gray-500">
            {asset?.machineName || "Asset"}
            {asset?.serialNo ? ` - Serial: ${asset.serialNo}` : ""}
          </p>
        </div>
      </div>

      {/* Asset Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Machine:</span>{" "}
              <span className="font-medium">{asset?.machineName}</span>
            </div>
            <div>
              <span className="text-gray-500">Serial #:</span>{" "}
              <span className="font-medium">{asset?.serialNo || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Client:</span>{" "}
              <span className="font-medium">
                {asset?.clientId?.companyName || "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">History</CardTitle>
            <Badge variant="secondary">
              {maintenanceLogs?.length || 0} entries
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {maintenanceLogs && maintenanceLogs.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceLogs.map((log: any) => (
                      <TableRow key={log._id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {log.taskDate ? formatDate(log.taskDate) : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.task || "-"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {log.taskName || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {log.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Timeline */}
              <div className="sm:hidden space-y-4">
                {maintenanceLogs.map((log: any) => (
                  <div
                    key={log._id}
                    className="border-l-2 border-blue-200 pl-4 pb-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {log.taskDate ? formatDate(log.taskDate) : "N/A"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {log.taskName || log.task || "Maintenance"}
                    </p>
                    {log.notes && (
                      <p className="text-sm text-gray-500 mt-1">{log.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No Maintenance History
              </h3>
              <p className="text-sm text-gray-400">
                No maintenance entries have been recorded for this asset yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">Powered by Total Spray Care</p>
      </div>
    </div>
  );
}
