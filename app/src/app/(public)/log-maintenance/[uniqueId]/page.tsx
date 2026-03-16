"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageLoading } from "@/components/ui/loading";

export default function PublicLogMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const uniqueId = params.uniqueId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Job Cards";
  }, []);

  // Form state
  const [selectedTask, setSelectedTask] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) {
      setError("Please select a task");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const task = data?.maintenanceTasks?.find((t: any) => t._id === selectedTask);
      const res = await fetch(`/api/public/log-maintenance/${uniqueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: selectedTask || undefined,
          taskName: task?.title || undefined,
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Maintenance Logged Successfully
        </h2>
        <p className="text-gray-600 mb-6">
          The maintenance entry has been recorded for this asset.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setSubmitted(false);
              setSelectedTask("");
              setNotes("");
              setTaskDate(new Date().toISOString().split("T")[0]);
            }}
            className="bg-[#00AEEF] hover:bg-[#0098d4] text-white"
          >
            Log Another Entry
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/client-asset/${uniqueId}`)}
          >
            Back to Asset
          </Button>
        </div>
      </div>
    );
  }

  const { asset, maintenanceTasks } = data;
  const makeName = asset?.assetMakeId?.title;
  const modelName = asset?.assetModelId?.title;
  const makeModel = [modelName, makeName].filter(Boolean).join(" - ");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dark Header */}
      <div className="bg-[#2B3540] text-white" style={{ height: 114 }}>
        <div className="max-w-4xl mx-auto px-6 h-full grid grid-cols-3 items-center">
          <div>
            <Image
              src="/logo.svg"
              alt="Total Spray Care"
              width={124}
              height={40}
              className="shrink-0"
            />
          </div>
          <div className="text-center">
            <p className="text-base font-bold">{asset?.machineName || "Asset"}</p>
            <p className="text-sm text-gray-400">{asset?.clientSiteId?.siteName || ""}</p>
            {makeModel && <p className="text-sm text-gray-400">{makeModel}</p>}
          </div>
          <div className="flex justify-end">
            {asset?.image ? (
              <img
                src={asset.image}
                alt={asset.machineName}
                className="h-12 w-12 object-cover rounded-[10px] border border-gray-600"
              />
            ) : (
              <div className="h-12 w-12 rounded-[10px] border border-gray-600 bg-gray-700" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Back */}
        <button
          onClick={() => router.push(`/client-asset/${uniqueId}`)}
          className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 cursor-pointer mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Log Maintenance</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Task */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Task</label>
            <select
              className="w-full h-10 rounded-[10px] border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
            >
              <option value="">Select Task</option>
              {maintenanceTasks?.map((task: any) => (
                <option key={task._id} value={task._id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder=""
              rows={5}
              className="rounded-[10px]"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Date</label>
            <input
              type="date"
              className="w-full h-10 rounded-[10px] border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-[#00AEEF] hover:bg-[#0098d4] text-white text-base font-semibold rounded-[10px]"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Submit Maintenance Log"
            )}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-8">
        <div className="bg-gray-100 px-6 py-5">
          <p className="text-sm text-gray-700 font-medium">Have any questions?</p>
          <p className="text-sm text-gray-600 mt-1">
            Reach out to TSC today at{" "}
            <a href="tel:0397975555" className="underline font-medium text-gray-800">03 9797 5555</a>
            {" "}or
          </p>
          <p className="text-sm text-gray-600">
            email us at{" "}
            <a href="mailto:service@totalsprayboothcare.com" className="underline font-medium text-gray-800">
              service@totalsprayboothcare.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
