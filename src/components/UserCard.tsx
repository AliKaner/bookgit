"use client";

import { useEffect, useState } from "react";
import { ChevronRight, LogOut, User } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/types/supabase";
import { useTranslation } from "@/contexts/LanguageContext";

export function UserCard({ variant = "header" }: { variant?: "header" | "sidebar" }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setProfile(data as Profile);
    })();
  }, []);

  if (!profile) return null;

  const initials = (profile.display_name ?? profile.email)
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const Avatar = () => (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md shadow-violet-900/30 overflow-hidden">
      {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : initials}
    </div>
  );

  if (variant === "sidebar") {
    return (
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setOpen(!open)}>
          <Avatar />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-300 truncate">{profile.display_name || t.userCard.writer}</p>
            <p className="text-[10px] text-zinc-600 truncate">{profile.email}</p>
          </div>
          <ChevronRight className={`w-3 h-3 text-zinc-600 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        </div>
        {open && (
          <div className="mt-2 space-y-1">
            <Link href="/profile" className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition">
              <User className="w-3 h-3" /> {t.userCard.profile}
            </Link>
            <button onClick={() => signOut()} className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-zinc-500 hover:bg-red-950/30 hover:text-red-400 transition">
              <LogOut className="w-3 h-3" /> {t.userCard.signOut}
            </button>
          </div>
        )}
      </div>
    );
  }

  // header variant
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-zinc-800 transition group">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
          {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : initials}
        </div>
        <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition hidden sm:block max-w-[80px] truncate">
          {profile.display_name || t.userCard.writer}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 overflow-hidden">
            <div className="px-3 py-2 border-b border-zinc-800">
              <p className="text-xs font-medium text-zinc-300 truncate">{profile.display_name || t.userCard.writer}</p>
              <p className="text-[10px] text-zinc-600 truncate">{profile.email}</p>
            </div>
            <Link href="/books" onClick={() => setOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition">
              <User className="w-3 h-3" /> {t.userCard.myBooks}
            </Link>
            <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition">
              <User className="w-3 h-3" /> {t.userCard.profile}
            </Link>
            <div className="border-t border-zinc-800 mt-1">
              <button onClick={() => signOut()} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-500 hover:bg-red-950/30 hover:text-red-400 transition">
                <LogOut className="w-3 h-3" /> {t.userCard.signOut}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
