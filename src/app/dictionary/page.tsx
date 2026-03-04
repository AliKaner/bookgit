"use client";

import { EntityGrid } from "@/components/entities/EntityGrid";
import { useTranslation } from "@/contexts/LanguageContext";

export default function DictionaryPage() {
  const { t, locale } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-950">
      <EntityGrid 
        type="dictionary" 
        title={t.entities.dictionary}
        description={locale === 'tr'
          ? "Zengin terimler ve anlamları. Evreniniz için hazır kelimeler ve kavramlar."
          : "Rich terms and meanings. Ready-to-use words and concepts for your universe."
        }
      />
    </div>
  );
}
