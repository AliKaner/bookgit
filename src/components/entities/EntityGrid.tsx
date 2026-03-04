"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { EntityCard } from "./EntityCard";
import { getPublicEntities, EntityType } from "@/app/actions/entities";
import { useTranslation } from "@/contexts/LanguageContext";

interface EntityGridProps {
  type: EntityType;
  title: string;
  description: string;
}

export function EntityGrid({ type, title, description }: EntityGridProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchItems = useCallback(async (query: string) => {
    setLoading(true);
    const res = await getPublicEntities(type, { search: query });
    if (res.data) {
      setItems(res.data);
    }
    setLoading(false);
  }, [type]);

  useEffect(() => {
    fetchItems("");
  }, [fetchItems]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    startTransition(() => {
      fetchItems(val);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
          {title}
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          {description}
        </p>
      </div>

      <div className="relative mb-10 max-w-xl">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-zinc-500" />
        </div>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder={t.entities.searchPlaceholder}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-zinc-600 shadow-xl shadow-black/20"
        />
        {(loading || isPending) && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
          </div>
        )}
      </div>

      {items.length === 0 && !loading ? (
        <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
          <p className="text-zinc-500">{t.entities.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <EntityCard key={item.id} type={type} item={item} />
          ))}
          {loading && items.length === 0 && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl h-[280px] animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
