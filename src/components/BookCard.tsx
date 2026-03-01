"use client";

import { useState } from "react";
import { Globe, Lock, BookOpen, GitBranch, MoreVertical, PlusCircle, Pencil, Trash2, Library } from "lucide-react";
import Link from "next/link";
import type { BookWithMeta } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface Props {
  book: BookWithMeta;
  showAuthor?: boolean;
  onAction?: (action: "sequel" | "edit" | "delete", book: BookWithMeta) => void;
}

export function BookCard({ book, showAuthor = false, onAction }: Props) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const genre = book.genres?.[0];
  const words = book.stats?.word_count ?? 0;
  const chapters = book.stats?.chapter_count ?? 0;
  const branches = book.stats?.branch_count ?? 0;

  const handleAction = (e: React.MouseEvent, action: "sequel" | "edit" | "delete") => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    onAction?.(action, book);
  };

  return (
    <Link href={`/books/${book.id}`}
      className="group block rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 bg-zinc-900 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40">
      {/* Cover */}
      <div className="relative h-40 overflow-hidden" style={{ background: book.cover_image_url ? "transparent" : book.cover_color }}>
        {book.cover_image_url
          ? <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="absolute inset-0 flex items-center justify-center opacity-10"><BookOpen className="w-16 h-16 text-white" /></div>}

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm border",
            book.visibility === "public"
              ? "bg-violet-900/60 border-violet-700/50 text-violet-300"
              : "bg-zinc-900/60 border-zinc-700/50 text-zinc-400")}>
            {book.visibility === "public" ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
            {book.visibility === "public" ? t.bookCard.public : t.bookCard.private}
          </div>

          {!showAuthor && onAction && (
            <div className="relative">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white transition-colors"
                title="İşlemler"
              >
                <MoreVertical className="w-3 h-3" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in duration-150">
                    <button onClick={(e) => handleAction(e, "sequel")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">
                      <PlusCircle className="w-3 h-3 text-emerald-400" /> {t.createBook.sequelOf || "Devam Kitabı"}
                    </button>
                    <button onClick={(e) => handleAction(e, "edit")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">
                      <Pencil className="w-3 h-3 text-blue-400" /> {t.common.edit}
                    </button>
                    <button onClick={(e) => handleAction(e, "delete")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3 h-3" /> {t.common.delete}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {genre && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 backdrop-blur-sm border border-white/10 text-zinc-300">
              {genre.emoji} {genre.labels["en"] ?? genre.labels["tr"]}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        {book.series && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">
              <Library className="w-2.5 h-2.5" /> {book.series.name} #{book.series_order || 1}
            </span>
          </div>
        )}
        <h3 className="font-semibold text-sm text-white line-clamp-1 mb-1 group-hover:text-violet-300 transition-colors">{book.title}</h3>
        {showAuthor && book.profile?.display_name && (
          <p className="text-[11px] text-zinc-500 mb-1.5">{book.profile.display_name}</p>
        )}
        {book.description && <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed">{book.description}</p>}

        <div className="flex items-center gap-3 text-[10px] text-zinc-600">
          {chapters > 0 && <span>{chapters} {t.bookCard.chapters}</span>}
          {branches > 0 && <span className="flex items-center gap-0.5"><GitBranch className="w-2.5 h-2.5" /> {branches} {t.bookCard.branch}</span>}
          {words > 0 && <span>{words.toLocaleString()} {t.bookCard.words}</span>}
        </div>

        {(book.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {book.tags!.slice(0, 4).map((tag) => (
              <span key={tag.id} className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-500">#{tag.name}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
