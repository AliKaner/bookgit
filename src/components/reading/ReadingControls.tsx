"use client";

import { useState } from "react";
import { Heart, GitBranch, Share2, FileDown, Loader2, Check } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { toggleBookLike } from "@/app/actions/social";
import { forkBook } from "@/app/actions/books";
import { cn } from "@/lib/utils";
import type { BookWithMeta } from "@/types/supabase";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

interface Props {
  book: BookWithMeta;
  chapters: any[];
}

export function ReadingControls({ book, chapters }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [liked, setLiked] = useState(book.isLiked);
  const [likeCount, setLikeCount] = useState(book.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const [forkedId, setForkedId] = useState<string | null>(null);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const res = await toggleBookLike(book.id);
    if (res.success) {
      setLiked(res.isLiked);
      setLikeCount(prev => res.isLiked ? prev + 1 : prev - 1);
    }
    setIsLiking(false);
  };

  const handleFork = async () => {
    if (isForking || forkedId) return;
    if (!confirm(t.entities.fork + "?")) return;
    
    setIsForking(true);
    const res = await forkBook(book.id);
    if (res.bookId) {
      setForkedId(res.bookId);
      setTimeout(() => router.push(`/editor/${res.bookId}`), 1500);
    } else {
      alert(res.error || "Fork failed");
      setIsForking(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: book.description || "",
          url: url,
        });
      } catch (err) {
        console.log("Share skipped");
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    
    // Title
    doc.setFontSize(22);
    doc.text(book.title, 20, y);
    y += 15;
    
    // Author
    doc.setFontSize(12);
    doc.text(`by ${book.profile?.display_name || "Author"}`, 20, y);
    y += 20;

    // Chapters
    chapters.forEach((ch, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(16);
      doc.text(ch.title || `Chapter ${i + 1}`, 20, y);
      y += 10;
      
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(ch.content?.replace(/<[^>]*>/g, "") || "", 170);
      lines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 5;
      });
      y += 15;
    });

    doc.save(`${book.title}.pdf`);
  };

  const exportDocx = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: book.title,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `by ${book.profile?.display_name || "Author"}`,
                italics: true,
              }),
            ],
          }),
          ...chapters.flatMap((ch, i) => [
            new Paragraph({
              text: ch.title || `Chapter ${i+1}`,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              text: ch.content?.replace(/<[^>]*>/g, "") || "",
            }),
          ]),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${book.title}.docx`);
  };

  const exportInk = () => {
    const inkData = {
      title: book.title,
      author: book.profile?.display_name,
      description: book.description,
      chapters: chapters.map(ch => ({
        title: ch.title,
        content: ch.content
      }))
    };
    const blob = new Blob([JSON.stringify(inkData, null, 2)], { type: "application/json" });
    saveAs(blob, `${book.title}.ink`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Like */}
      <button 
        onClick={handleLike}
        disabled={isLiking}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all active:scale-95",
          liked 
            ? "bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]" 
            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
        )}
      >
        <Heart className={cn("w-4 h-4", liked && "fill-current")} />
        <span className="text-xs font-bold">{likeCount}</span>
      </button>

      {/* Fork */}
      <button 
        onClick={handleFork}
        disabled={isForking || !!forkedId}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all active:scale-95 disabled:opacity-50",
          forkedId
            ? "bg-green-500/10 border-green-500/50 text-green-500"
            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
        )}
      >
        {isForking ? <Loader2 className="w-4 h-4 animate-spin" /> : forkedId ? <Check className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
        <span className="text-xs font-bold">{forkedId ? t.entities.forked : t.entities.fork}</span>
      </button>

      {/* Share */}
      <button 
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-all active:scale-95"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-xs font-bold">{t.entities.share}</span>
      </button>

      {/* Export Dropdown (Simple version) */}
      <div className="relative group">
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-all active:scale-95">
          <FileDown className="w-4 h-4" />
          <span className="text-xs font-bold">{t.entities.export}</span>
        </button>
        
        <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-50 overflow-hidden">
          <button onClick={exportPDF} className="w-full px-4 py-3 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2 border-b border-zinc-800/50">
            <span className="w-6 text-center font-bold text-[10px] bg-red-500/10 text-red-500 rounded px-1">PDF</span>
            {t.entities.pdf}
          </button>
          <button onClick={exportDocx} className="w-full px-4 py-3 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2 border-b border-zinc-800/50">
            <span className="w-6 text-center font-bold text-[10px] bg-blue-500/10 text-blue-500 rounded px-1">DOCX</span>
            {t.entities.docx}
          </button>
          <button onClick={exportInk} className="w-full px-4 py-3 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2">
            <span className="w-6 text-center font-bold text-[10px] bg-violet-500/10 text-violet-500 rounded px-1">INK</span>
            {t.entities.ink}
          </button>
        </div>
      </div>
    </div>
  );
}
