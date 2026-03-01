"use client";

import { useRef, useState } from "react";
import { Plus, Pencil, Check, GitBranch, Trash2, List, GitCommitHorizontal, Star } from "lucide-react";
import { useEditorStore, buildChapterTree, ChapterNode, WORDS_PER_A5_PAGE, Chapter } from "@/store/useEditorStore";
import { cn } from "@/lib/utils";

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
        <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400">Bölümler</p>
        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
          <button
            onClick={() => setViewMode('list')}
            title="Liste görünümü"
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
            title="Git graph görünümü"
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
          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Bölümü sil?</p>
          <p className="text-[11px] text-red-600/70 dark:text-red-500/70 mb-2.5 leading-snug">
            &ldquo;{deletingChapter?.title}&rdquo; kalıcı olarak silinecek.
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={confirmDelete}
              className="flex-1 py-1 text-[11px] font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Sil
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 py-1 text-[11px] font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              İptal
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
            onSetCanon={(id) => setChapterCanon(id)}
            chapters={chapters}
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
            deleteConfirmId={deleteConfirmId}
          />
        )}
      </div>

      <button
        onClick={addChapter}
        className="flex items-center gap-2 w-full px-2 py-2 mt-3 rounded-lg text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-dashed border-zinc-200 dark:border-zinc-700"
      >
        <Plus className="w-3 h-3" /> Yeni Bölüm
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
              <button onClick={e => { e.stopPropagation(); onSetCanon(ch.id); }} title="Canon yap"
                className={cn("p-0.5 rounded transition-all flex-shrink-0",
                  ch.isCanon ? "text-amber-500 opacity-100" : "opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20")}>
                <Star className={cn("w-3 h-3", ch.isCanon && "fill-current")} />
              </button>
              <button onClick={e => onBranch(ch.id, e)} title="Dal aç"
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all flex-shrink-0">
                <GitBranch className="w-3 h-3 text-violet-400" />
              </button>
              <button onClick={e => onDelete(ch.id, e)} title="Sil"
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex-shrink-0">
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 ml-4">
          {ch.parentId !== null && !ch.isCanon && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-500 dark:text-violet-400 font-semibold uppercase tracking-wide">dal</span>
          )}
          {ch.isCanon && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide flex items-center gap-0.5">
              <Star className="w-2 h-2 fill-current" /> canon
            </span>
          )}
          {words > 0 && (
            <>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{words} kelime</span>
              <span className="text-[10px] text-zinc-300 dark:text-zinc-600">·</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">~{pages} sayfa</span>
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

interface GraphRow {
  chapter: Chapter;
  lane: number;
  parentLane: number | null;
  rowIndex: number;
}

/**
 * Lane assignment:
 *  - Each root gets its own sequential lane (root0=0, root1=1, …)
 *  - First child INHERITS parent's lane → straight vertical line continues
 *  - Additional children each get a brand-new lane → new colored branch
 *
 * Display order: DFS preorder (parent first, then children in order)
 */
function buildGraphRows(chapters: Chapter[]): GraphRow[] {
  function kids(pid: string | null) {
    return chapters.filter(c => c.parentId === pid).sort((a, b) => a.order - b.order);
  }

  const laneMap = new Map<string, number>();
  let nextLane = 0;

  function assignLanes(pid: string | null, parentLane: number | null) {
    kids(pid).forEach((ch, i) => {
      const lane = (i === 0 && parentLane !== null) ? parentLane : nextLane++;
      laneMap.set(ch.id, lane);
      assignLanes(ch.id, lane);
    });
  }
  // roots
  kids(null).forEach(r => {
    laneMap.set(r.id, nextLane++);
    assignLanes(r.id, laneMap.get(r.id)!);
  });

  const rows: GraphRow[] = [];
  function dfs(pid: string | null) {
    for (const ch of kids(pid)) {
      const lane = laneMap.get(ch.id) ?? 0;
      const parentLane = ch.parentId != null ? (laneMap.get(ch.parentId) ?? null) : null;
      rows.push({ chapter: ch, lane, parentLane, rowIndex: rows.length });
      dfs(ch.id);
    }
  }
  dfs(null);
  return rows;
}

function GitGraphView({
  chapters, activeChapterId, editingId, editTitle, inputRef,
  onSelect, onStartEdit, onCommitEdit, onEditTitleChange, onBranch, onDelete, onSetCanon, deleteConfirmId,
}: GitGraphViewProps) {
  const rows = buildGraphRows(chapters);
  const ROW_H = 36;
  const LANE_W = 20;   // wider lanes = branches lean further right
  const DOT_R = 4.5;
  const MARGIN_L = 10;

  if (rows.length === 0) return null;

  const maxLane = Math.max(...rows.map(r => r.lane));
  const SVG_W = MARGIN_L + (maxLane + 1) * LANE_W;

  // lane center x
  const cx = (lane: number) => MARGIN_L + lane * LANE_W;
  // row center y
  const cy = (idx: number) => (idx + 0.5) * ROW_H;

  // Per-lane first/last row index (for continuous vertical line)
  const laneFirst = new Map<number, number>();
  const laneLast  = new Map<number, number>();
  rows.forEach((r, i) => {
    if (!laneFirst.has(r.lane)) laneFirst.set(r.lane, i);
    laneLast.set(r.lane, i);
  });

  const textLeft = SVG_W + 4;

  return (
    <div className="relative" style={{ minHeight: rows.length * ROW_H }}>
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        width={SVG_W}
        height={rows.length * ROW_H}
        style={{ overflow: 'visible' }}
      >
        {/* 1. Continuous vertical line per lane (first→last node in that lane) */}
        {Array.from(laneFirst.entries()).map(([lane, first]) => {
          const last = laneLast.get(lane)!;
          if (first === last) return null; // single node — stub handled separately
          const color = LANE_COLORS[lane % LANE_COLORS.length];
          const rowHasCanon = rows.some(r => r.lane === lane && r.chapter.isCanon);
          return (
            <line
              key={`vline-${lane}`}
              x1={cx(lane)} y1={cy(first)}
              x2={cx(lane)} y2={cy(last)}
              stroke={rowHasCanon ? '#f59e0b' : color}
              strokeWidth={rowHasCanon ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* 1b. Short downward stub from any parent node that has branch children
             (covers the case where the parent has no same-lane continuation) */}
        {rows.map((row, i) => {
          // Count how many branch children (lane != parent's lane) this node has
          const branchKids = rows.filter(
            r => r.chapter.parentId === row.chapter.id && r.lane !== row.lane
          );
          if (branchKids.length === 0) return null;
          // Only draw stub if there is NO same-lane child continuing below
          const hasSameLaneContinuation = rows.some(
            (r, j) => j > i && r.lane === row.lane
          );
          if (hasSameLaneContinuation) return null; // vline already drawn
          // Draw stub from dot center down to where the lowest branch curve ends
          const lastBranchKidIdx = Math.max(...branchKids.map(k => k.rowIndex));
          const color = LANE_COLORS[row.lane % LANE_COLORS.length];
          return (
            <line
              key={`stub-${row.chapter.id}`}
              x1={cx(row.lane)} y1={cy(i)}
              x2={cx(row.lane)} y2={cy(lastBranchKidIdx)}
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeOpacity={0.35}
            />
          );
        })}

        {/* 2. Branch curves: child lane ≠ parent lane */}
        {rows.map((row) => {
          if (row.parentLane === null || row.parentLane === row.lane) return null;
          const parentRowIdx = rows.findIndex(r => r.chapter.id === row.chapter.parentId);
          if (parentRowIdx === -1) return null;
          const color = LANE_COLORS[row.lane % LANE_COLORS.length];
          // VS Code git graph style: exit parent rightward, arrive at child from above
          const x1b = cx(row.parentLane);
          const y1b = cy(parentRowIdx) + DOT_R;
          const x2b = cx(row.lane);
          const y2b = cy(row.rowIndex) - DOT_R;
          return (
            <path
              key={`branch-${row.chapter.id}`}
              d={`M ${x1b} ${y1b} C ${x2b} ${y1b}, ${x2b} ${y2b - 6}, ${x2b} ${y2b}`}
              fill="none"
              stroke={row.chapter.isCanon ? '#f59e0b' : color}
              strokeWidth={row.chapter.isCanon ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Dots on top of everything */}
        {rows.map((row, i) => {
          const isActive = row.chapter.id === activeChapterId;
          const color = LANE_COLORS[row.lane % LANE_COLORS.length];
          const x = cx(row.lane);
          const y = cy(i);
          return (
            <g key={`dot-${row.chapter.id}`}>
              {isActive && <circle cx={x} cy={y} r={DOT_R + 3.5} fill={row.chapter.isCanon ? '#f59e0b' : color} opacity={0.15} />}
              <circle cx={x} cy={y} r={row.chapter.isCanon ? DOT_R + 0.5 : DOT_R} fill={row.chapter.isCanon ? '#fbbf24' : color} />
              {row.chapter.isCanon && <path d={`M ${x} ${y-1.5} l 0.4 0.9 h 1 l -0.8 0.6 l 0.3 1 l -0.9 -0.6 l -0.9 0.6 l 0.3 -1 l -0.8 -0.6 h 1 z`} fill="#fff" transform={`scale(1.2) translate(${-x*0.16}, ${-y*0.16})`} />}
              {isActive && <circle cx={x} cy={y} r={DOT_R - 1.5} fill="#fff" opacity={0.45} />}
            </g>
          );
        })}
      </svg>

      {/* Text labels */}
      {rows.map((row, i) => {
        const ch = row.chapter;
        const isActive = ch.id === activeChapterId;
        const isEditing = editingId === ch.id;
        const isPendingDelete = deleteConfirmId === ch.id;
        const color = LANE_COLORS[row.lane % LANE_COLORS.length];
        const words = ch.content
          ? ch.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
          : 0;

        return (
          <div
            key={ch.id}
            className={cn(
              "group absolute flex flex-col justify-center cursor-pointer rounded-r-md transition-all pr-1",
              isActive ? "bg-zinc-100/80 dark:bg-zinc-800/80"
                : isPendingDelete ? "bg-red-50/60 dark:bg-red-950/20"
                : "hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50"
            )}
            style={{ top: i * ROW_H, left: textLeft, right: 0, height: ROW_H, paddingLeft: 4 }}
            onClick={() => onSelect(ch.id)}
          >
            {isEditing ? (
              <form onSubmit={e => { e.preventDefault(); onCommitEdit(); }} className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <input ref={inputRef} value={editTitle} onChange={e => onEditTitleChange(e.target.value)} onBlur={onCommitEdit}
                  className="flex-1 text-xs bg-white dark:bg-zinc-700 rounded px-1.5 py-0.5 outline-none border border-zinc-300 dark:border-zinc-600 min-w-0" />
                <button type="submit" onClick={e => e.stopPropagation()}><Check className="w-3 h-3 text-zinc-500" /></button>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-0.5 min-w-0">
                  <span className="flex-1 truncate text-[11px] font-medium" style={{ color }}>
                    {ch.title}
                  </span>
                  <button onClick={e => { e.stopPropagation(); onSetCanon(ch.id); }} title="Canon yap"
                    className={cn("p-0.5 rounded transition-all flex-shrink-0",
                      ch.isCanon ? "text-amber-500 opacity-100" : "opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20")}>
                    <Star className={cn("w-2.5 h-2.5", ch.isCanon && "fill-current")} />
                  </button>
                  {/* Branch: primary git action – most prominent */}
                  <button onClick={e => onBranch(ch.id, e)} title="Dal aç"
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 hover:bg-violet-500 text-violet-400 hover:text-white transition-all flex-shrink-0">
                    <GitBranch className="w-2.5 h-2.5" />
                  </button>
                  {/* Edit: secondary */}
                  <button onClick={e => onStartEdit(ch.id, ch.title, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex-shrink-0">
                    <Pencil className="w-2.5 h-2.5 text-zinc-400" />
                  </button>
                  {/* Delete: tertiary */}
                  <button onClick={e => onDelete(ch.id, e)} title="Sil"
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex-shrink-0">
                    <Trash2 className="w-2 h-2 text-red-400/70" />
                  </button>
                </div>
                {words > 0 && (
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-none">
                    {words} k · ~{Math.ceil(words / WORDS_PER_A5_PAGE)} s
                  </span>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
