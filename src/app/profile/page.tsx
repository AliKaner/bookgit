"use client";

import { useEffect, useState } from "react";
import { User, BookOpen, Globe, Lock, LogOut, Pencil, Check, X, Book, Users, Camera, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getMyBooks } from "@/app/actions/books";
import { signOut, updateProfile } from "@/app/actions/auth";
import { BookCard } from "@/components/BookCard";
import { LanguageSwitcher, useTranslation } from "@/contexts/LanguageContext";
import type { BookWithMeta, Profile } from "@/types/supabase";
import { getMyEntities, EntityType } from "@/app/actions/entities";
import { EntityCard } from "@/components/entities/EntityCard";
import { cn } from "@/lib/utils";

type Tab = "books" | "characters" | "dictionary" | "world";

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<BookWithMeta[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("books");
  const [entities, setEntities] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();

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

  useEffect(() => {
    if (activeTab === "books") return;
    
    async function loadEntities() {
      setEntitiesLoading(true);
      const typeMap: Record<string, EntityType> = {
        characters: "character",
        dictionary: "dictionary",
        world: "world"
      };
      const res = await getMyEntities(typeMap[activeTab]);
      if (res.data) {
        setEntities(res.data);
      }
      setEntitiesLoading(false);
    }
    loadEntities();
  }, [activeTab]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles")
      .update({ display_name: displayName.trim(), bio: bio.trim() })
      .eq("id", profile.id);
    setProfile((p) => p ? { ...p, display_name: displayName, bio } : p);
    setEditing(false);
    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const filePath = `pp/${profile.id}/${Math.random()}.${fileExt}`;

    try {
      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // 3. Update profile record
      const res = await updateProfile({ avatar_url: publicUrl });
      if (res.error) throw new Error(res.error);

      setProfile((p) => p ? { ...p, avatar_url: publicUrl } : p);
    } catch (err: any) {
      alert(err.message || "Fotoğraf yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  const initials = (profile?.display_name ?? profile?.email ?? "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const publicBooks = books.filter((b) => b.visibility === "public");
  const privateBooks = books.filter((b) => b.visibility === "private");

  const TABS = [
    { id: "books", label: t.profile.books, icon: <BookOpen className="w-4 h-4" /> },
    { id: "characters", label: t.entities.characters, icon: <Users className="w-4 h-4" /> },
    { id: "dictionary", label: t.entities.dictionary, icon: <Book className="w-4 h-4" /> },
    { id: "world", label: t.entities.worldUnits, icon: <Globe className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/books" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">BookGit</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/books" className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition">
              {t.userCard.myBooks}
            </Link>
            <button onClick={() => signOut()} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition">
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
            <div className="relative flex-shrink-0 group">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-zinc-800 group-hover:border-violet-500/50 transition-all shadow-2xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-600/80 to-blue-600/80 flex items-center justify-center text-3xl font-bold text-white">
                    {loading ? <Loader2 className="w-8 h-8 text-white/50 animate-spin" /> : initials}
                  </div>
                )}
                
                {/* Upload Overlay */}
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[10px] text-white font-medium">PP Değiştir</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              </div>
              
              {/* Status Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t.profile.displayNamePlaceholder}
                    className="w-full text-xl font-bold bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white outline-none focus:border-violet-500 transition"
                  />
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder={t.profile.bioPlaceholder} rows={3} maxLength={200}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500 transition resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveProfile} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition disabled:opacity-60">
                      <Check className="w-3 h-3" /> {t.profile.saveProfile}
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-800 transition">
                      <X className="w-3 h-3" /> {t.common.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold text-white">
                      {loading ? <span className="h-6 w-32 bg-zinc-800 rounded animate-pulse block" /> : (profile?.display_name || t.userCard.writer)}
                    </h1>
                    <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">{profile?.email}</p>
                  {profile?.bio && <p className="text-sm text-zinc-400 leading-relaxed">{profile.bio}</p>}
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-center flex-shrink-0">
              <div>
                <div className="text-xl font-bold text-white">{books.length}</div>
                <div className="text-xs text-zinc-500">{t.profile.books}</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{publicBooks.length}</div>
                <div className="text-xs text-zinc-500">{t.profile.shared}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-zinc-900 border border-zinc-800 p-1 rounded-2xl w-fit shadow-xl shadow-black/20">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                activeTab === tab.id 
                  ? "bg-zinc-800 text-white shadow-lg border border-zinc-700/50" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        {loading || (entitiesLoading && activeTab !== "books") ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse shadow-lg shadow-black/10" />
            ))}
          </div>
        ) : activeTab === "books" ? (
          books.length > 0 ? (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {publicBooks.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <Globe className="w-4 h-4 text-violet-400" />
                    <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">{t.profile.publicBooks}</h2>
                    <div className="h-px flex-1 bg-zinc-800/50 ml-4" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {publicBooks.map((b) => <BookCard key={b.id} book={b} />)}
                  </div>
                </section>
              )}
              {privateBooks.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">{t.profile.privateBooks}</h2>
                    <div className="h-px flex-1 bg-zinc-800/50 ml-4" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {privateBooks.map((b) => <BookCard key={b.id} book={b} />)}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="text-center py-24 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
              <p className="text-zinc-500 text-sm mb-6">{t.profile.noBooks}</p>
              <Link href="/books" className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-900/30">
                {t.profile.createLink}
              </Link>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {entities.length > 0 ? (
              entities.map((item) => (
                <EntityCard 
                  key={item.id} 
                  type={activeTab === "characters" ? "character" : activeTab === "dictionary" ? "dictionary" : "world"} 
                  item={item} 
                />
              ))
            ) : (
              <div className="col-span-full text-center py-24 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
                <Search className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
                <p className="text-zinc-500 text-sm">{t.entities.noResults}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
