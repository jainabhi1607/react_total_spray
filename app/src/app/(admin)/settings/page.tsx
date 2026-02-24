"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Settings2,
  FileText,
  Box,
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  Mail,
  ChevronRight,
} from "lucide-react";

const SETTINGS_ITEMS = [
  {
    title: "Tags Settings",
    description: "View and edit relevant Tags Settings",
    icon: Settings2,
    href: "/settings/tags",
  },
  {
    title: "Support Ticket Titles",
    description: "View and edit Support Ticket Titles",
    icon: FileText,
    href: "/settings/titles",
  },
  {
    title: "Asset Settings",
    description: "Create and edit Asset data",
    icon: Box,
    href: "/settings/asset-settings",
  },
  {
    title: "Checklist Templates",
    description: "View and edit Checklist Templates",
    icon: ClipboardCheck,
    href: "/settings/checklist-templates",
  },
  {
    title: "Job Card Types",
    description: "View and edit Job Card Types",
    icon: ClipboardList,
    href: "/settings/job-card-types",
  },
  {
    title: "Resource Categories",
    description: "View and edit Resource Categories",
    icon: FolderOpen,
    href: "/settings/resource-categories",
  },
  {
    title: "Email Notifications",
    description: "View and edit Email Notifications",
    icon: Mail,
    href: "/settings/email-notifications",
  },
];

export default function SettingsPage() {
  useEffect(() => {
    document.title = "TSC - Settings";
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex items-center justify-between rounded-[10px] border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-blue-50">
                  <item.icon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
