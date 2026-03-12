"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { addForumReply } from "@/app/actions/forum";
import { useRouter } from "next/navigation";

interface ForumReplyFormProps {
  postId: string;
  bookId: string;
}

export function ForumReplyForm({ postId, bookId }: ForumReplyFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await addForumReply(postId, content);
    if (res.success) {
      setContent("");
      router.refresh();
    } else {
      if (res.error === "Unauthorized") {
        setError("Please sign in to reply.");
      } else {
        setError(res.error || "Failed to post reply");
      }
    }
    setSubmitting(false);
  }

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
      <h3 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-wider">
        Your Reply
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts..."
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-violet-500 resize-none transition-colors"
        />

        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white text-sm font-bold transition-all active:scale-95"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Post Reply
          </button>
        </div>
      </form>
    </div>
  );
}
