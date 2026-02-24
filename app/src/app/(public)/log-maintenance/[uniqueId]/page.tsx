"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Wrench, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PublicLogMaintenancePage() {
  const params = useParams();
  const uniqueId = params.uniqueId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [selectedTask, setSelectedTask] = useState("");
  const [taskName, setTaskName] = useState("");
  const [notes, setNotes] = useState("");
  const [taskDate, setTaskDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/log-maintenance/${uniqueId}`);
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

  const handleTaskSelect = (value: string) => {
    setSelectedTask(value);
    // Auto-fill task name from the selected task
    const task = data?.maintenanceTasks?.find((t: any) => t._id === value);
    if (task) {
      setTaskName(task.title);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() && !selectedTask) {
      setError("Please select a task or enter a task name");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/public/log-maintenance/${uniqueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: selectedTask || undefined,
          taskName: taskName.trim() || undefined,
          notes: notes.trim() || undefined,
          taskDate: taskDate || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
      } else {
        setError(json.error || "Failed to log maintenance");
      }
    } catch {
      setError("Failed to log maintenance");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading />;

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 sm:py-20">
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Maintenance Logged Successfully
          </h2>
          <p className="text-gray-600 mb-6">
            The maintenance entry has been recorded for this asset.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                setSubmitted(false);
                setSelectedTask("");
                setTaskName("");
                setNotes("");
                setTaskDate(new Date().toISOString().split("T")[0]);
              }}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Log Another Entry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { asset, maintenanceTasks } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
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
            Log Maintenance
          </h1>
          <p className="text-sm text-gray-500">
            {asset?.machineName || "Asset"}
            {asset?.serialNo ? ` - ${asset.serialNo}` : ""}
          </p>
        </div>
      </div>

      {/* Asset Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
            <div>
              <span className="text-gray-500">Site:</span>{" "}
              <span className="font-medium">
                {asset?.clientSiteId?.siteName || "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-gray-400" />
            Maintenance Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Task Select */}
            {maintenanceTasks && maintenanceTasks.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="task">Task</Label>
                <Select value={selectedTask} onValueChange={handleTaskSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a predefined task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceTasks.map((task: any) => (
                      <SelectItem key={task._id} value={task._id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Task Name */}
            <div className="space-y-2">
              <Label htmlFor="taskName">Task Name</Label>
              <Input
                id="taskName"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Enter task name..."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={4}
              />
            </div>

            {/* Task Date */}
            <div className="space-y-2">
              <Label htmlFor="taskDate">Task Date</Label>
              <Input
                id="taskDate"
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[10px] text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button type="submit" disabled={submitting} size="lg" className="w-full">
              {submitting ? (
                "Saving..."
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Log Maintenance
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">Powered by Total Spray Care</p>
      </div>
    </div>
  );
}
