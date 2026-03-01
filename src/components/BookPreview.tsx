"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { X, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useEditorStore, WORDS_PER_A5_PAGE } from "@/store/useEditorStore";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

// A5 page dimensions in px (at 96dpi: 148mm=559px, 210mm=794px, but we'll use a fixed display size)
// We'll render at a fixed height and derive width from A5 ratio
const PAGE_HEIGHT_PX = 520;
const PAGE_WIDTH_PX = Math.round(PAGE_HEIGHT_PX / 1.4142); // ~368px
// Page body area (subtract top padding + chapter title space + footer)
const PAGE_PADDING_TOP = 40;
const PAGE_PADDING_BOTTOM = 48; // includes footer
const PAGE_PADDING_H = 40; // left+right = 80px total
const BODY_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM;
const BODY_WIDTH_PX = PAGE_WIDTH_PX - PAGE_PADDING_H * 2;

// Font metrics at 13px/1.75 line-height = ~22.75px per line
// ~BODY_WIDTH_PX / (13 * 0.55) ≈ chars per line, then lines_per_page = BODY_HEIGHT_PX / 22.75
const LINE_HEIGHT_PX = 13 * 1.75; // 22.75px
const CHARS_PER_LINE = Math.floor(BODY_WIDTH_PX / (13 * 0.55)); // ~42 chars at 13px serif
const LINES_PER_PAGE = Math.floor(BODY_HEIGHT_PX / LINE_HEIGHT_PX); // ~20 lines
// Approx words per page based on geometry (~6 chars/word avg + space)
const GEOMETRY_WORDS_PER_PAGE = Math.floor(LINES_PER_PAGE * CHARS_PER_LINE / 7);

interface BookPage {
  chapterId: string;
  chapterTitle: string;
  isFirstPageOfChapter: boolean;
  words: string[];
  pageNumber: number;
}

/** Paginate all chapters sequentially – every chapter shown regardless of branching */
function buildAllPages(
  chapters: { id: string; title: string; content: string; order: number; parentId: string | null }[]
): BookPage[] {
  // Show all chapters ordered: first by depth/root order, then linear order
  // Simple approach: depth-first traversal of chapter tree by parentId + order
  const byId = new Map(chapters.map(c => [c.id, c]));

  function children(pid: string | null) {
    return chapters.filter(c => c.parentId === pid).sort((a, b) => a.order - b.order);
  }

  const ordered: typeof chapters = [];
  function dfs(pid: string | null) {
    for (const ch of children(pid)) {
      ordered.push(ch);
      dfs(ch.id);
    }
  }
  dfs(null);

  const allPages: BookPage[] = [];

  for (const ch of ordered) {
    const plainText = ch.content
      ? ch.content.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
      : '';
    const words = plainText ? plainText.split(' ').filter(Boolean) : [];

    // First page of chapter: reserve ~2 lines for title
    const titleReserveLines = ch.title ? 3 : 0; // title takes ~2 lines + margin
    const firstPageWords = Math.max(1, GEOMETRY_WORDS_PER_PAGE - Math.ceil(titleReserveLines * CHARS_PER_LINE / 7));

    if (words.length === 0) {
      allPages.push({
        chapterId: ch.id,
        chapterTitle: ch.title,
        isFirstPageOfChapter: true,
        words: [],
        pageNumber: allPages.length + 1,
      });
      continue;
    }

    let offset = 0;
    let isFirst = true;
    while (offset < words.length) {
      const capacity = isFirst ? firstPageWords : GEOMETRY_WORDS_PER_PAGE;
      const pageWords = words.slice(offset, offset + capacity);
      allPages.push({
        chapterId: ch.id,
        chapterTitle: ch.title,
        isFirstPageOfChapter: isFirst,
        words: pageWords,
        pageNumber: allPages.length + 1,
      });
      offset += capacity;
      isFirst = false;
    }
  }

  // Pad to even number for spread view
  if (allPages.length % 2 !== 0) {
    allPages.push({
      chapterId: '',
      chapterTitle: '',
      isFirstPageOfChapter: false,
      words: [],
      pageNumber: allPages.length + 1,
    });
  }

  return allPages;
}

interface BookPreviewProps {
  onClose: () => void;
}

export function BookPreview({ onClose }: BookPreviewProps) {
  const { t } = useTranslation();
  const { chapters, styles } = useEditorStore();
  const [spread, setSpread] = useState(0);

  // Chapters sorted by all (not just active branch)
  const allPages = buildAllPages(chapters);
  const totalSpreads = Math.max(1, Math.ceil(allPages.length / 2));

  const leftPage = allPages[spread * 2];
  const rightPage = allPages[spread * 2 + 1];

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setSpread(s => Math.min(totalSpreads - 1, s + 1));
      if (e.key === 'ArrowLeft') setSpread(s => Math.max(0, s - 1));
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, totalSpreads]);

  const titleFamily = styles.titleFont === 'serif' ? 'Georgia, serif'
    : styles.titleFont === 'mono' ? 'monospace' : 'system-ui, sans-serif';
  const bodyFamily = styles.bodyFont === 'serif' ? 'Georgia, serif'
    : styles.bodyFont === 'mono' ? 'monospace' : 'system-ui, sans-serif';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/92 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between w-full max-w-4xl px-6 py-3 mb-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-zinc-300">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">{t.preview.title}</span>
          <span className="text-xs text-zinc-500 ml-2">
            {spread * 2 + 1}–{Math.min(spread * 2 + 2, allPages.length)} {t.preview.of} {allPages.length} {t.preview.page}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Pages spread */}
      <div
        className="flex items-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setSpread(s => Math.max(0, s - 1))}
          disabled={spread === 0}
          className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all disabled:opacity-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <PageCard page={leftPage} titleFamily={titleFamily} bodyFamily={bodyFamily} side="left" />

        {/* Book spine */}
        <div className="w-px self-stretch bg-zinc-700/40" />

        <PageCard page={rightPage} titleFamily={titleFamily} bodyFamily={bodyFamily} side="right" />

        <button
          onClick={() => setSpread(s => Math.min(totalSpreads - 1, s + 1))}
          disabled={spread === totalSpreads - 1}
          className="p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all disabled:opacity-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Spread indicator dots */}
      <div
        className="flex items-center gap-1.5 mt-5"
        onClick={e => e.stopPropagation()}
      >
        {Array.from({ length: totalSpreads }).map((_, i) => (
          <button
            key={i}
            onClick={() => setSpread(i)}
            className={cn(
              "rounded-full transition-all",
              i === spread ? "w-4 h-1.5 bg-zinc-300" : "w-1.5 h-1.5 bg-zinc-600 hover:bg-zinc-400"
            )}
          />
        ))}
      </div>

      <p className="text-xs text-zinc-600 mt-3">← → · Esc</p>
    </div>
  );
}

interface PageCardProps {
  page: BookPage | undefined;
  titleFamily: string;
  bodyFamily: string;
  side: 'left' | 'right';
}

function PageCard({ page, titleFamily, bodyFamily, side }: PageCardProps) {
  const isEmpty = !page || page.words.length === 0;

  return (
    <div
      className={cn(
        "relative flex flex-col bg-[#fafaf8] dark:bg-[#1e1e1e] flex-shrink-0 overflow-hidden",
        "shadow-2xl border border-zinc-200/20 dark:border-zinc-700/20",
      )}
      style={{
        width: PAGE_WIDTH_PX,
        height: PAGE_HEIGHT_PX,
        borderRadius: side === 'left' ? '8px 2px 2px 8px' : '2px 8px 8px 2px',
      }}
    >
      {/* Content area – fixed height, no overflow scroll */}
      <div
        className="flex-1 px-10 pt-10 pb-0"
        style={{
          height: PAGE_HEIGHT_PX - PAGE_PADDING_BOTTOM,
          overflow: 'hidden',
        }}
      >
        {isEmpty ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ) : (
          <>
            {page.isFirstPageOfChapter && page.chapterTitle && (
              <h2
                className="text-center font-bold mb-5 text-zinc-800 dark:text-zinc-100"
                style={{ fontFamily: titleFamily, fontSize: 16, lineHeight: '1.4' }}
              >
                {page.chapterTitle}
              </h2>
            )}
            <p
              className="text-zinc-800 dark:text-zinc-200"
              style={{
                fontFamily: bodyFamily,
                fontSize: 13,
                lineHeight: LINE_HEIGHT_PX + 'px',
                wordBreak: 'break-word',
                hyphens: 'auto',
              }}
            >
              {page.words.join(' ')}
            </p>
          </>
        )}
      </div>

      {/* Footer with page number */}
      <div
        className="flex items-center px-10"
        style={{ height: PAGE_PADDING_BOTTOM }}
      >
        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
        {page && (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-600 px-3 font-medium">
            {page.pageNumber}
          </span>
        )}
        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
