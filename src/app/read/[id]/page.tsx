import { getPublicBookForReading } from "@/app/actions/reading";
import { getBookComments } from "@/app/actions/social";
import { getSectionInteractions } from "@/app/actions/sections";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  GitBranch,
  Globe,
  Calendar,
  User as UserIcon,
  MessageSquare,
} from "lucide-react";
import type { Metadata } from "next";
import { ReadingControls } from "@/components/reading/ReadingControls";
import { CommentsSection } from "@/components/reading/CommentsSection";
import { ReadingChapters } from "@/components/reading/ReadingChapters";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReadPage({ params }: Props) {
  const { id } = await params;
  const data = await getPublicBookForReading(id);

  if (!data) notFound();

  const { book, chapters } = data;

  const [commentsRes, sectionData, supabase] = await Promise.all([
    getBookComments(id),
    getSectionInteractions(id),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  const initialComments = commentsRes.data || [];

  const profile = (
    book.profiles as unknown as {
      display_name?: string;
      avatar_url?: string;
      username?: string;
    } | null
  );
  const genres = (
    book.book_genres as unknown as {
      genres: { slug: string; emoji: string; labels: Record<string, string> };
    }[]
  ) ?? [];
  const tags =
    (book.book_tags as unknown as { tags: { name: string } }[]) ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full opacity-30" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/books"
            className="group flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition text-sm font-medium"
          >
            <div className="p-1.5 rounded-lg border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="hidden sm:block">Explore Books</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              Booktions
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/forum/${id}`}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-medium border border-white/10 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Forum
            </Link>
            <Link
              href="/login"
              className="text-xs px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Book Header Section */}
        <div className="grid md:grid-cols-[280px_1fr] gap-12 mb-20">
          {/* Left: Cover & basic info */}
          <div className="space-y-6">
            <div
              className="aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/80 sticky top-24"
              style={{
                background: book.cover_image_url
                  ? "transparent"
                  : book.cover_color,
              }}
            >
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 text-center bg-gradient-to-br from-white/10 to-transparent">
                  <h3 className="text-xl font-bold text-white/40 drop-shadow-md">
                    {book.title}
                  </h3>
                </div>
              )}
            </div>
          </div>

          {/* Right: Detailed Info */}
          <div className="pt-4">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-violet-950/40 border border-violet-500/30 text-violet-300 font-bold uppercase tracking-wider">
                <Globe className="w-3 h-3" /> Public
              </span>
              {genres.map((g) => (
                <span
                  key={g.genres.slug}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-bold uppercase tracking-wider"
                >
                  {g.genres.emoji} {g.genres.labels["en"] || g.genres.labels["tr"]}
                </span>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
              {book.title}
            </h1>

            {/* Author Card */}
            <div className="flex items-center gap-4 mb-8 p-3 rounded-2xl bg-white/5 border border-white/5 w-fit">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-zinc-500" />
                )}
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                  Written by
                </span>
                <span className="text-sm font-bold text-white">
                  {profile?.display_name || profile?.username || "Writer"}
                </span>
              </div>
            </div>

            {/* Fork Info */}
            {book.parent_book_id && (
              <div className="mb-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3 items-start">
                <GitBranch className="w-4 h-4 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-300 font-medium">
                    Forked from another book
                  </p>
                  <Link
                    href={`/read/${book.parent_book_id}`}
                    className="text-blue-400 hover:text-blue-200 text-sm font-bold underline decoration-blue-500/30 underline-offset-4 transition"
                  >
                    View original version
                  </Link>
                </div>
              </div>
            )}

            {book.description && (
              <div className="relative mb-10">
                <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl italic">
                  "{book.description}"
                </p>
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-violet-600/20 rounded-full" />
              </div>
            )}

            {/* Stats & Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10 border-t border-zinc-900 pt-8">
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">
                  Chapters
                </span>
                <span className="text-xl font-bold text-white">
                  {chapters.length}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">
                  Created
                </span>
                <span className="text-sm font-medium text-zinc-300 flex items-center gap-1.5 h-7">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(book.created_at).getFullYear()}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span key={t.tags.name} className="text-[10px] text-zinc-400">
                      #{t.tags.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <ReadingControls book={book as any} chapters={chapters} />
          </div>
        </div>

        {/* Chapters Section with Section Likes */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-16">
            <div className="h-px flex-1 bg-zinc-800" />
            <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-zinc-800 text-zinc-500 uppercase text-[10px] font-black tracking-[0.3em]">
              Contents
            </div>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-20 text-zinc-700 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">This book has no chapters yet.</p>
            </div>
          ) : (
            <ReadingChapters
              bookId={id}
              chapters={chapters}
              initialLikes={sectionData.likes}
              initialComments={sectionData.comments as any}
              currentUserId={user?.id ?? null}
            />
          )}

          {/* Book-level Comments Section */}
          <CommentsSection bookId={id} initialComments={initialComments} />

          {/* Forum CTA */}
          <div className="mt-16 mb-8 p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-4 text-violet-400/50" />
            <h3 className="text-lg font-bold text-white mb-2">
              Join the Discussion
            </h3>
            <p className="text-zinc-500 text-sm mb-6">
              Share theories, ask questions, and connect with other readers.
            </p>
            <Link
              href={`/forum/${id}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              Go to Forum
            </Link>
          </div>

          {/* Footer CTA */}
          <div className="mt-16 mb-20 p-12 text-center rounded-3xl bg-gradient-to-b from-zinc-900 to-transparent border border-zinc-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <BookOpen className="w-12 h-12 mx-auto mb-6 text-zinc-700" />
            <h3 className="text-xl font-bold text-white mb-2">
              Inspired by this story?
            </h3>
            <p className="text-zinc-400 text-sm mb-8 max-w-sm mx-auto">
              Create your own world and branch your narratives with BookGit.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all shadow-xl shadow-violet-900/40 active:scale-95"
            >
              Start Your Journey
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicBookForReading(id);
  if (!data) return { title: "Book not found" };
  return {
    title: `${data.book.title} — BookGit`,
    description:
      data.book.description ?? `Read "${data.book.title}" on BookGit.`,
  };
}
