"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Search, Plus, LogOut, BookOpen, Globe, Lock, X, Library } from "lucide-react";
import { useRouter } from "next/navigation";
import { BookCard } from "@/components/BookCard";
import { CreateBookDialog } from "@/components/CreateBookDialog";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { getMyBooks, getPublicBooks, getGenres } from "@/app/actions/books";
import { getMyInvites, getCollaboratedBooks, respondToInvite } from "@/app/actions/collaborators";
import { signOut, getProfile } from "@/app/actions/auth";
import type { BookWithMeta, Genre, Profile } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { useTranslation, LanguageSwitcher } from "@/contexts/LanguageContext";

type Feed = "mine" | "public";

export default function BooksPage() {
  const t = useTranslation().t;
  const router = useRouter();
  const [feed, setFeed] = useState<Feed>("mine");
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [initialParentId, setInitialParentId] = useState<string | undefined>();
  const [initialSeriesId, setInitialSeriesId] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const [myBooks, setMyBooks] = useState<BookWithMeta[]>([]);
  const [publicBooks, setPublicBooks] = useState<BookWithMeta[]>([]);
  const [collabBooks, setCollabBooks] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const [mine, pub, gs, prof, invites, collab] = await Promise.all([
        getMyBooks(), getPublicBooks(), getGenres(), getProfile(), getMyInvites(), getCollaboratedBooks(),
      ]);
      setMyBooks(mine);
      setPublicBooks(pub);
      setGenres(gs as Genre[]);
      setProfile(prof as Profile | null);
      setPendingInvites(invites.data || []);
      setCollabBooks(collab || []);
    });
  }, []);

  // Process pending invite cookie from email link
  useEffect(() => {
    if (!profile) return;
    const processCookie = async () => {
      const match = document.cookie.match(/(?:^|; )pending_invite_id=([^;]*)/);
      if (match && match[1]) {
        const inviteId = match[1];
        document.cookie = "pending_invite_id=; path=/; max-age=0"; // Clear cookie
        const res = await respondToInvite(inviteId, true);
        if (res.success) {
          refreshInvites();
        }
      }
    };
    processCookie();
  }, [profile]);

  const refreshInvites = () => {
    startTransition(async () => {
      const [invites, collab, mine] = await Promise.all([
        getMyInvites(), getCollaboratedBooks(), getMyBooks(),
      ]);
      setPendingInvites(invites.data || []);
      setCollabBooks(collab || []);
      setMyBooks(mine);
    });
  };

  const fetchPublic = useCallback(() => {
    startTransition(async () => {
      const results = await getPublicBooks({ search: search || undefined, genreSlug: selectedGenre || undefined });
      setPublicBooks(results);
    });
  }, [search, selectedGenre]);

  useEffect(() => { if (feed === "public") fetchPublic(); }, [feed, fetchPublic]);

  const displayedBooks = feed === "mine" ? myBooks : publicBooks;
  const filteredBooks = displayedBooks.filter((b) => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = !selectedGenre || b.genres?.some((g) => g.slug === selectedGenre);
    return matchSearch && matchGenre;
  });

  const handleBookAction = (action: "sequel" | "edit" | "delete", book: BookWithMeta) => {
    if (action === "sequel") {
      setInitialParentId(book.id);
      setInitialSeriesId(book.series_id || undefined);
      setShowCreate(true);
    } else if (action === "edit") {
      // Redirect to editor settings or similar
      router.push(`/editor?bookId=${book.id}&settings=true`);
    } else if (action === "delete") {
      if (confirm(t.chapterTree.deleteConfirmMsg || "Bu kitabı silmek istediğinize emin misiniz?")) {
        // deleteBook is imported from actions
        import("@/app/actions/books").then(m => m.deleteBook(book.id)).then(() => {
          setMyBooks(prev => prev.filter(b => b.id !== book.id));
        });
      }
    }
  };

  // Grouping logic for "My Books"
  const seriesGroups = feed === "mine" 
    ? filteredBooks.reduce((acc, book) => {
        const seriesName = book.series?.name || "Individual Stories";
        if (!acc[seriesName]) acc[seriesName] = [];
        acc[seriesName].push(book);
        return acc;
      }, {} as Record<string, BookWithMeta[]>)
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">Booktions</span>
          </div>

          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            {([["mine", <Lock key="l" className="w-3 h-3" />, t.books.myBooks],
               ["public", <Globe key="g" className="w-3 h-3" />, t.books.discover]] as const).map(([f, icon, label]) => (
              <button key={f} onClick={() => setFeed(f as Feed)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  feed === f ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}>
                {icon}{label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <NotificationsDropdown />
            {profile?.display_name && <span className="text-xs text-zinc-500 hidden sm:block">{profile.display_name}</span>}
            <button onClick={() => startTransition(() => signOut())} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && feed === "public" && fetchPublic()}
              placeholder={t.books.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-900/30">
            <Plus className="w-4 h-4" /> {t.books.newBook}
          </button>
        </div>

        {/* Genre filters */}
        {genres.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button onClick={() => setSelectedGenre(null)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-all",
                !selectedGenre ? "bg-zinc-700 border-zinc-600 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
              {t.books.allGenres}
            </button>
            {genres.map((g) => (
              <button key={g.id} onClick={() => setSelectedGenre(selectedGenre === g.slug ? null : g.slug)}
                className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                  selectedGenre === g.slug ? "bg-violet-600 border-violet-500 text-white" : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300")}>
                {g.emoji} {g.labels["en"] ?? g.labels["tr"]}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
            {feed === "mine" ? t.books.myBooks : t.books.discover}
            {filteredBooks.length > 0 && <span className="ml-2 text-zinc-600 normal-case font-normal tracking-normal">({filteredBooks.length})</span>}
          </h1>
        </div>

        {isPending ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => <div key={i} className="h-60 rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse" />)}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-zinc-500 text-sm mb-2">
              {search || selectedGenre ? t.books.noBooksSearch : feed === "mine" ? t.books.noBooks : t.books.noPublic}
            </p>
            {feed === "mine" && !search && (
              <button onClick={() => setShowCreate(true)}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition">
                <Plus className="w-4 h-4" /> {t.books.createFirst}
              </button>
            )}
          </div>
        ) : feed === "mine" && seriesGroups ? (
          <div className="space-y-12">
            {Object.entries(seriesGroups).map(([name, books]) => (
              <section key={name}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {name === "Individual Stories" ? (
                      <BookOpen className="w-5 h-5 text-zinc-500" />
                    ) : (
                      <div className="w-2 h-6 bg-violet-600 rounded-full" />
                    )}
                    {name}
                  </h2>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {books.sort((a,b) => (a.series_order || 0) - (b.series_order || 0)).map((book) => (
                    <BookCard key={book.id} book={book} onAction={handleBookAction} />
                  ))}
                </div>
              </section>
            ))}

            {/* Collaborated Books Section */}
            {collabBooks.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-6 bg-pink-500 rounded-full" />
                    {t.collaborators.collaborated}
                  </h2>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {collabBooks.map((book: any) => (
                    <BookCard key={book.id} book={book} showAuthor onAction={handleBookAction} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} showAuthor={feed === "public"} onAction={handleBookAction} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateBookDialog 
          genres={genres} 
          onClose={() => {
            setShowCreate(false);
            setInitialParentId(undefined);
            setInitialSeriesId(undefined);
          }} 
          initialParentBookId={initialParentId}
          initialSeriesId={initialSeriesId}
        />
      )}
    </div>
  );
}
