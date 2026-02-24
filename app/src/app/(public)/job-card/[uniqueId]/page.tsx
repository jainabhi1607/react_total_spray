"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Save, Star, AlertCircle, CheckCircle2, Calendar, FileText, Hash, PenLine, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { formatDate } from "@/lib/utils";

const JOB_CARD_STATUS_LABELS: Record<number, string> = {
  0: "Draft",
  1: "Open",
  2: "In Progress",
  3: "Completed",
  4: "Cancelled",
};

const JOB_CARD_STATUS_VARIANT: Record<number, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  0: "secondary",
  1: "default",
  2: "warning",
  3: "success",
  4: "destructive",
};

interface ChecklistResponse {
  itemId: string;
  responseType1?: number;
  responseType2?: any;
  responseType7?: number;
  responseType10?: number;
  comments?: string;
  markAsDone?: number;
  signature?: string;
  signatureDateTime?: string;
  setDateTime?: string;
}

export default function PublicJobCardPage() {
  const params = useParams();
  const uniqueId = params.uniqueId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, ChecklistResponse>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/job-card/${uniqueId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Initialize responses from existing data
        const initialResponses: Record<string, ChecklistResponse> = {};
        json.data.assets?.forEach((asset: any) => {
          asset.checklistItems?.forEach((item: any) => {
            initialResponses[item._id] = {
              itemId: item._id,
              responseType1: item.responseType1,
              responseType2: item.responseType2,
              responseType7: item.responseType7,
              responseType10: item.responseType10,
              comments: item.comments || "",
              markAsDone: item.markAsDone,
              signature: item.signature,
              signatureDateTime: item.signatureDateTime,
              setDateTime: item.setDateTime,
            };
          });
        });
        setResponses(initialResponses);
      } else {
        setError(json.error || "Failed to load job card");
      }
    } catch {
      setError("Failed to load job card");
    } finally {
      setLoading(false);
    }
  }, [uniqueId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateResponse = (itemId: string, field: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        itemId,
        [field]: value,
      },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const items = Object.values(responses);
      const res = await fetch(`/api/public/job-card/${uniqueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
      } else {
        setError(json.error || "Failed to save responses");
      }
    } catch {
      setError("Failed to save responses");
    } finally {
      setSaving(false);
    }
  };

  const renderChecklistInput = (item: any) => {
    const itemId = item._id;
    const response = responses[itemId] || {};

    switch (item.checklistItemType) {
      case 1: // Yes/No
        return (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`radio-${itemId}`}
                checked={response.responseType1 === 1}
                onChange={() => updateResponse(itemId, "responseType1", 1)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`radio-${itemId}`}
                checked={response.responseType1 === 0}
                onChange={() => updateResponse(itemId, "responseType1", 0)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        );

      case 2: // Text
        return (
          <Input
            value={response.responseType2 || ""}
            onChange={(e) => updateResponse(itemId, "responseType2", e.target.value)}
            placeholder="Enter response..."
          />
        );

      case 3: // Number
        return (
          <Input
            type="number"
            value={response.responseType2 || ""}
            onChange={(e) => updateResponse(itemId, "responseType2", e.target.value)}
            placeholder="Enter number..."
          />
        );

      case 4: // Photo
        return (
          <div className="flex items-center gap-3 rounded-[10px] border border-dashed border-gray-300 p-4 bg-gray-50">
            <ImageIcon className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-600">Photo Upload</p>
              <p className="text-xs text-gray-400">Photo upload available on mobile app</p>
            </div>
          </div>
        );

      case 5: // Signature
        return (
          <div className="rounded-[10px] border border-dashed border-gray-300 p-6 bg-gray-50 text-center">
            <PenLine className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Sign here</p>
            <p className="text-xs text-gray-400 mt-1">Signature capture available on mobile app</p>
          </div>
        );

      case 6: // Date
        return (
          <Input
            type="date"
            value={response.setDateTime ? new Date(response.setDateTime).toISOString().split("T")[0] : ""}
            onChange={(e) => updateResponse(itemId, "setDateTime", e.target.value)}
          />
        );

      case 7: // Checkbox
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={response.responseType7 === 1}
              onCheckedChange={(checked) =>
                updateResponse(itemId, "responseType7", checked ? 1 : 0)
              }
            />
            <span className="text-sm text-gray-600">Mark as completed</span>
          </div>
        );

      case 10: // Rating
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => updateResponse(itemId, "responseType10", star)}
                className="p-1 transition-colors"
              >
                <Star
                  className={`h-6 w-6 ${
                    (response.responseType10 || 0) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        );

      default:
        return (
          <Input
            value={response.responseType2 || ""}
            onChange={(e) => updateResponse(itemId, "responseType2", e.target.value)}
            placeholder="Enter response..."
          />
        );
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

  const { jobCard, jobCardDetail, assets } = data;

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Total Spray Care</h1>
          <p className="text-sm text-gray-500">Job Card</p>
        </div>
      </div>

      {/* Job Card Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">
              Job Card #{jobCard.ticketNo || "N/A"}
            </CardTitle>
            <Badge variant={JOB_CARD_STATUS_VARIANT[jobCard.jobCardStatus] || "secondary"}>
              {JOB_CARD_STATUS_LABELS[jobCard.jobCardStatus] || "Unknown"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Client:</span>{" "}
              <span className="font-medium">{jobCard.clientId?.companyName || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Site:</span>{" "}
              <span className="font-medium">{jobCard.clientSiteId?.siteName || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Contact:</span>{" "}
              <span className="font-medium">{jobCard.clientContactId?.name || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Job Date:</span>{" "}
              <span className="font-medium">
                {jobCard.jobDate ? formatDate(jobCard.jobDate) : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {jobCardDetail?.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {jobCardDetail.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assets & Checklists */}
      {assets && assets.length > 0 && (
        <div className="space-y-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Assets & Checklists</h2>

          {assets.map((asset: any) => (
            <Card key={asset._id}>
              <CardHeader className="bg-gray-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-base">
                      {asset.clientAssetId?.machineName || "Unknown Asset"}
                    </CardTitle>
                    {asset.clientAssetId?.serialNo && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Serial: {asset.clientAssetId.serialNo}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {asset.checklistItems && asset.checklistItems.length > 0 ? (
                  <div className="space-y-6">
                    {asset.checklistItems.map((item: any, idx: number) => (
                      <div
                        key={item._id}
                        className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Label className="text-sm font-medium text-gray-800">
                            {idx + 1}. {item.details || "Checklist Item"}
                            {item.makeResponseMandatory === 1 && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>
                        </div>

                        <div className="mt-2">{renderChecklistInput(item)}</div>

                        <div className="mt-3">
                          <Textarea
                            placeholder="Add comments..."
                            value={responses[item._id]?.comments || ""}
                            onChange={(e) =>
                              updateResponse(item._id, "comments", e.target.value)
                            }
                            className="text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No checklist items for this asset
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Save Button */}
      <div className="sticky bottom-4 flex justify-center">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="shadow-lg px-8"
        >
          {saving ? (
            "Saving..."
          ) : saved ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-1" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-1" />
              Save Responses
            </>
          )}
        </Button>
      </div>

      {error && data && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-[10px] text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">Powered by Total Spray Care</p>
      </div>
    </div>
  );
}
