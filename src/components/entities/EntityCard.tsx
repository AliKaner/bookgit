"use client";

import { useState } from "react";
import { Heart, Copy, User, Book, Globe, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import { toggleLike, copyEntity, EntityType } from "@/app/actions/entities";

interface EntityCardProps {
  type: EntityType;
  item: any;
  onLikeToggle?: (id: string, liked: boolean) => void;
}

export function EntityCard({ type, item, onLikeToggle }: EntityCardProps) {
  const { t } = useTranslation();
  const [isLiking, setIsLiking] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [liked, setLiked] = useState(item.isLiked);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [copied, setCopied] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLiking) return;
    setIsLiking(true);
    const res = await toggleLike(type, item.id);
    if (res.success) {
      setLiked(res.liked);
      setLikeCount((prev: number) => res.liked ? prev + 1 : prev - 1);
      if (onLikeToggle) onLikeToggle(item.id, !!res.liked);
    }
    setIsLiking(false);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCopying || copied) return;
    setIsCopying(true);
    const res = await copyEntity(type, item.id);
    if (res.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
    setIsCopying(false);
  };

  const getIcon = () => {
    switch (type) {
      case "character": return <User className="w-4 h-4" />;
      case "dictionary": return <Book className="w-4 h-4" />;
      case "world": return <Globe className="w-4 h-4" />;
    }
  };

  const name = type === "character" ? item.name : type === "dictionary" ? item.word : item.label;
  const sub = type === "character" ? item.role : type === "dictionary" ? item.meaning : item.value;

  return (
    <div className="group relative bg-zinc-900/40 border border-zinc-800 hover:border-violet-500/50 rounded-2xl p-5 transition-all hover:-translate-y-1 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-2 rounded-xl bg-zinc-800/80 text-zinc-400 group-hover:text-violet-400 group-hover:bg-violet-500/10 transition-colors",
            type === "character" && "group-hover:text-blue-400 group-hover:bg-blue-500/10",
            type === "world" && "group-hover:text-emerald-400 group-hover:bg-emerald-500/10"
          )}>
            {getIcon()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full transition-all hover:bg-zinc-800",
                liked ? "text-rose-500 bg-rose-500/5" : "hover:text-rose-400"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />
              <span>{likeCount}</span>
            </button>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-violet-100 transition-colors truncate">
          {name}
        </h3>
        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-4 min-h-[2.5rem]">
          {sub || "..."}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500 overflow-hidden">
            {item.profiles?.avatar_url ? (
              <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              item.profiles?.display_name?.charAt(0) || "U"
            )}
          </div>
          <div className="text-[11px] text-zinc-500">
            <span className="opacity-70">{t.entities.sharedBy}</span>{" "}
            <span className="text-zinc-300 font-medium">{item.profiles?.display_name || "Unknown"}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 italic truncate max-w-[120px]">
            {t.entities.fromBook} {item.book?.title}
          </span>
          <button 
            onClick={handleCopy}
            disabled={isCopying || copied}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              copied 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-zinc-800 hover:bg-violet-600 text-white border border-transparent shadow-lg shadow-black/20"
            )}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.entities.copied.split('!')[0]}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.entities.addToBook}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
