"use client";

import { useRef, useState } from "react";
import { Plus, Pencil, Check, GitBranch, Trash2, List, GitCommitHorizontal, Star } from "lucide-react";
import { Gitgraph, TemplateName, templateExtend } from "@gitgraph/react";
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

type ViewMode = 'list' | 'graph';

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
            onClick={() => setViewMode('graph')}
            title={t.chapterTree.graphView}
            className={cn(
              "p-1 rounded transition-all",
              viewMode === 'graph'
                ? "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            <GitCommitHorizontal className="w-3 h-3" />
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
          <GitGraphView
            chapters={chapters}
            activeChapterId={activeChapterId}
            onSelect={handleSelect}
          />
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

// ─── GIT GRAPH VIEW ───────────────────────────────────────────────

interface GitGraphViewProps {
  chapters: Chapter[];
  activeChapterId: string;
  onSelect: (id: string) => void;
}

export function GitGraphView({ chapters, activeChapterId, onSelect }: GitGraphViewProps) {
  const tree = buildChapterTree(chapters);

  if (chapters.length === 0) return null;

  const customTemplate = templateExtend(TemplateName.Metro, {
    colors: LANE_COLORS,
    commit: {
      dot: {
        size: 11,
        strokeWidth: 2,
      },
      message: {
        display: true,
        displayAuthor: false,
        displayHash: false,
        font: "500 11px Inter, sans-serif",
      },
    },
    branch: {
      lineWidth: 2,
      spacing: 25,
    },
  });

  return (
    <div className="p-4 overflow-x-auto overflow-y-hidden custom-gitgraph">
      <Gitgraph options={{ template: customTemplate }}>
        {(gitgraph) => {
          // Recursive function to draw nodes
          const renderNodes = (nodes: ChapterNode[], branch: any) => {
            nodes.sort((a, b) => a.chapter.order - b.chapter.order);

            nodes.forEach((node) => {
              const ch = node.chapter;
              const isActive = ch.id === activeChapterId;

              // Commit this chapter
              branch.commit({
                subject: ch.title,
                dotColor: ch.isCanon ? "#fbbf24" : undefined,
                onClick: () => onSelect(ch.id),
                renderMessage: (commit: any) => (
                  <text
                    x={20}
                    y={5}
                    fill={isActive ? (document.documentElement.classList.contains('dark') ? '#f4f4f5' : '#18181b') : '#71717a'}
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => onSelect(ch.id)}
                  >
                    {commit.subject}
                    {ch.isCanon && " ⭐"}
                  </text>
                ),
              });

              if (node.children.length > 0) {
                // To avoid visual stacking of parallel branches, we need to be careful.
                // In Gitgraph, the "main" flow continues, while side branches are spawned.
                
                // 1. Separate children into Canon/Primary and others
                const canonIndex = node.children.findIndex(c => c.chapter.isCanon);
                const primaryIndex = canonIndex !== -1 ? canonIndex : 0;

                const primaryChild = node.children[primaryIndex];
                const sideChildren = node.children.filter((_, i) => i !== primaryIndex);

                // 2. Spawn side branches first
                sideChildren.forEach(child => {
                  const sBranch = gitgraph.branch({
                    name: child.chapter.id,
                    style: { label: { display: false } }
                  });
                  renderNodes([child], sBranch);
                });

                // 3. Continue current branch with primary child
                renderNodes([primaryChild], branch);
              }
            });
          };

          const roots = tree;
          if (roots.length > 0) {
            // If we have multiple roots, spawn parallel branches for each root
            roots.forEach((root, i) => {
              const branch = gitgraph.branch({
                name: `root-${i}`,
                style: { label: { display: false } }
              });
              renderNodes([root], branch);
            });
          }
        }}
      </Gitgraph>

      <style jsx global>{`
        .custom-gitgraph svg {
          height: auto !important;
          min-height: 400px;
        }
        .dark .custom-gitgraph text {
          fill: #a1a1aa;
        }
      `}</style>
    </div>
  );
}
