"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { BookOpen, Loader2, Eye, EyeOff, Mail, CheckCircle, RefreshCw } from "lucide-react";
import { signIn, signUp, resendConfirmation } from "@/app/actions/auth";
import { useTranslation, LanguageSwitcher } from "@/contexts/LanguageContext";
import { useSearchParams } from "next/navigation";

type Tab = "signin" | "signup";
type Stage = "form" | "email-sent";

// useSearchParams must be in a child component wrapped by Suspense
function SearchParamsHandler({ onError }: { onError: (e: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const cbError = searchParams.get("error");
    if (cbError) onError(decodeURIComponent(cbError));
  }, [searchParams, onError]);
  return null;
}

function LoginInner() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("signin");
  const [stage, setStage] = useState<Stage>("form");
  const [sentEmail, setSentEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendPending, startResend] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (tab === "signin") {
        const result = await signIn(formData);
        if (result?.error) setError(result.error);
      } else {
        const result = await signUp(formData);
        if (!result) return;
        if ("error" in result && result.error) setError(result.error);
        else if ("emailSent" in result && result.emailSent) {
          setSentEmail(result.email as string);
          setStage("email-sent");
        }
      }
    });
  }

  function handleResend() {
    if (resendCooldown > 0) return;
    startResend(async () => {
      await resendConfirmation(sentEmail);
      setResendCooldown(60);
    });
  }

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  if (stage === "email-sent") {
    return (
      <div className="relative w-full max-w-sm text-center">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-500/30 flex items-center justify-center">
            <Mail className="w-9 h-9 text-violet-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Check your inbox</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-1">We sent a confirmation link to:</p>
        <p className="text-sm font-semibold text-violet-300 mb-6 bg-violet-900/20 border border-violet-800/40 rounded-lg px-3 py-2 inline-block">{sentEmail}</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-left space-y-3 mb-6">
          {["Open the email from Booktions", "Click the confirmation link", "You'll be logged in automatically"].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-600/40 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-violet-400">{i + 1}</span>
              </div>
              <span className="text-sm text-zinc-300">{step}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button onClick={handleResend} disabled={resendCooldown > 0 || resendPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-800 hover:text-white transition disabled:opacity-50">
            {resendPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
          </button>
          <button onClick={() => { setStage("form"); setTab("signin"); setError(null); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition px-3 py-2">
            Back to Sign In
          </button>
        </div>
        <p className="text-[10px] text-zinc-700 mt-6">Don't see it? Check your spam folder.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Booktions</span>
        </div>
        <LanguageSwitcher />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
        <div className="flex bg-zinc-800 rounded-lg p-1 mb-6">
          {(["signin", "signup"] as Tab[]).map((tabKey) => (
            <button key={tabKey} onClick={() => { setTab(tabKey); setError(null); }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${tab === tabKey ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}>
              {tabKey === "signin" ? t.auth.signIn : t.auth.signUp}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "signup" && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t.auth.displayName}</label>
              <input name="display_name" type="text" placeholder={t.auth.namePlaceholder}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t.auth.email}</label>
            <input name="email" type="email" required autoComplete="email" placeholder={t.auth.emailPlaceholder}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t.auth.password}</label>
            <div className="relative">
              <input name="password" type={showPw ? "text" : "password"} required minLength={6}
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                placeholder={t.auth.passwordPlaceholder}
                className="w-full px-3 py-2.5 pr-10 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {tab === "signup" && <p className="text-[10px] text-zinc-600 mt-1">{t.auth.minPassword}</p>}
          </div>
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
              <span className="mt-px">⚠</span><span>{error}</span>
            </div>
          )}
          <button type="submit" disabled={isPending}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {tab === "signin" ? t.auth.signInBtn : t.auth.signUpBtn}
          </button>
        </form>
      </div>
      <p className="text-center text-xs text-zinc-600 mt-6">{t.auth.tagline}</p>
    </div>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-violet-600/8 blur-[80px] rounded-full pointer-events-none" />
      {/* Suspense boundary for useSearchParams */}
      <Suspense fallback={null}>
        <SearchParamsHandler onError={setError} />
      </Suspense>
      <LoginInner />
    </div>
  );
}
