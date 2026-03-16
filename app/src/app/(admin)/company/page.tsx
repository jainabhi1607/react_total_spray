"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";

interface CompanyData {
  _id: string;
  companyName: string;
  companyLogo?: string;
  address?: string;
  abn?: string;
  siteCount: number;
  assetCount: number;
  contactCount: number;
}

export default function CompanyPage() {
  useEffect(() => { document.title = "TSC - Company"; }, []);
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const res = await fetch("/api/portal/company");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, []);

  if (loading) return <PageLoading />;
  if (!data) return <div className="text-center py-8 text-gray-500">Company information not available</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Company</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Sites", value: data.siteCount, iconSrc: "/clients.svg", bg: "bg-blue-100" },
          { label: "Assets", value: data.assetCount, iconSrc: "/package.svg", bg: "bg-green-100" },
          { label: "Contacts", value: data.contactCount, iconSrc: "/phone.svg", bg: "bg-orange-100" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] ${card.bg}`}>
                <img src={card.iconSrc} alt="" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Company Name</p>
              <p className="text-sm font-medium text-gray-900">{data.companyName}</p>
            </div>
            {data.abn && (
              <div>
                <p className="text-sm text-gray-500">ABN</p>
                <p className="text-sm font-medium text-gray-900">{data.abn}</p>
              </div>
            )}
            {data.address && (
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-sm font-medium text-gray-900">{data.address}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
