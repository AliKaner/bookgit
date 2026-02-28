"use client";

import { useRef, useState } from "react";
import { BookOpen, StickyNote, Users, Book, Settings, Plus, Pencil, Check, FileText } from "lucide-react";
import { StoryEditor } from "@/components/editor/StoryEditor";
import { CharacterPanel } from "@/components/CharacterPanel";
import { NotesPanel } from "@/components/NotesPanel";
import { DictionaryPanel } from "@/components/DictionaryPanel";
import { useEditorStore } from "@/store/useEditorStore";
import { cn } from "@/lib/utils";

type LeftPanel = 'chapters' | 'notes' | null;
type RightPanel = 'characters' | 'dictionary' | 'settings' | null;

const COLOR_HEX: Record<string, string> = {
  blue: '#60a5fa', red: '#f87171', emerald: '#34d399', purple: '#a78bfa',
  amber: '#fbbf24', pink: '#f472b6', cyan: '#22d3ee', orange: '#fb923c',
};

export default function Home() {
  const {
    chapters, activeChapterId,
    addChapter, updateChapterTitle, setActiveChapter,
    updateChapterContent,
    styles,
  } = useEditorStore();

  const [leftPanel, setLeftPanel] = useState<LeftPanel>('chapters');
  const [rightPanel, setRightPanel] = useState<RightPanel>('characters');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChapter = chapters.find(ch => ch.id === activeChapterId) ?? chapters[0];

  function handleLeft(panel: LeftPanel) {
    setLeftPanel(prev => prev === panel ? null : panel);
  }

  function handleRight(panel: RightPanel) {
    setRightPanel(prev => prev === panel ? null : panel);
  }

  function startEdit(id: string, currentTitle: string) {
    setEditingChapterId(id);
    setEditTitle(currentTitle);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function commitEdit() {
    if (editingChapterId && editTitle.trim()) {
      updateChapterTitle(editingChapterId, editTitle.trim());
    }
    setEditingChapterId(null);
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 overflow-hidden">

      {/* Sol Panel */}
      <div className={cn(
        "h-full border-r border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 transition-all duration-300 overflow-hidden flex-shrink-0",
        leftPanel ? "w-72" : "w-0"
      )}>
        {leftPanel === 'chapters' && <ChaptersPanel
          chapters={chapters}
          activeChapterId={activeChapterId}
          editingChapterId={editingChapterId}
          editTitle={editTitle}
          inputRef={inputRef}
          onSelect={(id) => { setActiveChapter(id); setEditingChapterId(null); }}
          onStartEdit={startEdit}
          onCommitEdit={commitEdit}
          onEditTitleChange={setEditTitle}
          onAddChapter={addChapter}
        />}
        {leftPanel === 'notes' && <NotesPanel />}
      </div>

      {/* Ana */}
      <div className="flex-1 flex flex-col h-full min-w-0">

        {/* Header */}
        <header className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-100 dark:border-zinc-800/60 flex-shrink-0 gap-4">
          {/* Sol togglelar */}
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
            </div>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />
            <ToggleBtn active={leftPanel === 'chapters'} onClick={() => handleLeft('chapters')}
              icon={<FileText className="w-3.5 h-3.5" />} label="Bölümler"
              activeClass="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
            <ToggleBtn active={leftPanel === 'notes'} onClick={() => handleLeft('notes')}
              icon={<StickyNote className="w-3.5 h-3.5" />} label="Notlar"
              activeClass="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" />
          </div>

          {/* Orta: boş bırak, duplikat başlık yok */}
          <div className="flex-1" />

          {/* Sağ togglelar */}
          <div className="flex items-center gap-1">
            <ToggleBtn active={rightPanel === 'characters'} onClick={() => handleRight('characters')}
              icon={<Users className="w-3.5 h-3.5" />} label="Karakterler"
              activeClass="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" />
            <ToggleBtn active={rightPanel === 'dictionary'} onClick={() => handleRight('dictionary')}
              icon={<Book className="w-3.5 h-3.5" />} label="Sözlük"
              activeClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" />
            <ToggleBtn active={rightPanel === 'settings'} onClick={() => handleRight('settings')}
              icon={<Settings className="w-3.5 h-3.5" />} label="Ayarlar"
              activeClass="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200" />
          </div>
        </header>

        {/* Yazım Alanı */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-10 py-12">
            <input
              key={`${activeChapter?.id}-title`}
              type="text"
              defaultValue={activeChapter?.title}
              onBlur={e => activeChapter && updateChapterTitle(activeChapter.id, e.target.value)}
              style={{
                fontFamily: styles.titleFont === 'serif' ? 'Georgia, serif' : styles.titleFont === 'mono' ? 'monospace' : 'system-ui, sans-serif',
                color: styles.titleColor || undefined,
              }}
              className="w-full text-center text-4xl font-bold bg-transparent border-none outline-none placeholder-zinc-300 dark:placeholder-zinc-700 mb-10"
              placeholder="Başlık..."
            />
            <StoryEditor
              key={`${activeChapter?.id}-editor`}
              chapterId={activeChapter?.id ?? ''}
              initialContent={activeChapter?.content ?? ''}
              onContentChange={(html) => activeChapter && updateChapterContent(activeChapter.id, html)}
            />
          </div>
        </main>

      </div>

      {/* Sağ Panel */}
      <div className={cn(
        "h-full border-l border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 transition-all duration-300 overflow-hidden flex-shrink-0",
        rightPanel ? "w-72" : "w-0"
      )}>
        {rightPanel === 'characters' && <CharacterPanel />}
        {rightPanel === 'dictionary' && <DictionaryPanel />}
        {rightPanel === 'settings' && <SettingsPanel colorHex={COLOR_HEX} />}
      </div>

    </div>
  );
}

function ToggleBtn({ active, onClick, icon, label, activeClass }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; activeClass: string;
}) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
      active ? activeClass : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
    )}>
      {icon}{label}
    </button>
  );
}

function ChaptersPanel({ chapters, activeChapterId, editingChapterId, editTitle, inputRef,
  onSelect, onStartEdit, onCommitEdit, onEditTitleChange, onAddChapter }: any) {
  return (
    <div className="h-full flex flex-col py-4 px-2">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 px-2 mb-2">Bölümler</p>
      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {chapters.map((ch: any) => {
          const words = ch.content
            ? ch.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
            : 0;
          const pages = Math.max(1, Math.ceil(words / 250));
          return (
            <div key={ch.id} onClick={() => onSelect(ch.id)}
              className={cn(
                "group flex flex-col w-full px-2 py-2 rounded-lg transition-colors cursor-pointer",
                ch.id === activeChapterId
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              )}>
              {editingChapterId === ch.id ? (
                <form onSubmit={e => { e.preventDefault(); onCommitEdit(); }} className="flex items-center gap-1">
                  <input ref={inputRef} value={editTitle} onChange={e => onEditTitleChange(e.target.value)}
                    onBlur={onCommitEdit} onClick={(e: any) => e.stopPropagation()}
                    className="flex-1 text-xs bg-white dark:bg-zinc-700 rounded px-1.5 py-0.5 outline-none border border-zinc-300 dark:border-zinc-600 min-w-0" />
                  <button type="submit" onClick={(e: any) => e.stopPropagation()}><Check className="w-3 h-3 text-zinc-500" /></button>
                </form>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="flex-1 truncate text-xs font-medium">{ch.title}</span>
                  <button onClick={(e: any) => { e.stopPropagation(); onStartEdit(ch.id, ch.title); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex-shrink-0">
                    <Pencil className="w-3 h-3 text-zinc-400" />
                  </button>
                </div>
              )}
              {/* Badge: kelime + sayfa */}
              {words > 0 && (
                <div className="flex gap-1.5 mt-1">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{words} kelime</span>
                  <span className="text-[10px] text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">~{pages} sayfa</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={onAddChapter}
        className="flex items-center gap-2 w-full px-2 py-2 mt-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-dashed border-zinc-200 dark:border-zinc-700">
        <Plus className="w-3 h-3" /> Yeni Bölüm
      </button>
    </div>
  );
}

function SettingsPanel({ colorHex }: { colorHex: Record<string, string> }) {
  const { styles, setStyle, characters, dictionary } = useEditorStore();

  const FONTS = [{ label: 'Serif', value: 'serif' }, { label: 'Sans', value: 'sans' }, { label: 'Mono', value: 'mono' }];
  const SIZES = [{ label: 'Küçük', value: 'sm' }, { label: 'Orta', value: 'lg' }, { label: 'Büyük', value: 'xl' }];
  const TEXT_COLORS = ['#ffffff', '#f4f4f5', '#a1a1aa', '#1d4ed8', '#15803d', '#9333ea', '#b45309', '#be123c'];

  return (
    <div className="h-full p-5 space-y-5 overflow-y-auto">
      <h2 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Görünüm Ayarları</h2>

      <StyleGroup title="Başlık">
        <StyleRow label="Font">
          <BtnGroup options={FONTS} value={styles.titleFont} onChange={v => setStyle('titleFont', v)} />
        </StyleRow>
        <StyleRow label="Renk">
          <ColorPicker colors={TEXT_COLORS} value={styles.titleColor} onChange={v => setStyle('titleColor', v)} />
        </StyleRow>
      </StyleGroup>

      <StyleGroup title="Yazı">
        <StyleRow label="Font">
          <BtnGroup options={FONTS} value={styles.bodyFont} onChange={v => setStyle('bodyFont', v)} />
        </StyleRow>
        <StyleRow label="Boyut">
          <BtnGroup options={SIZES} value={styles.bodySize} onChange={v => setStyle('bodySize', v)} />
        </StyleRow>
        <StyleRow label="Renk">
          <ColorPicker colors={TEXT_COLORS} value={styles.bodyColor} onChange={v => setStyle('bodyColor', v)} />
        </StyleRow>
      </StyleGroup>

      {characters.length > 0 && (
        <StyleGroup title="Karakter Vurguları">
          {characters.map(c => {
            const hex = colorHex[c.color] ?? c.color;
            return (
              <div key={c.id} className="flex items-center gap-2 text-xs py-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hex }} />
                <span className="flex-1 font-medium" style={{ color: hex }}>{c.name}</span>
                <span className="text-zinc-400">{c.role}</span>
              </div>
            );
          })}
        </StyleGroup>
      )}

      {dictionary.length > 0 && (
        <StyleGroup title="Sözlük Terimleri">
          {dictionary.map(d => {
            const hex = colorHex[d.color] ?? d.color;
            return (
              <div key={d.id} className="flex items-center gap-2 text-xs py-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hex }} />
                <span className="font-medium" style={{ color: hex }}>{d.word}</span>
              </div>
            );
          })}
        </StyleGroup>
      )}
    </div>
  );
}

function StyleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1">{title}</p>
      {children}
    </div>
  );
}

function StyleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-10 flex-shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function BtnGroup({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn("flex-1 py-1 text-xs rounded-md border transition-colors",
            value === o.value ? "border-zinc-700 dark:border-zinc-300 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ColorPicker({ colors, value, onChange }: { colors: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {colors.map(c => (
        <button key={c} onClick={() => onChange(c)}
          className={cn("w-5 h-5 rounded-full border-2 transition-all", value === c ? "border-zinc-500 scale-110" : "border-transparent")}
          style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}
