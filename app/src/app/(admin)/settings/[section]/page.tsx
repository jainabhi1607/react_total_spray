"use client";

import { useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TagsSettingsSection,
  SettingsListSection,
  AssetSettingsSection,
  EmailNotificationSection,
  TableCrudSection,
} from "@/components/settings/settings-sections";
import { ChecklistTemplatesSection } from "@/components/settings/checklist-templates-section";

const SECTIONS: Record<
  string,
  { title: string; component: React.ComponentType }
> = {
  tags: {
    title: "Tags Settings",
    component: TagsSettingsSection,
  },
  titles: {
    title: "Support Ticket Titles",
    component: () => (
      <SettingsListSection
        entityName="Support Ticket Title"
        endpoint="/api/settings/titles"
      />
    ),
  },
  "asset-settings": {
    title: "Asset Settings",
    component: AssetSettingsSection,
  },
  "checklist-templates": {
    title: "Checklist Templates",
    component: ChecklistTemplatesSection,
  },
  "job-card-types": {
    title: "Job Card Types",
    component: () => (
      <SettingsListSection
        entityName="Job Card Type"
        endpoint="/api/settings/job-card-types"
      />
    ),
  },
  "resource-categories": {
    title: "Resource Categories",
    component: () => (
      <SettingsListSection
        entityName="Resource Category"
        endpoint="/api/resources/categories"
      />
    ),
  },
  "email-notifications": {
    title: "Email Notification Settings",
    component: EmailNotificationSection,
  },
};

export default function SettingsSectionPage() {
  const params = useParams();
  const sectionKey = params.section as string;
  const section = SECTIONS[sectionKey];

  useEffect(() => {
    if (section) {
      document.title = `TSC - ${section.title}`;
    }
  }, [section]);

  if (!section) {
    notFound();
  }

  const SectionComponent = section.component;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{section.title}</h1>
      </div>

      <SectionComponent />
    </div>
  );
}
