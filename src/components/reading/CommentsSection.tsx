"use client";

import { useState } from "react";
import { MessageSquare, Send, User, Loader2 } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { addBookComment } from "@/app/actions/social";
import { cn } from "@/lib/utils";

interface Comment {
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

interface Props {
  bookId: string;
  initialComments: Comment[];
}

export function CommentsSection({ bookId, initialComments }: Props) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await addBookComment(bookId, newComment);
    if (res.success && res.comment) {
      setComments(prev => [...prev, res.comment as Comment]);
      setNewComment("");
    } else {
      alert(res.error || "Comment failed");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-20 border-t border-zinc-800 pt-16">
      <div className="flex items-center gap-3 mb-10">
        <MessageSquare className="w-5 h-5 text-violet-400" />
        <h2 className="text-xl font-bold text-white">{t.entities.comments}</h2>
        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold">
          {comments.length}
        </span>
      </div>

      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="mb-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 focus-within:ring-1 focus-within:ring-violet-500/50 transition-all">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t.entities.addComment}
          rows={3}
          className="w-full bg-transparent border-none text-zinc-200 text-sm placeholder:text-zinc-600 outline-none resize-none mb-2"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-violet-900/20"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {t.common.submit}
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-8">
        {comments.length === 0 ? (
          <p className="text-center py-10 text-zinc-600 text-sm italic">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group">
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden">
                {comment.profile.avatar_url ? (
                  <img src={comment.profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-zinc-200">
                    {comment.profile.display_name || comment.profile.username || "Anonymous"}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
