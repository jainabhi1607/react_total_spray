"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";

export default function PublicClientAssetPage() {
  const params = useParams();
  const uniqueId = params.uniqueId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [imageOpen, setImageOpen] = useState(false);

  useEffect(() => {
    document.title = "Job Cards";
  }, []);

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

  const { asset } = data;
  const clientAccessToken = asset.clientId?.accessToken;
  const makeName = asset.assetMakeId?.title;
  const modelName = asset.assetModelId?.title;
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
            <p className="text-base font-bold">{asset.machineName || "Asset"}</p>
            <p className="text-sm text-gray-400">{asset.clientSiteId?.siteName || ""}</p>
            {makeModel && <p className="text-sm text-gray-400">{makeModel}</p>}
          </div>
          <div className="flex justify-end">
            {asset.image ? (
              <img
                src={asset.image}
                alt={asset.machineName}
                className="h-12 w-12 object-cover rounded-[10px] border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setImageOpen(true)}
              />
            ) : (
              <div className="h-12 w-12 rounded-[10px] border border-gray-600 bg-gray-700" />
            )}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="px-6 pt-8" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Log Maintenance */}
        <Link href={`/log-maintenance/${uniqueId}`}>
          <div className="bg-[#00AEEF] rounded-[10px] px-6 py-5 flex items-center gap-4 text-white cursor-pointer hover:opacity-90 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"/><path d="m8 6 2-2"/><path d="m18 16 2-2"/><path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
            <span className="text-base font-semibold">Log Maintenance</span>
          </div>
        </Link>

        {/* Request Support */}
        {clientAccessToken ? (
          <Link href={`/support/${clientAccessToken}?assetId=${asset._id}&siteId=${asset.clientSiteId?._id || ""}`}>
            <div className="bg-[#00AEEF] rounded-[10px] px-6 py-5 flex items-center gap-4 text-white cursor-pointer hover:opacity-90 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <span className="text-base font-semibold">Request Support</span>
            </div>
          </Link>
        ) : (
          <div className="bg-[#00AEEF] rounded-[10px] px-6 py-5 flex items-center gap-4 text-white opacity-50 cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            <span className="text-base font-semibold">Request Support</span>
          </div>
        )}

        {/* History */}
        <Link href={`/history/${uniqueId}`}>
          <div className="bg-[#00AEEF] rounded-[10px] px-6 py-5 flex items-center gap-4 text-white cursor-pointer hover:opacity-90 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            <span className="text-base font-semibold">History</span>
          </div>
        </Link>
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

      {/* Image Popup */}
      {imageOpen && asset.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setImageOpen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={asset.image}
              alt={asset.machineName}
              className="max-w-full max-h-[90vh] object-contain rounded-[10px]"
            />
            <button
              onClick={() => setImageOpen(false)}
              className="absolute -top-3 -right-3 h-8 w-8 flex items-center justify-center rounded-full bg-white text-gray-800 text-lg font-bold shadow cursor-pointer hover:bg-gray-100"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
