"use client";

import { useState } from "react";
import { X, Send, User, Loader2, MessageSquare } from "lucide-react";
import { addSectionComment } from "@/app/actions/sections";
import { cn } from "@/lib/utils";

interface SectionComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

interface SectionCommentsSidebarProps {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  sectionIdx: number;
  onClose: () => void;
  initialComments: SectionComment[];
}

export function SectionCommentsSidebar({
  bookId,
  chapterId,
  chapterTitle,
  sectionIdx,
  onClose,
  initialComments,
}: SectionCommentsSidebarProps) {
  const [comments, setComments] = useState<SectionComment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const res = await addSectionComment(bookId, chapterId, sectionIdx, newComment);
    if (res.success && res.comment) {
      setComments((prev) => [...prev, res.comment as SectionComment]);
      setNewComment("");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          <div>
            <p className="text-xs font-bold text-zinc-200">Paragraph Notes</p>
            <p className="text-[10px] text-zinc-500 truncate max-w-[160px]">
              {chapterTitle}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
            <p className="text-xs text-zinc-600">
              No comments on this paragraph yet.
            </p>
            <p className="text-[10px] text-zinc-700 mt-1">Be the first!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
                {comment.profile?.avatar_url ? (
                  <img
                    src={comment.profile.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold text-zinc-300">
                    {comment.profile?.display_name ||
                      comment.profile?.username ||
                      "Anonymous"}
                  </span>
                  <span className="text-[9px] text-zinc-600">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      <div className="p-4 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a note on this paragraph..."
            rows={3}
            className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-violet-500 resize-none transition-colors"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white text-xs font-bold transition-all"
          >
            {submitting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            Post Note
          </button>
        </form>
      </div>
    </div>
  );
}
