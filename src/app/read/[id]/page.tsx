import { getPublicBookForReading } from "@/app/actions/reading";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft, GitBranch, Globe } from "lucide-react";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export default async function ReadPage({ params }: Props) {
  const { id } = await params;
  const data = await getPublicBookForReading(id);

  if (!data) notFound();

  const { book, chapters } = data;
  const profile = (book.profiles as unknown as { display_name?: string; avatar_url?: string } | null);
  const genres = (book.book_genres as unknown as { genres: { slug: string; emoji: string; labels: Record<string, string> } }[]) ?? [];
  const tags = (book.book_tags as unknown as { tags: { name: string } }[]) ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/6 blur-[100px] rounded-full" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-13 flex items-center justify-between py-3">
          <Link href="/books" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Back to Books</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-300">BookGit</span>
          </div>
          <Link href="/login" className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition">
            Sign In
          </Link>
        </div>
      </header>

      {/* Book header */}
      <div className="relative border-b border-zinc-800/60">
        <div className="max-w-3xl mx-auto px-6 py-12 flex gap-8 items-start">
          {/* Cover */}
          <div className="flex-shrink-0 w-28 h-40 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/60"
            style={{ background: book.cover_image_url ? "transparent" : book.cover_color }}>
            {book.cover_image_url && (
              <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-900/30 border border-violet-800/40 text-violet-300 font-medium">
                <Globe className="w-2.5 h-2.5" /> Public
              </span>
              {genres[0] && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {genres[0].genres.emoji} {genres[0].genres.labels["en"] ?? genres[0].genres.labels["tr"]}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{book.title}</h1>

            {profile?.display_name && (
              <p className="text-sm text-zinc-400 mb-3">by <span className="text-zinc-300 font-medium">{profile.display_name}</span></p>
            )}

            {book.description && (
              <p className="text-sm text-zinc-500 leading-relaxed mb-4 max-w-lg">{book.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {chapters.length > 0 && (
                <span className="text-xs text-zinc-600 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" /> {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
                </span>
              )}
              {tags.slice(0, 5).map((t) => (
                <span key={t.tags.name} className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-500">#{t.tags.name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter list + content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {chapters.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No chapters yet.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {chapters.map((chapter, idx) => (
              <article key={chapter.id} className="group">
                {/* Chapter heading */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/60">
                  <span className="text-xs font-mono text-zinc-600 w-6">{idx + 1}</span>
                  <h2 className="text-xl font-bold text-white">{chapter.title || `Chapter ${idx + 1}`}</h2>
                </div>

                {/* Chapter content */}
                {chapter.content ? (
                  <div
                    className="prose prose-invert prose-sm max-w-none
                      prose-p:text-zinc-300 prose-p:leading-8 prose-p:text-base
                      prose-headings:text-white prose-h1:text-2xl prose-h2:text-xl
                      prose-strong:text-white prose-em:text-zinc-400
                      prose-blockquote:border-l-violet-600 prose-blockquote:text-zinc-400
                      prose-code:text-violet-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                      [&_p]:mb-5 first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:leading-none first-letter:text-violet-400"
                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                  />
                ) : (
                  <p className="text-zinc-600 italic text-sm">This chapter has no content yet.</p>
                )}
              </article>
            ))}
          </div>
        )}

        {/* CTA at bottom */}
        <div className="mt-24 border-t border-zinc-800 pt-12 text-center">
          <div className="inline-block bg-zinc-900 border border-zinc-800 rounded-2xl px-8 py-8">
            <p className="text-zinc-400 text-sm mb-4">Want to write your own book?</p>
            <Link href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-900/30">
              Start Writing Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicBookForReading(id);
  if (!data) return { title: "Book not found" };
  return {
    title: `${data.book.title} — BookGit`,
    description: data.book.description ?? `Read "${data.book.title}" on BookGit.`,
  };
}
