"use client";

import { useEffect } from "react";
import { Settings, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function PortalSettingsPage() {
  useEffect(() => { document.title = "TSC - Settings"; }, []);

  const settingsItems = [
    {
      title: "Maintenance Tasks",
      description: "Set custom assets maintenance tasks",
      href: "/portal-settings/maintenance-tasks",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border border-gray-200 rounded-[10px] p-5 flex items-center gap-4 hover:border-cyan-300 hover:shadow-sm transition-all bg-white"
          >
            <div className="text-gray-500">
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-400">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
