"use client";

import { useState, useRef, useTransition } from "react";
import { X, Plus, Globe, Lock, Loader2, Upload, Palette } from "lucide-react";
import { createBook, type CreateBookInput } from "@/app/actions/books";
import type { Genre } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/contexts/LanguageContext";

const COVER_COLORS = [
  "#1e293b","#0f172a","#1a1a2e","#16213e","#0d1b2a",
  "#1e1b4b","#2d1b69","#134e4a","#14532d","#431407",
  "#450a0a","#1c0533","#0c1a0e","#1a0a2e","#0a1628",
];

interface Props { genres: Genre[]; onClose: () => void; }

export function CreateBookDialog({ genres, onClose }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleGenre(id: number) {
    setSelectedGenres((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  }
  function addTag(raw: string) {
    const t = raw.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) setTags((prev) => [...prev, t]);
    setTagInput("");
  }
  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    else if (e.key === "Backspace" && !tagInput && tags.length) setTags((prev) => prev.slice(0, -1));
  }
  function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      const input: CreateBookInput = { title, description, coverColor, visibility, genreIds: selectedGenres, tagNames: tags };
      const result = await createBook(input);
      if (result.error) { setError(result.error); return; }
      if (coverFile && result.bookId) {
        const { uploadBookCover } = await import("@/app/actions/books");
        await uploadBookCover(result.bookId, coverFile);
      }
      router.push(`/books/${result.bookId}`);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">{t.createBook.title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Cover + title row */}
            <div className="flex gap-4">
              <div className="relative w-24 h-32 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group ring-2 ring-white/10"
                style={{ background: coverPreview ? "transparent" : coverColor }} onClick={() => fileRef.current?.click()}>
                {coverPreview
                  ? <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                  : <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition bg-black/40">
                      <Upload className="w-4 h-4 text-white" />
                      <span className="text-[10px] text-white">{t.createBook.coverUpload}</span>
                    </div>}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t.createBook.bookTitle}</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200}
                    placeholder={t.createBook.bookTitlePlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> {t.createBook.coverColor}
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {COVER_COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setCoverColor(c)}
                        className={cn("w-6 h-6 rounded-md ring-offset-zinc-900 transition-all",
                          coverColor === c ? "ring-2 ring-violet-400 ring-offset-2 scale-110" : "hover:scale-105")}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t.createBook.description}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3}
                placeholder={t.createBook.descriptionPlaceholder}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition resize-none"
              />
              <span className="text-[10px] text-zinc-600 float-right">{description.length}{t.createBook.charCount}</span>
            </div>

            {/* Genres */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">{t.createBook.genre}</label>
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => {
                  const active = selectedGenres.includes(g.id);
                  const disabled = !active && selectedGenres.length >= 3;
                  return (
                    <button key={g.id} type="button" disabled={disabled} onClick={() => toggleGenre(g.id)}
                      className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                        active ? "bg-violet-600 border-violet-500 text-white"
                          : disabled ? "border-zinc-800 text-zinc-600 cursor-not-allowed"
                          : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white")}>
                      <span>{g.emoji}</span>
                      <span>{g.labels["en"] ?? g.labels["tr"]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t.createBook.tags}</label>
              <div className="flex flex-wrap gap-1.5 items-center p-2 rounded-lg bg-zinc-800 border border-zinc-700 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500/30 transition min-h-[42px]">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-700 text-white text-xs">
                    #{tag}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== tag))} className="text-zinc-400 hover:text-white">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {tags.length < 10 && (
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKey}
                    onBlur={() => tagInput && addTag(tagInput)}
                    placeholder={tags.length === 0 ? t.createBook.tagsPlaceholder : ""}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none min-w-[120px]"
                  />
                )}
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">{t.createBook.tagsHint}</p>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">{t.createBook.visibility}</label>
              <div className="flex gap-2">
                {(["private", "public"] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setVisibility(v)}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                      visibility === v
                        ? v === "private" ? "bg-zinc-700 border-zinc-600 text-white" : "bg-violet-600/20 border-violet-500 text-violet-300"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300")}>
                    {v === "private" ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                    {v === "private" ? t.createBook.visibilityPrivate : t.createBook.visibilityPublic}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-600 mt-1.5">
                {visibility === "public" ? t.createBook.visibilityPublicHint : t.createBook.visibilityPrivateHint}
              </p>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">{error}</p>}
          </div>

          <div className="flex gap-2 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition">
              {t.createBook.cancel}
            </button>
            <button type="submit" disabled={isPending || !title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t.createBook.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
