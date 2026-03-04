"use client";

import { EntityGrid } from "@/components/entities/EntityGrid";
import { useTranslation } from "@/contexts/LanguageContext";

export default function CharactersPage() {
  const { t, locale } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-950">
      <EntityGrid 
        type="character" 
        title={t.entities.characters}
        description={locale === 'tr' 
          ? "Hikayeleriniz için en ilginç karakterleri keşfedin, beğenin ve kendi kitabınıza daldırın."
          : "Discover the most interesting characters for your stories, like them, and add them to your own book."
        }
      />
    </div>
  );
}
