"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatCommentDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Comment {
  _id: string;
  comments?: string;
  commentType?: number;
  visibility?: number;
  userId?: { _id: string; name: string; email?: string } | null;
  createdAt: string;
  dateTime?: string;
}

interface CommentsSectionProps {
  comments: Comment[];
  /** Base API URL, e.g. "/api/support-tickets/123" or "/api/job-cards/456" */
  apiBaseUrl: string;
  onRefresh: () => void;
}

export function CommentsSection({ comments, apiBaseUrl, onRefresh }: CommentsSectionProps) {
  const [commentText, setCommentText] = useState("");
  const [commentPublic, setCommentPublic] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  async function handleCommentSubmit() {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`${apiBaseUrl}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comments: commentText.trim(),
          visibility: commentPublic ? 2 : 1,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setCommentText("");
      setCommentPublic(false);
      onRefresh();
    } catch {
      alert("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleEditComment() {
    if (!editingCommentId || !editCommentText.trim()) return;
    try {
      const res = await fetch(`${apiBaseUrl}/comments/${editingCommentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: editCommentText.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      setEditingCommentId(null);
      setEditCommentText("");
      onRefresh();
    } catch {
      alert("Failed to edit comment");
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`${apiBaseUrl}/comments/${commentId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      onRefresh();
    } catch {
      alert("Failed to delete comment");
    }
  }

  async function handleToggleVisibility(commentId: string, currentVisibility: number | undefined) {
    const newVisibility = currentVisibility === 2 ? 1 : 2;
    try {
      const res = await fetch(`${apiBaseUrl}/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error("Failed");
      onRefresh();
    } catch {
      // silent
    }
  }

  return (
    <>
      <div className="rounded-[10px] border border-gray-200 bg-white p-10">
        <p className="text-base font-semibold text-gray-900 mb-4">Comments / Updates</p>

        {/* Add comment */}
        <div className="mb-5">
          <Textarea
            placeholder="Start typing..."
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <div className="flex items-center gap-3 mt-3">
            <Button
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full px-5"
              onClick={handleCommentSubmit}
              disabled={submittingComment || !commentText.trim()}
            >
              {submittingComment && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={commentPublic}
                onChange={(e) => setCommentPublic(e.target.checked)}
                className="rounded border-gray-300"
              />
              Make Public
            </label>
          </div>
        </div>

        {/* Comments list */}
        {comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((c) => {
              const isPublic = c.visibility === 2;
              const dateStr = c.createdAt ? formatCommentDate(c.createdAt) : "";

              return (
                <div
                  key={c._id}
                  className="rounded-[10px]"
                  style={{ backgroundColor: isPublic ? "#FFF7DD" : "#F2FBFF", padding: "30px" }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: isPublic ? "#E49049" : "#00AEEF" }}>
                        {c.userId?.name || "Unknown"}
                      </span>
                      <span className="text-xs" style={{ color: isPublic ? "#E49049" : "#00AEEF" }}>{dateStr}</span>
                    </div>
                    {isPublic ? (
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingCommentId(c._id); setEditCommentText(c.comments || ""); }}
                            className="text-xs hover:underline cursor-pointer"
                            style={{ color: "#E49049" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="text-xs hover:underline cursor-pointer"
                            style={{ color: "#E49049" }}
                          >
                            Delete
                          </button>
                        </div>
                        <button
                          onClick={() => handleToggleVisibility(c._id, c.visibility)}
                          className="text-xs hover:underline cursor-pointer"
                          style={{ color: "#E49049" }}
                        >
                          Make Private
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button
                          onClick={() => handleToggleVisibility(c._id, c.visibility)}
                          className="text-xs hover:underline cursor-pointer"
                          style={{ color: "#00AEEF" }}
                        >
                          Make Public
                        </button>
                        <button
                          onClick={() => { setEditingCommentId(c._id); setEditCommentText(c.comments || ""); }}
                          className="text-xs hover:underline cursor-pointer"
                          style={{ color: "#00AEEF" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          className="text-xs hover:underline cursor-pointer"
                          style={{ color: "#00AEEF" }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mt-3">{c.comments}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Comment Dialog */}
      <Dialog open={!!editingCommentId} onOpenChange={(v) => { if (!v) { setEditingCommentId(null); setEditCommentText(""); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
          </DialogHeader>
          <hr />
          <div className="flex items-start gap-6 px-2">
            <Label className="mt-2 min-w-[90px] text-sm text-gray-600">Comments</Label>
            <Textarea
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              rows={5}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3 px-2 pt-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={handleEditComment}
              disabled={!editCommentText.trim()}
            >
              Update
            </Button>
            <button
              onClick={() => { setEditingCommentId(null); setEditCommentText(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
