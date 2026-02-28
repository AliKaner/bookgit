"use client";

import Link from "next/link";
import { BookOpen, GitBranch, Eye, Users, Globe, ArrowRight, Sparkles, Layers, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation, LanguageSwitcher } from "@/contexts/LanguageContext";

export default function LandingPage() {
  const { t } = useTranslation();

  const FEATURES = [
    { icon: <GitBranch className="w-5 h-5" />, key: "branch" as const, color: "from-violet-500/20 to-violet-900/10 border-violet-800/30", iconColor: "text-violet-400" },
    { icon: <Users className="w-5 h-5" />,     key: "characters" as const, color: "from-blue-500/20 to-blue-900/10 border-blue-800/30", iconColor: "text-blue-400" },
    { icon: <Globe className="w-5 h-5" />,     key: "world" as const, color: "from-emerald-500/20 to-emerald-900/10 border-emerald-800/30", iconColor: "text-emerald-400" },
    { icon: <Eye className="w-5 h-5" />,       key: "preview" as const, color: "from-amber-500/20 to-amber-900/10 border-amber-800/30", iconColor: "text-amber-400" },
    { icon: <Lock className="w-5 h-5" />,      key: "visibility" as const, color: "from-rose-500/20 to-rose-900/10 border-rose-800/30", iconColor: "text-rose-400" },
    { icon: <Layers className="w-5 h-5" />,    key: "notes" as const, color: "from-cyan-500/20 to-cyan-900/10 border-cyan-800/30", iconColor: "text-cyan-400" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/8 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between max-w-5xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">BookGit</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition px-3 py-1.5">
            {t.nav.signIn}
          </Link>
          <Link href="/login" className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition shadow-lg shadow-violet-900/30">
            {t.nav.getStarted} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center pt-20 pb-24 px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-800/50 bg-violet-900/20 text-violet-300 text-xs font-medium mb-8">
          <Sparkles className="w-3 h-3" /> {t.landing.badge}
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
          <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">{t.landing.headline1}</span>
          <br />{t.landing.headline2}
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">{t.landing.sub}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/login" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition shadow-xl shadow-violet-900/40 hover:-translate-y-0.5">
            {t.landing.cta} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/books" className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white font-medium transition hover:-translate-y-0.5">
            {t.landing.ctaSecondary}
          </Link>
        </div>
      </section>

      {/* Mock editor preview */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 mb-24">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/60">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            <div className="flex-1 flex justify-center">
              <span className="text-[10px] text-zinc-600 bg-zinc-800 px-3 py-0.5 rounded">bookgit.app · The Fellowship</span>
            </div>
          </div>
          <div className="flex h-56">
            <div className="w-48 border-r border-zinc-800 p-3 space-y-1">
              <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">{t.editor.chapters}</div>
              {[
                { label: "Chapter 1", branch: undefined },
                { label: "Chapter 2A", branch: "violet" },
                { label: "Chapter 2B", branch: "blue" },
                { label: "Chapter 3", branch: undefined },
              ].map((item, i) => (
                <div key={i} className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px]", i === 1 ? "bg-zinc-800 text-white" : "text-zinc-500")}>
                  <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                    item.branch === "violet" ? "bg-violet-500" : item.branch === "blue" ? "bg-blue-500" : "bg-zinc-600")} />
                  {item.label}
                </div>
              ))}
            </div>
            <div className="flex-1 p-6">
              <div className="text-center mb-4"><div className="h-5 bg-zinc-700/30 rounded w-48 mx-auto" /></div>
              <div className="space-y-1.5">
                {[100, 80, 90, 70, 95, 60].map((w, i) => (
                  <div key={i} className="h-2 bg-zinc-800 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center mb-12">{t.landing.featureHeading}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.key} className={`p-5 rounded-2xl border bg-gradient-to-br ${f.color} hover:-translate-y-0.5 transition-transform`}>
              <div className={`mb-3 ${f.iconColor}`}>{f.icon}</div>
              <h3 className="font-semibold text-sm text-white mb-1">{t.landing.features[f.key].title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{t.landing.features[f.key].desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 text-center pb-24 px-6">
        <div className="inline-block bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl px-12 py-10 shadow-2xl">
          <h2 className="text-3xl font-bold mb-3">{t.landing.cta}.</h2>
          <p className="text-zinc-400 text-sm mb-6">Free. No BS.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition shadow-lg shadow-violet-900/30">
            {t.nav.getStarted} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 text-center py-8 border-t border-zinc-900 text-zinc-700 text-xs">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-3 h-3" /><span>BookGit</span>
        </div>
        {t.landing.footer}
      </footer>
    </div>
  );
}
