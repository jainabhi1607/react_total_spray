"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MaintenanceTask {
  _id: string;
  title: string;
}

interface PaginatedResponse {
  data: MaintenanceTask[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MaintenanceTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [taskName, setTaskName] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<MaintenanceTask | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { document.title = "TSC - Maintenance Tasks"; }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/maintenance-tasks?page=${page}&limit=${limit}`);
      const json = await res.json();
      if (json.success) {
        const d: PaginatedResponse = json.data;
        setTasks(d.data);
        setTotal(d.total);
        setTotalPages(d.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openAdd = () => {
    setEditingTask(null);
    setTaskName("");
    setDialogOpen(true);
  };

  const openEdit = (task: MaintenanceTask) => {
    setEditingTask(task);
    setTaskName(task.title);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!taskName.trim()) return;
    setSaving(true);
    try {
      const url = editingTask
        ? `/api/portal/maintenance-tasks/${editingTask._id}`
        : "/api/portal/maintenance-tasks";
      const method = editingTask ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: taskName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setDialogOpen(false);
        fetchTasks();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (task: MaintenanceTask) => {
    setDeletingTask(task);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/portal/maintenance-tasks/${deletingTask._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setDeleteDialogOpen(false);
        setDeletingTask(null);
        fetchTasks();
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/portal-settings")} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Tasks</h1>
        </div>
        <button
          onClick={openAdd}
          className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium px-4 py-2 rounded-[10px]"
        >
          Add Custom Task
        </button>
      </div>

      <p className="text-sm text-gray-400">
        Add predefined custom asset maintenance tasks to appear as options on your dedicated asset maintenance pages.
      </p>

      <Card>
        <CardContent className="p-0">
          <div className="px-5 py-3">
            <span className="text-sm font-semibold text-gray-900">All</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tasks Name</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-gray-400 py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-gray-400 py-8">
                    No maintenance tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell className="text-sm text-gray-900">{task.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(task)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(task)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end gap-4 px-5 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-sm text-gray-500 border border-gray-200 rounded-[10px] px-3 py-1 disabled:opacity-50"
              >
                &lt; Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-sm text-gray-500 border border-gray-200 rounded-[10px] px-3 py-1 disabled:opacity-50"
              >
                Next &gt;
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}, showing {tasks.length} record(s) out of {total} total
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl rounded-[10px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Maintenance Task" : "Add Maintenance Task"}</DialogTitle>
          </DialogHeader>
          <hr />
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Task Name</label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full border border-gray-200 rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                placeholder=""
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !taskName.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium px-6 py-2 rounded-[10px] disabled:opacity-50"
            >
              {editingTask ? "Update" : "Add"}
            </button>
            <button
              onClick={() => setDialogOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-[10px]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <hr />
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete &quot;{deletingTask?.title}&quot;?
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-6 py-2 rounded-[10px] disabled:opacity-50"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteDialogOpen(false)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
