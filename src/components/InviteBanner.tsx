"use client";

import { useState } from "react";
import { Check, X, Loader2, User as UserIcon } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { respondToInvite } from "@/app/actions/collaborators";
import { cn } from "@/lib/utils";

interface InviteBannerProps {
  invites: any[];
  onUpdate: () => void;
}

export function InviteBanner({ invites, onUpdate }: InviteBannerProps) {
  const { t } = useTranslation();
  const [responding, setResponding] = useState<string | null>(null);

  if (!invites.length) return null;

  async function handleRespond(inviteId: string, accept: boolean) {
    setResponding(inviteId);
    await respondToInvite(inviteId, accept);
    onUpdate();
    setResponding(null);
  }

  return (
    <div className="space-y-2 mb-6">
      <h3 className="text-xs font-bold text-violet-500 uppercase tracking-widest flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
        {t.collaborators.pendingInvites}
      </h3>
      {invites.map(invite => (
        <div
          key={invite.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 animate-in fade-in slide-in-from-top-4"
        >
          {/* Inviter avatar */}
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            {invite.inviter?.avatar_url ? (
              <img src={invite.inviter.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-4 h-4 text-zinc-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-800 dark:text-zinc-200">
              <span className="font-bold">{invite.inviter?.display_name || "Someone"}</span>{" "}
              <span className="text-zinc-500">{t.collaborators.inviteDesc}</span>{" "}
              <span className="font-bold text-violet-600 dark:text-violet-400">&ldquo;{invite.book?.title}&rdquo;</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => handleRespond(invite.id, true)}
              disabled={responding === invite.id}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {responding === invite.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {t.collaborators.accept}
            </button>
            <button
              onClick={() => handleRespond(invite.id, false)}
              disabled={responding === invite.id}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
            >
              <X className="w-3 h-3" />
              {t.collaborators.reject}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
