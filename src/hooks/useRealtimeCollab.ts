"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface OnlineUser {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  chapterId: string | null;
}

interface UseRealtimeCollab {
  bookId: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  chapterId: string | null;
  onRemoteContent: (chapterId: string, content: string, senderId: string) => void;
}

export function useRealtimeCollab({
  bookId,
  userId,
  displayName,
  avatarUrl,
  chapterId,
  onRemoteContent,
}: UseRealtimeCollab) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const broadcastContent = useCallback(
    async (chapId: string, content: string) => {
      if (!userId) return;
      const supabase = createClient();
      const channel = supabase.channel(`book:${bookId}`);
      channel.send({
        type: "broadcast",
        event: "content_change",
        payload: { chapterId: chapId, content, senderId: userId },
      });
    },
    [bookId, userId]
  );

  useEffect(() => {
    if (!userId || !bookId) return;

    const supabase = createClient();
    const channel = supabase.channel(`book:${bookId}`, {
      config: { presence: { key: userId } },
    });

    // Track presence
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{
          displayName: string;
          avatarUrl: string | null;
          chapterId: string | null;
        }>();
        const users: OnlineUser[] = Object.entries(state).map(([uid, presences]) => {
          const p = presences[0];
          return {
            userId: uid,
            displayName: p.displayName || "Writer",
            avatarUrl: p.avatarUrl,
            chapterId: p.chapterId,
          };
        });
        setOnlineUsers(users.filter((u) => u.userId !== userId));
      })
      .on("broadcast", { event: "content_change" }, ({ payload }) => {
        if (payload.senderId !== userId) {
          onRemoteContent(payload.chapterId, payload.content, payload.senderId);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            displayName,
            avatarUrl,
            chapterId,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookId, userId]);

  // Update presence when active chapter changes
  useEffect(() => {
    if (!userId || !bookId) return;
    const supabase = createClient();
    const channel = supabase.channel(`book:${bookId}`);
    channel.track({ displayName, avatarUrl, chapterId }).catch(() => {});
  }, [chapterId]);

  return { onlineUsers, broadcastContent };
}
