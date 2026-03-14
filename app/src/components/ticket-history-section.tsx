"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TicketHistorySectionProps {
  /** Current ticket/job card ID to exclude from results */
  currentId: string;
  /** Asset ID for the "Asset" tab filter */
  assetId?: string;
  /** Site ID for the "Site" tab filter */
  siteId?: string;
  /** API list endpoint, e.g. "/api/support-tickets" or "/api/job-cards" */
  apiListUrl: string;
  /** Detail page path prefix, e.g. "/support-tickets" or "/job-cards" */
  detailPathPrefix: string;
  /** Status labels map, e.g. TICKET_STATUS_LABELS or JOB_CARD_STATUS_LABELS */
  statusLabels: Record<number, string>;
  /** Field name for the status value in the ticket object */
  statusField?: string;
}

export function TicketHistorySection({
  currentId,
  assetId,
  siteId,
  apiListUrl,
  detailPathPrefix,
  statusLabels,
  statusField = "ticketStatus",
}: TicketHistorySectionProps) {
  const [historyTab, setHistoryTab] = useState<"asset" | "site">("asset");
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const filterParam = historyTab === "asset"
      ? assetId ? `clientAssetId=${assetId}` : null
      : siteId ? `clientSiteId=${siteId}` : null;

    if (!filterParam) {
      setHistoryTickets([]);
      return;
    }

    async function fetchHistory() {
      setHistoryLoading(true);
      try {
        const res = await fetch(`${apiListUrl}?${filterParam}&limit=20`);
        const json = await res.json();
        if (json.success) {
          const raw = json.data?.data || json.data || [];
          setHistoryTickets(
            (Array.isArray(raw) ? raw : []).filter((t: any) => String(t._id) !== currentId)
          );
        }
      } catch {
        setHistoryTickets([]);
      } finally {
        setHistoryLoading(false);
      }
    }

    fetchHistory();
  }, [historyTab, assetId, siteId, apiListUrl, currentId]);

  return (
    <div className="rounded-[10px] border border-gray-200 bg-white p-10">
      <h3 className="mb-4 text-[15px] font-bold text-gray-900">Ticket History</h3>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setHistoryTab("asset")}
            className={`whitespace-nowrap border-b-2 text-sm font-normal cursor-pointer transition-colors ${
              historyTab === "asset"
                ? "border-[#00AEEF] text-[#00AEEF]"
                : "border-transparent text-gray-900 hover:border-gray-300"
            }`}
            style={{ lineHeight: "30px", paddingLeft: 25, paddingRight: 25, fontSize: 14 }}
          >
            Asset
          </button>
          <button
            onClick={() => setHistoryTab("site")}
            className={`whitespace-nowrap border-b-2 text-sm font-normal cursor-pointer transition-colors ${
              historyTab === "site"
                ? "border-[#00AEEF] text-[#00AEEF]"
                : "border-transparent text-gray-900 hover:border-gray-300"
            }`}
            style={{ lineHeight: "30px", paddingLeft: 25, paddingRight: 25, fontSize: 14 }}
          >
            Site
          </button>
        </nav>
      </div>

      {historyLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : historyTickets.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          No previous tickets found for this {historyTab}
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {historyTickets.map((t: any) => (
            <div key={t._id} className="flex items-center gap-3 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  {t.description || (historyTab === "asset" ? t.clientAssetId?.machineName : t.clientSiteId?.siteName) || ""}
                </p>
              </div>
              <p className="text-sm text-gray-500 whitespace-nowrap shrink-0">
                {formatDate(t.createdAt)}
              </p>
              <span className="inline-block rounded-[10px] px-3 py-1.5 text-xs font-medium bg-cyan-500 text-white whitespace-nowrap shrink-0">
                {statusLabels[t[statusField]] || "Unknown"}
              </span>
              <Link href={`${detailPathPrefix}/${t._id}`} className="shrink-0 text-gray-400 hover:text-cyan-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
