import { getForumPosts } from "@/app/actions/forum";
import { getPublicBookForReading } from "@/app/actions/reading";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  BookOpen,
  Crown,
  PlusCircle,
  User,
  Clock,
} from "lucide-react";
import type { Metadata } from "next";
import { CreatePostModal } from "@/components/forum/CreatePostModal";

interface Props {
  params: Promise<{ bookId: string }>;
}

export default async function ForumPage({ params }: Props) {
  const { bookId } = await params;

  const [bookData, postsRes] = await Promise.all([
    getPublicBookForReading(bookId),
    getForumPosts(bookId),
  ]);

  if (!bookData) notFound();

  const { book } = bookData;
  const posts = postsRes.data || [];

  const profile = book.profiles as unknown as {
    display_name?: string;
    avatar_url?: string;
    username?: string;
  } | null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/8 blur-[120px] rounded-full opacity-50" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href={`/read/${bookId}`}
            className="group flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition text-sm font-medium"
          >
            <div className="p-1.5 rounded-lg border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="hidden sm:block">Back to Book</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              Booktions
            </span>
          </div>

          <div className="w-24" />
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Forum Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-5 h-5 text-violet-400" />
            <span className="text-[10px] text-violet-400 font-black uppercase tracking-[0.3em]">
              Community Forum
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{book.title}</h1>
          <p className="text-zinc-500 text-sm">
            Discuss the book with the author and other readers.
          </p>
        </div>

        {/* Create Post Button */}
        <div className="mb-8">
          <CreatePostModal bookId={bookId} />
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500 text-sm font-medium">
              No discussions yet.
            </p>
            <p className="text-zinc-700 text-xs mt-1">
              Be the first to start a conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post: any) => {
              const postProfile = post.profile as {
                display_name?: string;
                avatar_url?: string;
                username?: string;
              } | null;
              const isAuthor = post.user_id === book.user_id;

              return (
                <Link
                  key={post.id}
                  href={`/forum/${bookId}/${post.id}`}
                  className="group block p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
                      {postProfile?.avatar_url ? (
                        <img
                          src={postProfile.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Author row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-300">
                          {postProfile?.display_name ||
                            postProfile?.username ||
                            "Anonymous"}
                        </span>
                        {isAuthor && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-wide">
                            <Crown className="w-2.5 h-2.5" />
                            Author
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Post title */}
                      <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors mb-1 truncate">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-xs text-zinc-500 line-clamp-2">
                        {post.content}
                      </p>
                    </div>

                    {/* Reply count */}
                    <div className="flex items-center gap-1.5 text-zinc-600 flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{post.reply_count}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId } = await params;
  const data = await getPublicBookForReading(bookId);
  if (!data) return { title: "Forum — Booktions" };
  return {
    title: `${data.book.title} Forum — Booktions`,
    description: `Community forum for "${data.book.title}" on Booktions.`,
  };
}
