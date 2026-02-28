"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import en from "@/i18n/en";
import tr from "@/i18n/tr";
import type { Translations } from "@/i18n/en";

export type Locale = "en" | "tr";

const dicts: Record<Locale, Translations> = { en, tr };

interface LanguageContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  t: en,
  setLocale: () => {},
});

const STORAGE_KEY = "bookgit_locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Hydrate from localStorage on mount — EN is always the default
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === "en" || stored === "tr")) {
      setLocaleState(stored);
    }
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    // Update <html lang>
    document.documentElement.lang = l;
  }

  return (
    <LanguageContext.Provider value={{ locale, t: dicts[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}

// ─── Language Switcher Component ────────────────────────────
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div className={`flex items-center gap-1 bg-zinc-800/60 rounded-lg p-0.5 ${className ?? ""}`}>
      {(["en", "tr"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            locale === l
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
