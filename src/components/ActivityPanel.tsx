"use client";

import { useState, useEffect } from "react";
import { History, Loader2, User } from "lucide-react";
import { getBookActivity } from "@/app/actions/activity";
import { useTranslation } from "@/contexts/LanguageContext";

interface ActivityEntry {
  id: string;
  chapter_title: string | null;
  action: string;
  created_at: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

interface ActivityPanelProps {
  bookId: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ActivityPanel({ bookId }: ActivityPanelProps) {
  const { t } = useTranslation();
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getBookActivity(bookId);
      if (res.data) setActivity(res.data as ActivityEntry[]);
      setLoading(false);
    }
    load();
  }, [bookId]);

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-3.5 h-3.5 text-amber-400" />
        <h2 className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400">
          Edit History
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          </div>
        ) : activity.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-8">
            No edit history yet.
          </p>
        ) : (
          activity.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-zinc-800/40 transition-colors"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-zinc-700">
                {entry.profile?.avatar_url ? (
                  <img
                    src={entry.profile.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">
                  {entry.profile?.display_name ||
                    entry.profile?.username ||
                    "Unknown"}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {entry.action === "edited" ? "edited" : entry.action}{" "}
                  {entry.chapter_title && (
                    <span className="text-amber-400/80">
                      "{entry.chapter_title}"
                    </span>
                  )}
                </p>
              </div>

              {/* Time */}
              <span className="text-[9px] text-zinc-600 flex-shrink-0 mt-0.5">
                {timeAgo(entry.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
