"use client";

import { EntityGrid } from "@/components/entities/EntityGrid";
import { useTranslation } from "@/contexts/LanguageContext";

export default function WorldPage() {
  const { t, locale } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-950">
      <EntityGrid 
        type="world" 
        title={t.entities.worldUnits}
        description={locale === 'tr'
          ? "Bölgeler, ülkeler, iklimler ve tarihler. Dünyanızı inşa edecek her şey burada."
          : "Regions, countries, climates, and histories. Everything you need to build your world is here."
        }
      />
    </div>
  );
}
