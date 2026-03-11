"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, Loader2, UserPlus, Check, X, GitBranch, MessageSquare } from "lucide-react";
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification, type AppNotification } from "@/app/actions/notifications";
import { respondToInvite } from "@/app/actions/collaborators";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTranslation } from "@/contexts/LanguageContext";

export function NotificationsDropdown() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();
    // In a real app we'd use Supabase Realtime here.
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    const res = await getMyNotifications();
    if (res.data) setNotifications(res.data);
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function handleNotificationClick(n: AppNotification) {
    if (!n.is_read) {
      await markAsRead(n.id);
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
    }
  }

  async function handleCollabResponse(n: AppNotification, accept: boolean) {
    if (!n.data?.inviteId) return;
    startTransition(async () => {
      await respondToInvite(n.data.inviteId, accept);
      // Mark as read and optionally delete the notification
      await deleteNotification(n.id);
      setNotifications(prev => prev.filter(item => item.id !== n.id));
    });
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notifications-container')) setOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  return (
    <div className="relative notifications-container">
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-zinc-950 animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-medium transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex flex-col p-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                <Bell className="w-6 h-6 opacity-20" />
                No new notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "flex flex-col gap-2 p-3 rounded-lg transition-colors cursor-pointer group",
                    n.is_read ? "opacity-70 hover:opacity-100 hover:bg-zinc-800/50" : "bg-zinc-800/50 hover:bg-zinc-800"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      n.type === 'collab_invite' ? "bg-violet-500/10 text-violet-400" :
                      n.type === 'comment' ? "bg-blue-500/10 text-blue-400" :
                      n.type === 'fork' ? "bg-emerald-500/10 text-emerald-400" :
                      "bg-zinc-800 text-zinc-400"
                    )}>
                      {n.type === 'collab_invite' ? <UserPlus className="w-4 h-4" /> :
                       n.type === 'comment' ? <MessageSquare className="w-4 h-4" /> :
                       n.type === 'fork' ? <GitBranch className="w-4 h-4" /> :
                       <Bell className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className={cn("text-xs font-semibold truncate", n.is_read ? "text-zinc-300" : "text-white")}>
                          {n.title}
                        </p>
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug break-words">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-zinc-500 mt-1 block">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons for Invites */}
                  {n.type === 'collab_invite' && !n.is_read && (
                    <div className="flex gap-2 mt-1 ml-11">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCollabResponse(n, true); }}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded text-xs font-medium transition disabled:opacity-50"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Accept
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCollabResponse(n, false); }}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium transition disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
