"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Mail, UserPlus, X, Loader2, Check, Crown, Pencil, User as UserIcon } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { searchUsers, inviteCollaborator, getBookCollaborators, removeCollaborator } from "@/app/actions/collaborators";
import { cn } from "@/lib/utils";

interface CollaboratorsPanelProps {
  bookId: string;
  isOwner: boolean;
}

export function CollaboratorsPanel({ bookId, isOwner }: CollaboratorsPanelProps) {
  const { t } = useTranslation();
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [emailInvite, setEmailInvite] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadCollaborators = useCallback(async () => {
    const res = await getBookCollaborators(bookId);
    if (res.data) setCollaborators(res.data);
    setLoading(false);
  }, [bookId]);

  useEffect(() => { loadCollaborators(); }, [loadCollaborators]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await searchUsers(searchQuery);
      if (res.data) {
        // Filter out already-invited users
        const existingIds = new Set(collaborators.map(c => c.user_id));
        setSearchResults(res.data.filter((u: any) => !existingIds.has(u.id)));
      }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, collaborators]);

  async function handleInvite(userId: string) {
    setInviting(userId);
    setFeedback(null);
    const res = await inviteCollaborator(bookId, { userId });
    if (res.success) {
      setFeedback({ type: "success", msg: t.collaborators.inviteSent });
      setSearchQuery("");
      setSearchResults([]);
      loadCollaborators();
    } else {
      setFeedback({ type: "error", msg: res.error || "Error" });
    }
    setInviting(null);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleEmailInvite() {
    if (!emailInvite.trim() || !emailInvite.includes("@")) return;
    setInviting("email");
    setFeedback(null);
    const res = await inviteCollaborator(bookId, { email: emailInvite.trim() });
    if (res.success) {
      setFeedback({ type: "success", msg: t.collaborators.inviteSent });
      setEmailInvite("");
      setShowEmailInput(false);
      loadCollaborators();
    } else {
      setFeedback({ type: "error", msg: res.error || "Error" });
    }
    setInviting(null);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleRemove(collabId: string) {
    const res = await removeCollaborator(bookId, collabId);
    if (res.success) loadCollaborators();
  }

  const statusColor: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    accepted: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    rejected: "bg-red-500/10 text-red-500 border-red-500/30",
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <h2 className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-3">
        {t.collaborators.title}
      </h2>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          "text-xs px-3 py-2 rounded-lg mb-3 font-medium animate-in fade-in slide-in-from-top-2",
          feedback.type === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
        )}>
          {feedback.msg}
        </div>
      )}

      {/* Invite Section (owner only) */}
      {isOwner && (
        <div className="space-y-2 mb-4">
          {/* User Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.collaborators.searchPlaceholder}
              className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-violet-500 transition-colors text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
            />
            {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-500 animate-spin" />}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden shadow-lg">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleInvite(user.id)}
                  disabled={inviting === user.id}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{user.display_name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                  {inviting === user.id ? (
                    <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin flex-shrink-0" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Email Invite Toggle */}
          {!showEmailInput ? (
            <button
              onClick={() => setShowEmailInput(true)}
              className="flex items-center gap-1.5 text-[11px] text-violet-500 hover:text-violet-400 font-medium transition-colors"
            >
              <Mail className="w-3 h-3" /> {t.collaborators.inviteByEmail}
            </button>
          ) : (
            <div className="flex gap-1.5">
              <input
                type="email"
                value={emailInvite}
                onChange={e => setEmailInvite(e.target.value)}
                placeholder={t.collaborators.emailPlaceholder}
                className="flex-1 px-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:border-violet-500 transition-colors text-zinc-800 dark:text-zinc-200 placeholder-zinc-400"
                onKeyDown={e => e.key === "Enter" && handleEmailInvite()}
              />
              <button
                onClick={handleEmailInvite}
                disabled={inviting === "email"}
                className="px-3 py-2 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors disabled:opacity-50"
              >
                {inviting === "email" ? <Loader2 className="w-3 h-3 animate-spin" /> : t.collaborators.send}
              </button>
              <button
                onClick={() => { setShowEmailInput(false); setEmailInvite(""); }}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collaborators List */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          </div>
        ) : collaborators.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-8">{t.collaborators.noCollaborators}</p>
        ) : (
          collaborators.map(collab => (
            <div
              key={collab.id}
              className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
            >
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {collab.profile?.avatar_url ? (
                  <img src={collab.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {collab.profile?.display_name || collab.email || "Unknown"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide",
                    statusColor[collab.status] || statusColor.pending
                  )}>
                    {collab.status === "accepted" ? t.collaborators.accepted :
                     collab.status === "rejected" ? t.collaborators.rejected :
                     t.collaborators.pending}
                  </span>
                  <span className="text-[9px] text-zinc-400 flex items-center gap-0.5">
                    <Pencil className="w-2 h-2" /> {t.collaborators.editor}
                  </span>
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRemove(collab.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex-shrink-0"
                  title={t.collaborators.remove}
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
