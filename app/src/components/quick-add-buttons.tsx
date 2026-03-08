"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddClientDialog } from "@/components/dialogs/add-client-dialog";
import { AddSiteDialog } from "@/components/dialogs/add-site-dialog";
import { AddAssetDialog } from "@/components/dialogs/add-asset-dialog";

const filledBtnStyle: React.CSSProperties = {
  border: "1px solid #D6E1E9",
  padding: "8px 15px",
  borderRadius: 5,
  color: "#272D34",
  fontSize: 12,
  fontWeight: "normal",
  backgroundColor: "#FFF",
  lineHeight: "13px",
};

export const cyanBtnStyle: React.CSSProperties = {
  border: "1px solid #00AEEF",
  borderColor: "#00AEEF",
  padding: "8px 15px",
  borderRadius: 5,
  color: "#00AEEF",
  fontSize: 12,
  fontWeight: "normal",
  backgroundColor: "#FFF",
  lineHeight: "13px",
};

export function QuickAddButtons() {
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [addAssetOpen, setAddAssetOpen] = useState(false);

  return (
    <>
      <button
        style={filledBtnStyle}
        className="inline-flex items-center gap-1 cursor-pointer hover:bg-gray-50"
        onClick={() => setAddClientOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Client
      </button>
      <button
        style={filledBtnStyle}
        className="inline-flex items-center gap-1 cursor-pointer hover:bg-gray-50"
        onClick={() => setAddSiteOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Site
      </button>
      <button
        style={filledBtnStyle}
        className="inline-flex items-center gap-1 cursor-pointer hover:bg-gray-50"
        onClick={() => setAddAssetOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Asset
      </button>

      <AddClientDialog
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
      />
      <AddSiteDialog
        open={addSiteOpen}
        onOpenChange={setAddSiteOpen}
      />
      <AddAssetDialog
        open={addAssetOpen}
        onOpenChange={setAddAssetOpen}
      />
    </>
  );
}
