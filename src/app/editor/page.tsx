"use client";

import { useEffect, useState } from "react";
import { BookOpen, StickyNote, Users, Book, Settings, FileText, Globe, Eye, Save, Loader2 } from "lucide-react";
import { StoryEditor } from "@/components/editor/StoryEditor";
import { CharacterPanel } from "@/components/CharacterPanel";
import { NotesPanel } from "@/components/NotesPanel";
import { DictionaryPanel } from "@/components/DictionaryPanel";
import { WorldPanel } from "@/components/WorldPanel";
import { ChapterTree } from "@/components/ChapterTree";
import { BookPreview } from "@/components/BookPreview";
import { UserCard } from "@/components/UserCard";
import { useEditorStore } from "@/store/useEditorStore";
import { useTranslation, LanguageSwitcher } from "@/contexts/LanguageContext";
import { getBookState, saveBookState } from "@/app/actions/books";
import { cn } from "@/lib/utils";
import Link from "next/link";

type LeftPanel = 'chapters' | 'notes' | null;
type RightPanel = 'characters' | 'dictionary' | 'world' | 'settings' | null;

const COLOR_HEX: Record<string, string> = {
  blue: '#60a5fa', red: '#f87171', emerald: '#34d399', purple: '#a78bfa',
  amber: '#fbbf24', pink: '#f472b6', cyan: '#22d3ee', orange: '#fb923c',
};

export default function EditorPage() {
  const { t } = useTranslation();
  const state = useEditorStore();
  const { chapters, activeChapterId, updateChapterTitle, setActiveChapter, updateChapterContent, styles, loadBookData } = state;
  
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('chapters');
  const [rightPanel, setRightPanel] = useState<RightPanel>('characters');
  const [showPreview, setShowPreview] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('bookId');
    if (!bookId) { setLoading(false); return; }

    async function load() {
      try {
        const data = await getBookState(bookId!);
        if (data && !('error' in data)) {
          loadBookData(data);
        }
      } catch (err) {
        console.error("Failed to load book state:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeChapter = chapters.find(ch => ch.id === activeChapterId) ?? chapters[0];

  async function handleSave() {
    setSaveState('saving');
    try {
      const params = new URLSearchParams(window.location.search);
      const bookId = params.get('bookId');
      if (!bookId) return;

      const result = await saveBookState(bookId, state);
      if (result && 'success' in result && result.success) {
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } else {
        setSaveState('idle');
      }
    } catch { 
      setSaveState('idle'); 
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-zinc-400 text-sm animate-pulse">Loading book...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 overflow-hidden">
      {showPreview && <BookPreview onClose={() => setShowPreview(false)} />}

      {/* Left panel */}
      <div className={cn("h-full border-r border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 transition-all duration-300 overflow-hidden flex-shrink-0 flex flex-col",
        leftPanel ? "w-72" : "w-0")}>
        <div className="flex-1 overflow-hidden">
          {leftPanel === 'chapters' && <ChapterTree onSelect={(id) => setActiveChapter(id)} />}
          {leftPanel === 'notes' && <NotesPanel />}
        </div>
        {leftPanel && <UserCard variant="sidebar" />}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <header className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-100 dark:border-zinc-800/60 flex-shrink-0 gap-4">
          <div className="flex items-center gap-1.5">
            <Link href="/books">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center flex-shrink-0 hover:scale-105 transition">
                <BookOpen className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
              </div>
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />
            <ToggleBtn active={leftPanel === 'chapters'} onClick={() => setLeftPanel(p => p === 'chapters' ? null : 'chapters')}
              icon={<FileText className="w-3.5 h-3.5" />} label={t.editor.chapters}
              activeClass="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
            <ToggleBtn active={leftPanel === 'notes'} onClick={() => setLeftPanel(p => p === 'notes' ? null : 'notes')}
              icon={<StickyNote className="w-3.5 h-3.5" />} label={t.editor.notes}
              activeClass="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" />
          </div>

          <div className="flex-1" />

          {/* Save */}
          <button onClick={handleSave} disabled={saveState === 'saving'}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              saveState === 'saved' ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700")}>
            {saveState === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saveState === 'saved' ? t.editor.saved : t.editor.save}
          </button>

          {/* Preview */}
          <button onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300">
            <Eye className="w-3.5 h-3.5" />{t.editor.preview}
          </button>

          {/* Right toggles */}
          <div className="flex items-center gap-1">
            <ToggleBtn active={rightPanel === 'characters'} onClick={() => setRightPanel(p => p === 'characters' ? null : 'characters')}
              icon={<Users className="w-3.5 h-3.5" />} label={t.editor.characters}
              activeClass="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" />
            <ToggleBtn active={rightPanel === 'dictionary'} onClick={() => setRightPanel(p => p === 'dictionary' ? null : 'dictionary')}
              icon={<Book className="w-3.5 h-3.5" />} label={t.editor.dictionary}
              activeClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" />
            <ToggleBtn active={rightPanel === 'world'} onClick={() => setRightPanel(p => p === 'world' ? null : 'world')}
              icon={<Globe className="w-3.5 h-3.5" />} label={t.editor.world}
              activeClass="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" />
            <ToggleBtn active={rightPanel === 'settings'} onClick={() => setRightPanel(p => p === 'settings' ? null : 'settings')}
              icon={<Settings className="w-3.5 h-3.5" />} label={t.editor.settings}
              activeClass="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200" />
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
          <LanguageSwitcher />
          <UserCard variant="header" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-10 py-12">
            <input key={`${activeChapter?.id}-title`} type="text"
              defaultValue={activeChapter?.title}
              onBlur={e => activeChapter && updateChapterTitle(activeChapter.id, e.target.value)}
              style={{ fontFamily: styles.titleFont === 'serif' ? 'Georgia, serif' : styles.titleFont === 'mono' ? 'monospace' : 'system-ui, sans-serif', color: styles.titleColor || undefined }}
              className="w-full text-center text-4xl font-bold bg-transparent border-none outline-none placeholder-zinc-300 dark:placeholder-zinc-700 mb-10"
              placeholder={t.editor.titlePlaceholder}
            />
            <StoryEditor key={`${activeChapter?.id}-editor`} chapterId={activeChapter?.id ?? ''}
              initialContent={activeChapter?.content ?? ''}
              onContentChange={(html) => activeChapter && updateChapterContent(activeChapter.id, html)} />
          </div>
        </main>
      </div>

      {/* Right panel */}
      <div className={cn("h-full border-l border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 transition-all duration-300 overflow-hidden flex-shrink-0",
        rightPanel ? "w-72" : "w-0")}>
        {rightPanel === 'characters' && <CharacterPanel />}
        {rightPanel === 'dictionary' && <DictionaryPanel />}
        {rightPanel === 'world' && <WorldPanel />}
        {rightPanel === 'settings' && <SettingsPanel colorHex={COLOR_HEX} />}
      </div>
    </div>
  );
}

function ToggleBtn({ active, onClick, icon, label, activeClass }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; activeClass: string }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
      active ? activeClass : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200")}>
      {icon}{label}
    </button>
  );
}

function SettingsPanel({ colorHex }: { colorHex: Record<string, string> }) {
  const { t } = useTranslation();
  const { styles, setStyle, characters, dictionary } = useEditorStore();
  const FONTS = [{ label: t.editor.fontSerif, value: 'serif' }, { label: t.editor.fontSans, value: 'sans' }, { label: t.editor.fontMono, value: 'mono' }];
  const SIZES = [{ label: t.editor.sizeSmall, value: 'sm' }, { label: t.editor.sizeMed, value: 'lg' }, { label: t.editor.sizeLarge, value: 'xl' }];
  const TEXT_COLORS = ['#ffffff','#f4f4f5','#a1a1aa','#1d4ed8','#15803d','#9333ea','#b45309','#be123c'];
  return (
    <div className="h-full p-5 space-y-5 overflow-y-auto">
      <h2 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{t.editor.settingsHeading}</h2>
      <StyleGroup title={t.editor.headingTitle}>
        <StyleRow label={t.editor.fontLabel}><BtnGroup options={FONTS} value={styles.titleFont} onChange={v => setStyle('titleFont', v)} /></StyleRow>
        <StyleRow label={t.editor.colorLabel}><ColorPicker colors={TEXT_COLORS} value={styles.titleColor} onChange={v => setStyle('titleColor', v)} /></StyleRow>
      </StyleGroup>
      <StyleGroup title={t.editor.headingBody}>
        <StyleRow label={t.editor.fontLabel}><BtnGroup options={FONTS} value={styles.bodyFont} onChange={v => setStyle('bodyFont', v)} /></StyleRow>
        <StyleRow label={t.editor.sizeLabel}><BtnGroup options={SIZES} value={styles.bodySize} onChange={v => setStyle('bodySize', v)} /></StyleRow>
        <StyleRow label={t.editor.colorLabel}><ColorPicker colors={TEXT_COLORS} value={styles.bodyColor} onChange={v => setStyle('bodyColor', v)} /></StyleRow>
      </StyleGroup>
      {characters.length > 0 && (
        <StyleGroup title={t.editor.headingChars}>
          {characters.map(c => { const hex = colorHex[c.color] ?? c.color; return (
            <div key={c.id} className="flex items-center gap-2 text-xs py-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hex }} />
              <span className="flex-1 font-medium" style={{ color: hex }}>{c.name}</span>
              <span className="text-zinc-400">{c.role}</span>
            </div>
          ); })}
        </StyleGroup>
      )}
      {dictionary.length > 0 && (
        <StyleGroup title={t.editor.headingDict}>
          {dictionary.map(d => { const hex = colorHex[d.color] ?? d.color; return (
            <div key={d.id} className="flex items-center gap-2 text-xs py-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hex }} />
              <span className="font-medium" style={{ color: hex }}>{d.word}</span>
            </div>
          ); })}
        </StyleGroup>
      )}
    </div>
  );
}

function StyleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2.5"><p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1">{title}</p>{children}</div>;
}
function StyleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-3"><span className="text-xs text-zinc-400 w-10 flex-shrink-0">{label}</span><div className="flex-1">{children}</div></div>;
}
function BtnGroup({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return <div className="flex gap-1">{options.map(o => <button key={o.value} onClick={() => onChange(o.value)} className={cn("flex-1 py-1 text-xs rounded-md border transition-colors", value === o.value ? "border-zinc-700 dark:border-zinc-300 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400")}>{o.label}</button>)}</div>;
}
function ColorPicker({ colors, value, onChange }: { colors: string[]; value: string; onChange: (v: string) => void }) {
  return <div className="flex gap-1.5 flex-wrap">{colors.map(c => <button key={c} onClick={() => onChange(c)} className={cn("w-5 h-5 rounded-full border-2 transition-all", value === c ? "border-zinc-500 scale-110" : "border-transparent")} style={{ backgroundColor: c }} />)}</div>;
}
