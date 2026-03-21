"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

// --- Types ---

interface SiteData {
  _id: string;
  siteName: string;
  address?: string;
  siteId?: string;
  createdAt: string;
}

interface AssetData {
  _id: string;
  machineName: string;
  serialNo?: string;
  image?: string;
  clientSiteId?: any;
  assetMakeId?: { _id: string; title: string };
  assetModelId?: { _id: string; title: string };
  lastAction?: string | null;
}

interface ContactData {
  _id: string;
  name: string;
  lastName?: string;
  position?: string;
  email?: string;
  phone?: string;
}

// --- Page ---

export default function SiteDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [site, setSite] = useState<SiteData | null>(null);
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    document.title = site ? `TSC - ${site.siteName}` : "TSC - Sites";
  }, [site]);

  const fetchSite = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/sites/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load site");
      }
      setSite(json.data.site);
      setAssets(json.data.assets || []);
      setContacts(json.data.contacts || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSite();
  }, [fetchSite]);

  if (loading) return <PageLoading />;

  if (error || !site) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Unable to load site</p>
          <p className="mt-1 text-sm text-gray-500">{error || "Site not found"}</p>
          <Link href="/sites">
            <Button className="mt-4" variant="outline">Back to Sites</Button>
          </Link>
        </div>
      </div>
    );
  }

  const contactNames = contacts.map((c) => `${c.name}${c.lastName ? ` ${c.lastName}` : ""}`).join(", ");

  return (
    <div>
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <Link href="/sites">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-800 text-gray-800 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </div>
        </Link>
        <div>
          <h1 className="text-[26px] font-bold text-gray-900">{site.siteName}</h1>
          <p className="text-[13px] text-gray-500">Created: {formatDate(site.createdAt)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200" style={{ marginTop: 30, marginBottom: 30 }}>
        <div className="flex">
          {["Overview", "Assets", "Contacts"].map((tab) => {
            const tabKey = tab.toLowerCase();
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabKey)}
                className="relative transition-colors cursor-pointer"
                style={{
                  color: isActive ? "#00AEEF" : "#272D34",
                  lineHeight: "30px",
                  display: "inline-block",
                  fontSize: 14,
                  paddingLeft: 25,
                  paddingRight: 25,
                  fontWeight: "normal",
                  paddingBottom: 10,
                }}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00AEEF]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="rounded-[10px] border border-gray-200 bg-white p-10">
          {/* Site Name */}
          <div className="flex items-center justify-between py-4">
            <span className="text-[13px] text-gray-400">Site Name</span>
            <span className="text-[13px] font-medium text-gray-900">{site.siteName}</span>
          </div>
          <hr className="border-gray-200" />

          {/* Address */}
          <div className="flex items-center justify-between py-4">
            <span className="text-[13px] text-gray-400">Address</span>
            <span className="text-[13px] font-medium text-gray-900">{site.address || "-"}</span>
          </div>
          <hr className="border-gray-200" />

          {/* Site ID */}
          <div className="flex items-center justify-between py-4">
            <span className="text-[13px] text-gray-400">Site ID</span>
            <span className="text-[13px] font-medium text-gray-900">{site.siteId || "-"}</span>
          </div>
          <hr className="border-gray-200" />

          {/* No. of Assets */}
          <div className="flex items-center justify-between py-4">
            <span className="text-[13px] text-gray-400">No. of Assets</span>
            <span className="text-[13px] font-medium text-gray-900">{assets.length}</span>
          </div>
          <hr className="border-gray-200" />

          {/* Contacts */}
          <div className="flex items-start justify-between py-4">
            <span className="text-[13px] text-gray-400 shrink-0">Contacts</span>
            <span className="text-[13px] font-medium text-gray-900 text-right ml-8">
              {contactNames || "-"}
            </span>
          </div>
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === "assets" && (
        <div>
          {assets.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No assets found for this site.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => {
                const siteName = site.siteName || "";
                return (
                  <Link
                    key={asset._id}
                    href={`/assets/${asset._id}`}
                    className="rounded-[10px] border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow block"
                  >
                    {/* Image placeholder */}
                    <div className="h-[200px] bg-[#E8F7FD] flex items-center justify-center">
                      {asset.image ? (
                        <img
                          src={asset.image}
                          alt={asset.machineName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <p className="text-[13px] text-cyan-400">No picture added</p>
                      )}
                    </div>

                    {/* Asset info */}
                    <div className="p-5">
                      <p className="text-[14px] font-bold text-gray-900">{asset.machineName}</p>
                      <p className="text-[13px] text-cyan-500 mt-0.5">{siteName}</p>

                      <div className="flex gap-8 mt-4">
                        <div>
                          <p className="text-[12px] text-gray-400">Serial Number</p>
                          <p className="text-[13px] font-medium text-gray-900 mt-0.5">
                            {asset.serialNo || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[12px] text-gray-400">Last Action</p>
                          <p className="text-[13px] font-medium text-gray-900 mt-0.5">
                            {asset.lastAction ? formatDate(asset.lastAction) : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div>
          {contacts.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No contacts found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell className="text-gray-900 font-normal">
                      {contact.name}{contact.lastName ? ` ${contact.lastName}` : ""}
                    </TableCell>
                    <TableCell className="text-gray-900 font-normal">{contact.position || "-"}</TableCell>
                    <TableCell className="text-gray-900 font-normal">{contact.email || "-"}</TableCell>
                    <TableCell className="text-gray-900 font-normal">{contact.phone || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
