"use client";

import { useState, useCallback } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { toggleSectionLike } from "@/app/actions/sections";
import { SectionCommentsSidebar } from "./SectionCommentsSidebar";
import { cn } from "@/lib/utils";

interface SectionLike {
  chapter_id: string;
  section_idx: number;
  user_id: string;
}

interface SectionComment {
  id: string;
  chapter_id: string;
  section_idx: number;
  content: string;
  created_at: string;
  user_id: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

interface Chapter {
  id: string;
  title: string | null;
  content?: string | null;
}

interface ReadingChaptersProps {
  bookId: string;
  chapters: Chapter[];
  initialLikes: SectionLike[];
  initialComments: SectionComment[];
  currentUserId: string | null;
}

export function ReadingChapters({
  bookId,
  chapters,
  initialLikes,
  initialComments,
  currentUserId,
}: ReadingChaptersProps) {
  const [likes, setLikes] = useState<SectionLike[]>(initialLikes);
  const [comments] = useState<SectionComment[]>(initialComments);
  const [sidebar, setSidebar] = useState<{
    chapterId: string;
    chapterTitle: string;
    sectionIdx: number;
  } | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const getLikeCount = (chapterId: string, sectionIdx: number) =>
    likes.filter(
      (l) => l.chapter_id === chapterId && l.section_idx === sectionIdx
    ).length;

  const isLiked = (chapterId: string, sectionIdx: number) =>
    currentUserId != null &&
    likes.some(
      (l) =>
        l.chapter_id === chapterId &&
        l.section_idx === sectionIdx &&
        l.user_id === currentUserId
    );

  const getCommentCount = (chapterId: string, sectionIdx: number) =>
    comments.filter(
      (c) => c.chapter_id === chapterId && c.section_idx === sectionIdx
    ).length;

  const getSectionComments = (chapterId: string, sectionIdx: number) =>
    comments.filter(
      (c) => c.chapter_id === chapterId && c.section_idx === sectionIdx
    );

  async function handleLike(
    chapterId: string,
    sectionIdx: number,
    e: React.MouseEvent
  ) {
    e.stopPropagation();
    if (!currentUserId) return;

    const alreadyLiked = isLiked(chapterId, sectionIdx);
    // Optimistic update
    if (alreadyLiked) {
      setLikes((prev) =>
        prev.filter(
          (l) =>
            !(
              l.chapter_id === chapterId &&
              l.section_idx === sectionIdx &&
              l.user_id === currentUserId
            )
        )
      );
    } else {
      setLikes((prev) => [
        ...prev,
        { chapter_id: chapterId, section_idx: sectionIdx, user_id: currentUserId },
      ]);
    }

    await toggleSectionLike(bookId, chapterId, sectionIdx);
  }

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "");
  }

  function splitIntoParagraphs(html: string): string[] {
    // Extract paragraph/block content
    const pTagMatches = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) || [];
    if (pTagMatches.length > 0) return pTagMatches;
    // Fallback: split by double newlines
    return html.split(/\n\n+/).filter(Boolean);
  }

  return (
    <>
      <div className="space-y-24">
        {chapters.map((chapter, idx) => {
          const paragraphs = chapter.content
            ? splitIntoParagraphs(chapter.content)
            : [];

          return (
            <article
              key={chapter.id}
              className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both"
            >
              {/* Chapter title */}
              <div className="mb-10 text-center">
                <span className="text-[10px] text-violet-500 font-black uppercase tracking-[0.4em] mb-4 block">
                  Chapter {idx + 1}
                </span>
                <h2 className="text-3xl font-black text-white underline decoration-violet-600/30 underline-offset-8 decoration-4">
                  {chapter.title || `Untitled ${idx + 1}`}
                </h2>
              </div>

              {/* Content with section interactions */}
              {paragraphs.length > 0 ? (
                <div className="prose prose-invert prose-lg max-w-none prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-lg prose-p:mb-8 prose-headings:text-white prose-strong:text-white prose-em:text-zinc-400 prose-blockquote:border-l-violet-600 prose-blockquote:bg-violet-600/5 prose-blockquote:py-4 prose-blockquote:rounded-r-xl">
                  {paragraphs.map((para, sIdx) => {
                    const key = `${chapter.id}-${sIdx}`;
                    const isFirst = sIdx === 0;
                    const likeCount = getLikeCount(chapter.id, sIdx);
                    const commentCount = getCommentCount(chapter.id, sIdx);
                    const liked = isLiked(chapter.id, sIdx);
                    const hovered = hoveredSection === key;

                    return (
                      <div
                        key={key}
                        className="relative group/para"
                        onMouseEnter={() => setHoveredSection(key)}
                        onMouseLeave={() => setHoveredSection(null)}
                      >
                        <div
                          className={cn(
                            "transition-colors duration-200",
                            hovered && "bg-white/[0.02] rounded-lg"
                          )}
                          dangerouslySetInnerHTML={{
                            __html: isFirst
                              ? para.replace(
                                  /^(<p[^>]*>)/,
                                  "$1<span class=\"first-letter:text-6xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-violet-500 first-letter:mt-2\">"
                                ) + "</span>"
                              : para,
                          }}
                        />

                        {/* Section action buttons */}
                        <div
                          className={cn(
                            "absolute -left-16 top-1 flex flex-col gap-1 transition-all duration-200",
                            hovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
                          )}
                        >
                          <button
                            onClick={(e) => handleLike(chapter.id, sIdx, e)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                              liked
                                ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                                : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-pink-400 hover:border-pink-500/30"
                            )}
                            title="Like this paragraph"
                          >
                            <Heart
                              className={cn(
                                "w-3 h-3",
                                liked && "fill-pink-400"
                              )}
                            />
                            {likeCount > 0 && (
                              <span>{likeCount}</span>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              setSidebar({
                                chapterId: chapter.id,
                                chapterTitle:
                                  chapter.title || `Chapter ${idx + 1}`,
                                sectionIdx: sIdx,
                              })
                            }
                            className={cn(
                              "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                              "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-violet-400 hover:border-violet-500/30"
                            )}
                            title="Comment on this paragraph"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {commentCount > 0 && (
                              <span>{commentCount}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : chapter.content ? (
                <div
                  className="prose prose-invert prose-lg max-w-none prose-p:text-zinc-300 prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: chapter.content }}
                />
              ) : (
                <p className="text-zinc-600 italic text-center text-sm py-10 bg-zinc-900/20 rounded-2xl border border-zinc-800/50">
                  Chapter content is empty...
                </p>
              )}

              {/* Divider */}
              <div className="mt-20 flex justify-center">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-600/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Section Comments Sidebar */}
      {sidebar && (
        <SectionCommentsSidebar
          bookId={bookId}
          chapterId={sidebar.chapterId}
          chapterTitle={sidebar.chapterTitle}
          sectionIdx={sidebar.sectionIdx}
          onClose={() => setSidebar(null)}
          initialComments={getSectionComments(
            sidebar.chapterId,
            sidebar.sectionIdx
          )}
        />
      )}
    </>
  );
}
