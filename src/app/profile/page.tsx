"use client";

import { useEffect, useState } from "react";
import { User, BookOpen, Lock, Globe, GitBranch, LogOut, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getMyBooks } from "@/app/actions/books";
import { signOut } from "@/app/actions/auth";
import { BookCard } from "@/components/BookCard";
import type { BookWithMeta, Profile } from "@/types/supabase";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<BookWithMeta[]>([]);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (prof) {
        setProfile(prof as Profile);
        setDisplayName(prof.display_name ?? "");
        setBio(prof.bio ?? "");
      }

      const myBooks = await getMyBooks();
      setBooks(myBooks);
      setLoading(false);
    }
    load();
  }, []);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ display_name: displayName.trim(), bio: bio.trim() })
      .eq("id", profile.id);

    setProfile((p) => p ? { ...p, display_name: displayName, bio } : p);
    setEditing(false);
    setSaving(false);
  }

  const initials = (profile?.display_name ?? profile?.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const publicBooks = books.filter((b) => b.visibility === "public");
  const privateBooks = books.filter((b) => b.visibility === "private");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/books" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">BookGit</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/books" className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition">
              Kitaplarım
            </Link>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-6 py-10">

        {/* Profile card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-violet-900/30">
                  {loading ? <User className="w-8 h-8 text-white/50" /> : initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full text-xl font-bold bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white outline-none focus:border-violet-500 transition"
                  />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Kendinizden bahsedin..."
                    rows={3}
                    maxLength={200}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500 transition resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition"
                    >
                      <Check className="w-3 h-3" /> Kaydet
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-800 transition"
                    >
                      <X className="w-3 h-3" /> İptal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold text-white">
                      {loading ? <span className="h-6 w-32 bg-zinc-800 rounded animate-pulse block" /> : (profile?.display_name || "İsimsiz Yazar")}
                    </h1>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">{profile?.email}</p>
                  {profile?.bio && (
                    <p className="text-sm text-zinc-400 leading-relaxed">{profile.bio}</p>
                  )}
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-center flex-shrink-0">
              <div>
                <div className="text-xl font-bold text-white">{books.length}</div>
                <div className="text-xs text-zinc-500">Kitap</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{publicBooks.length}</div>
                <div className="text-xs text-zinc-500">Paylaşılan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Book sections */}
        {!loading && books.length > 0 && (
          <>
            {publicBooks.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-3.5 h-3.5 text-violet-400" />
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Paylaşılan</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {publicBooks.map((b) => <BookCard key={b.id} book={b} />)}
                </div>
              </section>
            )}
            {privateBooks.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Özel</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {privateBooks.map((b) => <BookCard key={b.id} book={b} />)}
                </div>
              </section>
            )}
          </>
        )}

        {!loading && books.length === 0 && (
          <div className="text-center py-16 text-zinc-600">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz kitap yok</p>
            <Link href="/books" className="mt-3 inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-sm transition">
              Kitap oluştur →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
