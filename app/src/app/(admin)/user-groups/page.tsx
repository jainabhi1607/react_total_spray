"use client";

import { useEffect, useState, useCallback } from "react";
import { Lock, Loader2, Trash2, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface GroupListItem {
  _id: string;
  title: string;
  defaultGroup?: number;
  menus?: string;
  userCount: number;
}

interface GroupUser {
  _id: string;
  userId: { _id: string; name: string; lastName?: string; email: string };
}

interface SiteItem {
  _id: string;
  siteName: string;
  address?: string;
}

interface AssetItem {
  _id: string;
  machineName: string;
  serialNo?: string;
  clientSiteId?: string;
}

interface PortalUser {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  role: number;
}

const MENU_ITEMS: { id: number; label: string }[] = [
  { id: 1, label: "Dashboard" },
  { id: 4, label: "Services" },
  { id: 8, label: "Support Tickets" },
  { id: 2, label: "Sites" },
  { id: 3, label: "Assets" },
  { id: 6, label: "Contacts" },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function UserGroupsPage() {
  useEffect(() => { document.title = "TSC - User Groups"; }, []);

  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Detail state
  const [detailLoading, setDetailLoading] = useState(false);
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([]);
  const [checkedMenus, setCheckedMenus] = useState<Set<number>>(new Set());
  const [checkedSites, setCheckedSites] = useState<Set<string>>(new Set());
  const [checkedAssets, setCheckedAssets] = useState<Set<string>>(new Set());
  const [allSites, setAllSites] = useState<SiteItem[]>([]);
  const [allAssets, setAllAssets] = useState<AssetItem[]>([]);
  const [allUsers, setAllUsers] = useState<PortalUser[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Add user dialog
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addUserSelected, setAddUserSelected] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  // Edit group name dialog
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [editingName, setEditingName] = useState(false);

  /* ---- Fetch groups list ---- */
  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/user-groups");
      const json = await res.json();
      if (json.success) {
        setGroups(json.data);
        return json.data as GroupListItem[];
      }
    } catch { /* ignore */ }
    return [] as GroupListItem[];
  }, []);

  /* ---- Fetch single group detail ---- */
  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/portal/user-groups/${id}`);
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setGroupUsers(d.groupUsers || []);
        setAllSites(d.allSites || []);
        setAllAssets(d.allAssets || []);
        setAllUsers(d.allUsers || []);
        setIsDefault(d.group.defaultGroup === 1);
        setGroupTitle(d.group.title || "");

        // Parse menus
        const menuStr = d.group.menus || "";
        const menuIds = menuStr.split(",").filter(Boolean).map(Number);
        setCheckedMenus(new Set(menuIds));

        // Parse sites/assets
        setCheckedSites(new Set((d.groupSites || []).map(String)));
        setCheckedAssets(new Set((d.groupAssets || []).map(String)));
      }
    } catch { /* ignore */ }
    setDetailLoading(false);
  }, []);

  /* ---- Initial load ---- */
  useEffect(() => {
    (async () => {
      const g = await fetchGroups();
      if (g.length > 0) setSelectedId(g[0]._id);
      setLoading(false);
    })();
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);

  /* ---- Helpers ---- */
  const selectedGroup = groups.find((g) => g._id === selectedId);

  function toggleMenu(id: number) {
    if (isDefault) return;
    setCheckedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSite(siteId: string) {
    if (isDefault) return;
    setCheckedSites((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) {
        next.delete(siteId);
        // Also remove assets for this site
        const siteAssetIds = allAssets.filter((a) => String(a.clientSiteId) === siteId).map((a) => String(a._id));
        setCheckedAssets((pa) => {
          const na = new Set(pa);
          siteAssetIds.forEach((id) => na.delete(id));
          return na;
        });
      } else {
        next.add(siteId);
        // Auto-select all assets for this site
        const siteAssetIds = allAssets.filter((a) => String(a.clientSiteId) === siteId).map((a) => String(a._id));
        setCheckedAssets((pa) => {
          const na = new Set(pa);
          siteAssetIds.forEach((id) => na.add(id));
          return na;
        });
      }
      return next;
    });
  }

  function toggleAsset(assetId: string) {
    if (isDefault) return;
    setCheckedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId); else next.add(assetId);
      return next;
    });
  }

  function selectAllSites() {
    if (isDefault) return;
    const siteIds = allSites.map((s) => String(s._id));
    setCheckedSites(new Set(siteIds));
    const assetIds = allAssets.map((a) => String(a._id));
    setCheckedAssets(new Set(assetIds));
  }

  function toggleAllAssetsForSite(siteId: string) {
    if (isDefault) return;
    const siteAssetIds = allAssets.filter((a) => String(a.clientSiteId) === siteId).map((a) => String(a._id));
    const allChecked = siteAssetIds.every((id) => checkedAssets.has(id));
    setCheckedAssets((prev) => {
      const next = new Set(prev);
      siteAssetIds.forEach((id) => { if (allChecked) next.delete(id); else next.add(id); });
      return next;
    });
  }

  /* ---- Save / Update ---- */
  async function handleUpdate() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const sitesPayload = Array.from(checkedSites).map((siteId) => {
        const siteAssetIds = allAssets
          .filter((a) => String(a.clientSiteId) === siteId && checkedAssets.has(String(a._id)))
          .map((a) => String(a._id));
        return { clientSiteId: siteId, assetIds: siteAssetIds };
      });

      const res = await fetch(`/api/portal/user-groups/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menus: Array.from(checkedMenus).join(","),
          userIds: groupUsers.map((gu) => gu.userId._id),
          sites: sitesPayload,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || "Failed to update");
      }
      await fetchGroups();
    } catch {
      alert("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  /* ---- Create group ---- */
  async function handleCreate() {
    if (!createTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/portal/user-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: createTitle.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCreateOpen(false);
        setCreateTitle("");
        const g = await fetchGroups();
        setSelectedId(json.data._id);
      } else {
        alert(json.error || "Failed to create");
      }
    } catch {
      alert("Failed to create");
    } finally {
      setCreating(false);
    }
  }

  /* ---- Delete group ---- */
  async function handleDelete() {
    if (!selectedId || isDefault) return;
    if (!confirm("Are you sure you want to delete this user group?")) return;
    try {
      const res = await fetch(`/api/portal/user-groups/${selectedId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        const g = await fetchGroups();
        setSelectedId(g.length > 0 ? g[0]._id : null);
      } else {
        alert(json.error || "Failed to delete");
      }
    } catch {
      alert("Failed to delete");
    }
  }

  /* ---- Add user ---- */
  async function handleAddUser() {
    if (!addUserSelected || !selectedId) return;
    setAddingUser(true);
    try {
      // Add user locally then save
      const user = allUsers.find((u) => u._id === addUserSelected);
      if (user) {
        setGroupUsers((prev) => [
          ...prev,
          { _id: "temp-" + Date.now(), userId: { _id: user._id, name: user.name, lastName: user.lastName, email: user.email } },
        ]);
      }
      setAddUserOpen(false);
      setAddUserSelected("");
    } catch { /* ignore */ } finally {
      setAddingUser(false);
    }
  }

  function removeUser(userId: string) {
    if (isDefault) return;
    setGroupUsers((prev) => prev.filter((gu) => gu.userId._id !== userId));
  }

  /* ---- Edit group name ---- */
  async function handleEditName() {
    if (!editNameValue.trim() || !selectedId) return;
    setEditingName(true);
    try {
      const res = await fetch(`/api/portal/user-groups/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editNameValue.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setGroupTitle(editNameValue.trim());
        setEditNameOpen(false);
        await fetchGroups();
      } else {
        alert(json.error || "Failed to update");
      }
    } catch {
      alert("Failed to update");
    } finally {
      setEditingName(false);
    }
  }

  /* ---- Available users (not already in group) ---- */
  const usedUserIds = new Set(groupUsers.map((gu) => gu.userId._id));
  const availableUsers = allUsers.filter((u) => !usedUserIds.has(u._id));

  if (loading) return <PageLoading />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Groups</h1>

      <div className="flex gap-6">
        {/* ============ LEFT PANEL ============ */}
        <div className="w-[280px] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-gray-900">User Groups</h2>
            <button
              onClick={() => { setCreateTitle(""); setCreateOpen(true); }}
              className="text-[13px] text-cyan-500 underline cursor-pointer"
            >
              + Create User Group
            </button>
          </div>

          <div className="space-y-2">
            {groups.map((g) => (
              <button
                key={g._id}
                onClick={() => setSelectedId(g._id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-[10px] text-left text-[14px] cursor-pointer transition-colors ${
                  selectedId === g._id
                    ? "bg-cyan-50 border-2 border-cyan-400 text-gray-900 font-medium"
                    : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{g.title}</span>
                {g.defaultGroup === 1 && <Lock className="h-4 w-4 text-gray-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* ============ RIGHT PANEL ============ */}
        <div className="flex-1 min-w-0">
          {!selectedId ? (
            <p className="text-[14px] text-gray-400 py-12 text-center">Select a user group</p>
          ) : detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[17px] font-semibold text-gray-900">
                  {groupTitle} - Group Permissions
                </h2>
                <div className="flex items-center gap-4">
                  {!isDefault && (
                    <button onClick={handleDelete} className="text-[13px] text-red-500 hover:text-red-600 cursor-pointer font-medium">
                      Delete
                    </button>
                  )}
                  {!isDefault && (
                    <button
                      onClick={() => { setEditNameValue(groupTitle); setEditNameOpen(true); }}
                      className="text-[13px] text-gray-600 underline cursor-pointer font-medium"
                    >
                      Edit Group Name
                    </button>
                  )}
                  <Button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px] px-8"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Update
                  </Button>
                </div>
              </div>

              {/* ---- Users Section ---- */}
              <div className="rounded-[10px] border border-gray-200 bg-white p-6 mb-6">
                <h3 className="text-[15px] font-semibold text-gray-900">Users</h3>
                <p className="text-[13px] text-cyan-600 mb-3">
                  Select the <strong>users</strong> you wish to include in this User Group
                </p>

                {groupUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {groupUsers.map((gu) => (
                      <span
                        key={gu.userId._id}
                        className="inline-flex items-center gap-1.5 rounded-[10px] bg-cyan-50 border border-cyan-200 px-3 py-1.5 text-[13px] text-cyan-700"
                      >
                        {gu.userId.name}{gu.userId.lastName ? ` ${gu.userId.lastName}` : ""}
                        {!isDefault && (
                          <button onClick={() => removeUser(gu.userId._id)} className="text-cyan-400 hover:text-red-500 cursor-pointer">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { setAddUserSelected(""); setAddUserOpen(true); }}
                  className="text-[13px] text-cyan-500 underline cursor-pointer"
                >
                  + Add User
                </button>
              </div>

              {/* ---- Menu Section ---- */}
              <div className="rounded-[10px] border border-gray-200 bg-white p-6 mb-6">
                <h3 className="text-[15px] font-semibold text-gray-900">Menu</h3>
                <p className="text-[13px] text-gray-500 mb-4">
                  Select the <strong>menu</strong> items accessible for this User Group
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {MENU_ITEMS.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkedMenus.has(item.id)}
                        onChange={() => toggleMenu(item.id)}
                        disabled={isDefault}
                        className="h-5 w-5 rounded accent-cyan-500 cursor-pointer"
                      />
                      <span className={`text-[13px] ${checkedMenus.has(item.id) ? "text-cyan-600" : "text-gray-700"}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ---- Sites Section ---- */}
              <div className="rounded-[10px] border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[15px] font-semibold text-gray-900">Sites</h3>
                  {!isDefault && (
                    <button onClick={selectAllSites} className="text-[13px] text-cyan-500 underline cursor-pointer">
                      Select All Sites
                    </button>
                  )}
                </div>
                <p className="text-[13px] text-gray-500 mb-4">
                  Select the <strong>sites</strong> you wish to accessible for this User Group
                </p>

                {allSites.length === 0 ? (
                  <p className="text-[13px] text-gray-400">No sites available</p>
                ) : (
                  <div className="space-y-3">
                    {allSites.map((site) => {
                      const siteId = String(site._id);
                      const siteChecked = isDefault || checkedSites.has(siteId);
                      const siteAssets = allAssets.filter((a) => String(a.clientSiteId) === siteId);
                      const siteLabel = site.siteName + (site.address ? ` - ${site.address}` : "");

                      return (
                        <div key={siteId}>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={siteChecked}
                              onChange={() => toggleSite(siteId)}
                              disabled={isDefault}
                              className="h-5 w-5 rounded accent-cyan-500 cursor-pointer"
                            />
                            <span className={`text-[13px] ${siteChecked ? "text-cyan-600" : "text-gray-700"}`}>
                              {siteLabel}
                            </span>
                          </label>

                          {/* Assets for this site (only when site is checked) */}
                          {siteChecked && siteAssets.length > 0 && (
                            <div className="ml-7 mt-2 rounded-[10px] bg-gray-50 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="text-[14px] font-semibold text-gray-900">{site.siteName}</span>
                                  <span className="text-[14px] text-gray-500"> - Assets</span>
                                </div>
                                {!isDefault && (
                                  <button
                                    onClick={() => toggleAllAssetsForSite(siteId)}
                                    className="text-[13px] text-cyan-500 underline cursor-pointer"
                                  >
                                    {siteAssets.every((a) => checkedAssets.has(String(a._id))) ? "Deselect All Assets" : "Select All Assets"}
                                  </button>
                                )}
                              </div>
                              <p className="text-[12px] text-cyan-600 mb-3">
                                Select the <strong>assets</strong> you wish to accessible for this User Group
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {siteAssets.map((asset) => {
                                  const assetId = String(asset._id);
                                  const assetChecked = isDefault || checkedAssets.has(assetId);
                                  const assetLabel = asset.machineName + (asset.serialNo ? ` - ${asset.serialNo}` : "");
                                  return (
                                    <label key={assetId} className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={assetChecked}
                                        onChange={() => toggleAsset(assetId)}
                                        disabled={isDefault}
                                        className="h-5 w-5 rounded accent-cyan-500 cursor-pointer"
                                      />
                                      <span className={`text-[13px] ${assetChecked ? "text-cyan-600" : "text-gray-700"}`}>
                                        {assetLabel}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============ CREATE USER GROUP DIALOG ============ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4">
            <DialogTitle className="text-lg font-bold">Add User Group</DialogTitle>
            <DialogDescription className="sr-only">Create a new user group</DialogDescription>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-4">
              <label className="text-[14px] text-gray-700 w-[100px] shrink-0">Title</label>
              <Input
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="rounded-[10px] text-[14px]"
                placeholder=""
              />
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-3 px-6 py-4">
            <Button onClick={handleCreate} disabled={creating || !createTitle.trim()} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]">
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Add User Group
            </Button>
            <button onClick={() => setCreateOpen(false)} className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ ADD USER DIALOG ============ */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="max-w-xl rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4">
            <DialogTitle className="text-lg font-bold">Add User</DialogTitle>
            <DialogDescription className="sr-only">Add a user to this group</DialogDescription>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-4">
              <label className="text-[14px] text-gray-700 w-[100px] shrink-0">Select User</label>
              <div className="relative flex-1">
                <select
                  value={addUserSelected}
                  onChange={(e) => setAddUserSelected(e.target.value)}
                  className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none pr-8"
                >
                  <option value="">Select</option>
                  {availableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}{u.lastName ? ` ${u.lastName}` : ""} ({u.email})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-3 px-6 py-4">
            <Button onClick={handleAddUser} disabled={addingUser || !addUserSelected} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]">
              {addingUser && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Add User
            </Button>
            <button onClick={() => setAddUserOpen(false)} className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ EDIT GROUP NAME DIALOG ============ */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent className="max-w-xl rounded-[10px] p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-4">
            <DialogTitle className="text-lg font-bold">Edit Group Name</DialogTitle>
            <DialogDescription className="sr-only">Edit user group name</DialogDescription>
          </DialogHeader>
          <hr className="border-gray-200" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-4">
              <label className="text-[14px] text-gray-700 w-[100px] shrink-0">Title</label>
              <Input
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="rounded-[10px] text-[14px]"
              />
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center gap-3 px-6 py-4">
            <Button onClick={handleEditName} disabled={editingName || !editNameValue.trim()} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-[10px]">
              {editingName && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
            <button onClick={() => setEditNameOpen(false)} className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
