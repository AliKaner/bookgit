"use client";

import { useRef, useState } from "react";
import { Plus, Pencil, Check, GitBranch, Trash2, List, BookOpen, Star } from "lucide-react";
import { useEditorStore, buildChapterTree, ChapterNode, WORDS_PER_A5_PAGE, Chapter } from "@/store/useEditorStore";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

// Per-branch lane colors
const LANE_COLORS = [
  '#60a5fa', // blue   – main trunk
  '#f472b6', // pink
  '#34d399', // emerald
  '#a78bfa', // violet
  '#fbbf24', // amber
  '#22d3ee', // cyan
  '#fb923c', // orange
  '#f87171', // red
];

type ViewMode = 'list' | 'pages';

interface ChapterTreeProps {
  onSelect: (id: string) => void;
}

export function ChapterTree({ onSelect }: ChapterTreeProps) {
  const { t } = useTranslation();
  const {
    chapters, activeChapterId,
    addChapter, addBranch, updateChapterTitle,
    setActiveChapter, removeChapter, setChapterCanon
  } = useEditorStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const inputRef = useRef<HTMLInputElement>(null);

  const tree = buildChapterTree(chapters);

  function startEdit(id: string, title: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function commitEdit() {
    if (editingId && editTitle.trim()) updateChapterTitle(editingId, editTitle.trim());
    setEditingId(null);
  }

  function handleSelect(id: string) {
    setActiveChapter(id);
    onSelect(id);
  }

  function handleBranch(fromId: string, e: React.MouseEvent) {
    e.stopPropagation();
    addBranch(fromId);
  }

  function requestDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteConfirmId(id);
  }

  function confirmDelete() {
    if (deleteConfirmId) removeChapter(deleteConfirmId);
    setDeleteConfirmId(null);
  }

  const deletingChapter = chapters.find(c => c.id === deleteConfirmId);

  return (
    <div className="h-full flex flex-col py-3 px-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400">{t.chapterTree.chapters}</p>
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
          <button
            onClick={() => setViewMode('list')}
            title={t.chapterTree.listView}
            className={cn(
              "p-1 rounded transition-all",
              viewMode === 'list'
                ? "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            <List className="w-3 h-3" />
          </button>
          <button
            onClick={() => setViewMode('pages')}
            title="Page View"
            className={cn(
              "p-1 rounded transition-all",
              viewMode === 'pages'
                ? "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            <BookOpen className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirmId && (
        <div
          className="mx-1 mb-3 p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">{t.chapterTree.deleteConfirmTitle}</p>
          <p className="text-[11px] text-red-600/70 dark:text-red-500/70 mb-2.5 leading-snug">
            &ldquo;{deletingChapter?.title}&rdquo; {t.chapterTree.deleteConfirmMsg}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={confirmDelete}
              className="flex-1 py-1 text-[11px] font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              {t.chapterTree.deleteConfirmBtn}
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 py-1 text-[11px] font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Tree content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {viewMode === 'list' ? (
          tree.map((rootNode) => (
            <ListBranch
              key={rootNode.chapter.id}
              node={rootNode}
              depth={0}
              activeChapterId={activeChapterId}
              editingId={editingId}
              editTitle={editTitle}
              inputRef={inputRef}
              onSelect={handleSelect}
              onStartEdit={startEdit}
              onCommitEdit={commitEdit}
              onEditTitleChange={setEditTitle}
              onBranch={handleBranch}
              onDelete={requestDelete}
              onSetCanon={(id) => setChapterCanon(id)}
              deleteConfirmId={deleteConfirmId}
            />
          ))
        ) : (
          <PageView chapters={chapters} activeChapterId={activeChapterId} onSelect={handleSelect} />
        )}
      </div>

      <button
        onClick={addChapter}
        className="flex items-center gap-2 w-full px-2 py-2 mt-3 rounded-lg text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-dashed border-zinc-200 dark:border-zinc-700"
      >
        <Plus className="w-3 h-3" /> {t.chapterTree.addChapter}
      </button>
    </div>
  );
}

// ─── LIST VIEW ────────────────────────────────────────────────────

interface ListBranchProps {
  node: ChapterNode;
  depth: number;
  activeChapterId: string;
  editingId: string | null;
  editTitle: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (id: string) => void;
  onStartEdit: (id: string, title: string, e: React.MouseEvent) => void;
  onCommitEdit: () => void;
  onEditTitleChange: (v: string) => void;
  onBranch: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onSetCanon: (id: string) => void;
  deleteConfirmId: string | null;
}

function ListBranch({
  node, depth, activeChapterId, editingId, editTitle, inputRef,
  onSelect, onStartEdit, onCommitEdit, onEditTitleChange, onBranch, onDelete, onSetCanon, deleteConfirmId,
}: ListBranchProps) {
  const { t } = useTranslation();
  const ch = node.chapter;
  const isActive = ch.id === activeChapterId;
  const isEditing = editingId === ch.id;
  const isPendingDelete = deleteConfirmId === ch.id;
  const indentPx = depth * 16;

  const words = ch.content
    ? ch.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
    : 0;
  const pages = words > 0 ? Math.ceil(words / WORDS_PER_A5_PAGE) : 0;

  return (
    <div className="relative">
      <div
        className={cn(
          "group relative flex flex-col rounded-lg transition-all cursor-pointer px-2 py-1.5 mb-0.5",
          isActive ? "bg-zinc-100 dark:bg-zinc-800"
            : isPendingDelete ? "bg-red-50 dark:bg-red-950/20 opacity-60"
            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        )}
        style={{ marginLeft: indentPx }}
        onClick={() => onSelect(ch.id)}
      >
        {depth > 0 && (
          <div className="absolute left-[-8px] top-0 bottom-0 border-l border-zinc-200 dark:border-zinc-700" />
        )}
        <div className="flex items-center gap-2">
          {depth > 0 && (
            <div className="absolute border-t border-zinc-200 dark:border-zinc-700" style={{ left: -8, width: 8, top: '50%' }} />
          )}
          <div className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            isActive ? "bg-zinc-700 dark:bg-zinc-200 ring-2 ring-zinc-300 dark:ring-zinc-600"
              : "bg-zinc-300 dark:bg-zinc-600 group-hover:bg-zinc-500 dark:group-hover:bg-zinc-400"
          )} />
          {isEditing ? (
            <form onSubmit={e => { e.preventDefault(); onCommitEdit(); }} className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
              <input ref={inputRef} value={editTitle} onChange={e => onEditTitleChange(e.target.value)} onBlur={onCommitEdit}
                className="flex-1 text-xs bg-white dark:bg-zinc-700 rounded px-1.5 py-0.5 outline-none border border-zinc-300 dark:border-zinc-600 min-w-0" />
              <button type="submit"><Check className="w-3 h-3 text-zinc-500" /></button>
            </form>
          ) : (
            <div className="flex items-center gap-0.5 flex-1 min-w-0">
              <span className={cn("flex-1 truncate text-xs font-medium",
                isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}>
                {ch.title}
              </span>
              <button onClick={e => onStartEdit(ch.id, ch.title, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex-shrink-0">
                <Pencil className="w-3 h-3 text-zinc-400" />
              </button>
              <button onClick={e => { e.stopPropagation(); onSetCanon(ch.id); }} title={t.chapterTree.makeCanon}
                  className={cn("p-0.5 rounded transition-all flex-shrink-0",
                    ch.isCanon ? "text-amber-500 opacity-100" : "opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20")}>
                <Star className={cn("w-3 h-3", ch.isCanon && "fill-current")} />
              </button>
              <button onClick={e => onBranch(ch.id, e)} title={t.chapterTree.openBranch}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all flex-shrink-0">
                <GitBranch className="w-3 h-3 text-violet-400" />
              </button>
              <button onClick={e => onDelete(ch.id, e)} title={t.chapterTree.deleteChapter}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex-shrink-0">
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 ml-4">
          {ch.parentId !== null && !ch.isCanon && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-500 dark:text-violet-400 font-semibold uppercase tracking-wide">{t.chapterTree.branch}</span>
          )}
          {ch.isCanon && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide flex items-center gap-0.5">
              <Star className="w-2 h-2 fill-current" /> canon
            </span>
          )}
          {words > 0 && (
            <>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{words} {t.chapterTree.wordsLabel}</span>
              <span className="text-[10px] text-zinc-300 dark:text-zinc-600">·</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">~{pages} {t.chapterTree.pagesLabel}</span>
            </>
          )}
        </div>
      </div>
      {node.children.map((child) => (
        <ListBranch
          key={child.chapter.id}
          node={child}
          depth={depth + 1}
          activeChapterId={activeChapterId}
          editingId={editingId}
          editTitle={editTitle}
          inputRef={inputRef}
          onSelect={onSelect}
          onStartEdit={onStartEdit}
          onCommitEdit={onCommitEdit}
          onEditTitleChange={onEditTitleChange}
          onBranch={onBranch}
          onDelete={onDelete}
          onSetCanon={onSetCanon}
          deleteConfirmId={deleteConfirmId}
        />
      ))}
    </div>
  );
}

// ─── PAGE VIEW ────────────────────────────────────────────────────

interface PageViewProps {
  chapters: Chapter[];
  activeChapterId: string;
  onSelect: (id: string) => void;
}

function PageView({ chapters, activeChapterId, onSelect }: PageViewProps) {
  const { t } = useTranslation();
  // Get canon chapters in order (walk the canon chain)
  const roots = chapters.filter(c => c.parentId === null).sort((a, b) => a.order - b.order);
  const orderedChapters: Chapter[] = [];
  
  function walkCanon(ch: Chapter) {
    orderedChapters.push(ch);
    const canonChild = chapters
      .filter(c => c.parentId === ch.id && c.isCanon)
      .sort((a, b) => a.order - b.order)[0];
    if (canonChild) walkCanon(canonChild);
  }
  roots.forEach(r => walkCanon(r));

  // If no canon chapters, show all by order
  const displayChapters = orderedChapters.length > 0 ? orderedChapters : chapters;

  return (
    <div className="space-y-3 p-2">
      {displayChapters.map((ch, i) => {
        const plainText = ch.content?.replace(/<[^>]+>/g, ' ').trim() || '';
        const words = plainText.split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const pages = wordCount > 0 ? Math.ceil(wordCount / WORDS_PER_A5_PAGE) : 0;
        const isActive = ch.id === activeChapterId;
        const preview = plainText.length > 200 ? plainText.slice(0, 200) + '…' : plainText;

        return (
          <div
            key={ch.id}
            onClick={() => onSelect(ch.id)}
            className={cn(
              "rounded-xl border cursor-pointer transition-all hover:shadow-sm",
              isActive
                ? "border-violet-400 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-950/20 shadow-sm"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
            )}
          >
            {/* Chapter header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className={cn(
                "text-xs font-semibold flex-1 truncate",
                isActive ? "text-violet-700 dark:text-violet-300" : "text-zinc-700 dark:text-zinc-300"
              )}>
                {ch.title}
              </span>
              {ch.isCanon && <Star className="w-3 h-3 text-amber-500 fill-current flex-shrink-0" />}
            </div>
            
            {/* Content preview */}
            <div className="px-3 py-2">
              {preview ? (
                <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-4">
                  {preview}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-300 dark:text-zinc-600 italic">Empty</p>
              )}
            </div>

            {/* Footer stats */}
            {wordCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500">{wordCount} {t.chapterTree.wordsAbbr}</span>
                <span className="text-[9px] text-zinc-300 dark:text-zinc-600">·</span>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500">~{pages} {t.chapterTree.pagesAbbr}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
