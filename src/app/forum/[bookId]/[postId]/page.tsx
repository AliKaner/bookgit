import { getForumPost } from "@/app/actions/forum";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Crown,
  User,
  Clock,
  MessageSquare,
} from "lucide-react";
import type { Metadata } from "next";
import { ForumReplyForm } from "@/components/forum/ForumReplyForm";

interface Props {
  params: Promise<{ bookId: string; postId: string }>;
}

export default async function ForumPostPage({ params }: Props) {
  const { bookId, postId } = await params;
  const result = await getForumPost(postId);

  if (!result || result.error || !result.post) notFound();

  const { post, replies = [] } = result;
  const postProfile = post.profile as {
    display_name?: string;
    avatar_url?: string;
    username?: string;
  } | null;
  const book = post.book as { id: string; title: string; user_id: string } | null;
  const isAuthor = post.user_id === book?.user_id;

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
            href={`/forum/${bookId}`}
            className="group flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition text-sm font-medium"
          >
            <div className="p-1.5 rounded-lg border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="hidden sm:block">Forum</span>
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

      <main className="relative max-w-3xl mx-auto px-6 py-12">
        {/* Original Post */}
        <article className="mb-10 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          {/* Author */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
              {postProfile?.avatar_url ? (
                <img
                  src={postProfile.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-zinc-200">
                  {postProfile?.display_name ||
                    postProfile?.username ||
                    "Anonymous"}
                </span>
                {isAuthor && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-wide">
                    <Crown className="w-2.5 h-2.5" />
                    Author
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-600 flex items-center gap-1 mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                {new Date(post.created_at).toLocaleDateString("en", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Post content */}
          <h1 className="text-xl font-black text-white mb-4">{post.title}</h1>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </article>

        {/* Replies */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-bold text-zinc-300">
              {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
            </span>
          </div>

          {replies.length === 0 ? (
            <p className="text-center py-10 text-zinc-600 text-sm italic">
              No replies yet. Start the conversation!
            </p>
          ) : (
            <div className="space-y-4">
              {replies.map((reply: any) => {
                const replyProfile = reply.profile as {
                  display_name?: string;
                  avatar_url?: string;
                  username?: string;
                } | null;
                const replyIsAuthor = reply.user_id === book?.user_id;

                return (
                  <div
                    key={reply.id}
                    className="flex gap-3 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
                      {replyProfile?.avatar_url ? (
                        <img
                          src={replyProfile.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-zinc-300">
                          {replyProfile?.display_name ||
                            replyProfile?.username ||
                            "Anonymous"}
                        </span>
                        {replyIsAuthor && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-wide">
                            <Crown className="w-2 h-2" />
                            Author
                          </span>
                        )}
                        <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                          <Clock className="w-2 h-2" />
                          {new Date(reply.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reply Form */}
        <ForumReplyForm postId={postId} bookId={bookId} />
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const result = await getForumPost(postId);
  if (!result?.post) return { title: "Discussion — Booktions" };
  return {
    title: `${result.post.title} — Booktions Forum`,
  };
}
