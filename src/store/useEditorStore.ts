import { create } from 'zustand';

export interface CharacterDetail { key: string; value: string; }
export interface Character {
  id: string; name: string; role: string; color: string; details: CharacterDetail[];
}

export interface DictionaryEntry {
  id: string; word: string; meaning: string; color: string;
}

export interface Note { id: string; title: string; content: string; createdAt: string; }

export interface Chapter {
  id: string;
  title: string;
  content: string;
  parentId: string | null;  // null = root
  order: number;            // ordering among siblings
}

export interface EditorStyles {
  titleFont: string;
  titleColor: string;
  titleSize: string;
  bodyFont: string;
  bodyColor: string;
  bodySize: string;
}

export interface WorldEntry {
  id: string; label: string; value: string;
}

// A tree node for rendering
export interface ChapterNode {
  chapter: Chapter;
  children: ChapterNode[];
}

interface EditorState {
  chapters: Chapter[];
  activeChapterId: string;
  characters: Character[];
  dictionary: DictionaryEntry[];
  notes: Note[];
  world: WorldEntry[];
  styles: EditorStyles;
  showNotesPanel: boolean;
  showSettingsPanel: boolean;
  showDictionaryPanel: boolean;
  setStyle: (key: keyof EditorStyles, value: string) => void;

  addChapter: () => void;
  addBranch: (fromChapterId: string) => void;
  updateChapterTitle: (id: string, title: string) => void;
  updateChapterContent: (id: string, content: string) => void;
  setActiveChapter: (id: string) => void;
  removeChapter: (id: string) => void;

  setShowNotesPanel: (v: boolean) => void;
  setShowSettingsPanel: (v: boolean) => void;
  setShowDictionaryPanel: (v: boolean) => void;

  addCharacter: (char: Omit<Character, 'id' | 'details'>) => void;
  removeCharacter: (id: string) => void;
  addDetail: (characterId: string, detail: CharacterDetail) => void;
  removeDetail: (characterId: string, key: string) => void;

  addDictionaryEntry: (entry: Omit<DictionaryEntry, 'id'>) => void;
  removeDictionaryEntry: (id: string) => void;

  addNote: (title: string) => void;
  updateNote: (id: string, content: string) => void;
  updateNoteTitle: (id: string, title: string) => void;
  removeNote: (id: string) => void;

  addWorldEntry: (entry: Omit<WorldEntry, 'id'>) => void;
  removeWorldEntry: (id: string) => void;
  updateWorldEntry: (id: string, value: string) => void;
}

export const COLORS = ['blue', 'red', 'emerald', 'purple', 'amber', 'pink', 'cyan', 'orange'];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const INITIAL_CHAPTER_ID = uid();

// A5 sayfa hesaplaması: A5 kağıtta ~280 kelime/sayfa (standart prose layout)
export const WORDS_PER_A5_PAGE = 280;

/** Build a tree structure from flat chapters array */
export function buildChapterTree(chapters: Chapter[]): ChapterNode[] {
  const map = new Map<string, ChapterNode>();
  chapters.forEach(ch => map.set(ch.id, { chapter: ch, children: [] }));
  const roots: ChapterNode[] = [];
  chapters.forEach(ch => {
    const node = map.get(ch.id)!;
    if (ch.parentId === null) {
      roots.push(node);
    } else {
      const parent = map.get(ch.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node); // orphan → treat as root
    }
  });
  // Sort by order within each level
  function sortNodes(nodes: ChapterNode[]) {
    nodes.sort((a, b) => a.chapter.order - b.chapter.order);
    nodes.forEach(n => sortNodes(n.children));
  }
  sortNodes(roots);
  return roots;
}

/** Get active branch chapters in reading order (trace from root to active) */
export function getActiveBranchChapters(chapters: Chapter[], activeChapterId: string): Chapter[] {
  // Build ancestry set: walk from active up to root
  const byId = new Map(chapters.map(c => [c.id, c]));
  const ancestorIds = new Set<string>();
  let cur: Chapter | undefined = byId.get(activeChapterId);
  while (cur) {
    ancestorIds.add(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }

  // Now collect chapters in order: for each node, only follow the branch containing the active chapter
  const result: Chapter[] = [];
  function traverse(parentId: string | null) {
    const siblings = chapters
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.order - b.order);
    for (const ch of siblings) {
      if (parentId === null || ancestorIds.has(ch.id)) {
        // Only follow the ancestor path for branches, include all roots
        if (parentId === null) {
          result.push(ch);
          // For children of root node: only follow ancestor branch
          const children = chapters.filter(c => c.parentId === ch.id).sort((a, b) => a.order - b.order);
          const activeBranchChild = children.find(c => ancestorIds.has(c.id));
          if (activeBranchChild) {
            function followBranch(id: string) {
              const node = byId.get(id);
              if (!node) return;
              result.push(node);
              const kids = chapters.filter(c => c.parentId === id).sort((a, b) => a.order - b.order);
              const activeBranchKid = kids.find(c => ancestorIds.has(c.id));
              if (activeBranchKid) followBranch(activeBranchKid.id);
            }
            followBranch(activeBranchChild.id);
          }
        }
      }
    }
  }
  traverse(null);
  return result;
}

/** Flatten tree in DFS pre-order for preview */
export function flattenBranchForPreview(chapters: Chapter[], activeChapterId: string): Chapter[] {
  const byId = new Map(chapters.map(c => [c.id, c]));

  // Find active chapter and trace path to root
  const ancestorIds = new Set<string>();
  let cur: Chapter | undefined = byId.get(activeChapterId);
  while (cur) {
    ancestorIds.add(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }

  const result: Chapter[] = [];
  function traverse(parentId: string | null) {
    const siblings = chapters
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.order - b.order);
    for (const sib of siblings) {
      result.push(sib);
      // Only follow the branch toward the active chapter
      const kids = chapters.filter(c => c.parentId === sib.id);
      if (kids.length > 0) {
        const activeBranchKid = kids.find(c => ancestorIds.has(c.id));
        if (activeBranchKid) {
          traverse(sib.id);
          break; // only one branch per level in flatten
        }
      } else {
        traverse(sib.id);
      }
    }
  }

  // Actually do a simple linear flatten: root → child along ancestor path
  const orderedIds: string[] = [...ancestorIds].filter(id => {
    const ch = byId.get(id);
    return ch !== undefined;
  });

  // Sort by depth (distance from root)
  function depth(id: string): number {
    const ch = byId.get(id);
    if (!ch || ch.parentId === null) return 0;
    return 1 + depth(ch.parentId);
  }
  orderedIds.sort((a, b) => depth(a) - depth(b));

  return orderedIds.map(id => byId.get(id)!).filter(Boolean);
}

export const useEditorStore = create<EditorState>((set) => ({
  chapters: [{ id: INITIAL_CHAPTER_ID, title: 'Bölüm 1', content: '', parentId: null, order: 0 }],
  activeChapterId: INITIAL_CHAPTER_ID,
  characters: [],
  dictionary: [],
  notes: [],
  world: [],
  styles: {
    titleFont: 'serif', titleColor: '#ffffff', titleSize: '2xl',
    bodyFont: 'serif', bodyColor: '#ffffff', bodySize: 'lg',
  },
  showNotesPanel: false,
  showSettingsPanel: false,
  showDictionaryPanel: false,

  setStyle: (key, value) => set((state) => ({ styles: { ...state.styles, [key]: value } })),

  addChapter: () => set((state) => {
    const id = uid();
    // Add a new root-level chapter (linear continuation at root level)
    const rootChapters = state.chapters.filter(c => c.parentId === null);
    const order = rootChapters.length;
    return {
      chapters: [...state.chapters, { id, title: `Bölüm ${state.chapters.length + 1}`, content: '', parentId: null, order }],
      activeChapterId: id,
    };
  }),

  addBranch: (fromChapterId) => set((state) => {
    const id = uid();
    const siblings = state.chapters.filter(c => c.parentId === fromChapterId);
    const order = siblings.length;
    const parentChapter = state.chapters.find(c => c.id === fromChapterId);
    const branchNum = state.chapters.length + 1;
    return {
      chapters: [
        ...state.chapters,
        { id, title: `Bölüm ${branchNum} (Dal)`, content: '', parentId: fromChapterId, order },
      ],
      activeChapterId: id,
    };
  }),

  updateChapterTitle: (id, title) => set((state) => ({ chapters: state.chapters.map(ch => ch.id === id ? { ...ch, title } : ch) })),
  updateChapterContent: (id, content) => set((state) => ({ chapters: state.chapters.map(ch => ch.id === id ? { ...ch, content } : ch) })),
  setActiveChapter: (id) => set({ activeChapterId: id }),
  removeChapter: (id) => set((state) => {
    const remaining = state.chapters.filter(ch => ch.id !== id);
    // Re-parent children of removed node
    const orphans = remaining.map(ch => ch.parentId === id ? { ...ch, parentId: null } : ch);
    const newActive = orphans.find(ch => ch.id !== id) ?? orphans[0];
    return { chapters: orphans, activeChapterId: newActive?.id ?? '' };
  }),

  setShowNotesPanel: (v) => set({ showNotesPanel: v }),
  setShowSettingsPanel: (v) => set({ showSettingsPanel: v }),
  setShowDictionaryPanel: (v) => set({ showDictionaryPanel: v }),

  addCharacter: (char) => set((state) => ({ characters: [...state.characters, { ...char, id: uid(), details: [] }] })),
  removeCharacter: (id) => set((state) => ({ characters: state.characters.filter(c => c.id !== id) })),
  addDetail: (characterId, detail) => set((state) => ({
    characters: state.characters.map(c =>
      c.id === characterId ? { ...c, details: [...c.details.filter(d => d.key !== detail.key), detail] } : c
    )
  })),
  removeDetail: (characterId, key) => set((state) => ({
    characters: state.characters.map(c =>
      c.id === characterId ? { ...c, details: c.details.filter(d => d.key !== key) } : c
    )
  })),

  addDictionaryEntry: (entry) => set((state) => ({ dictionary: [...state.dictionary, { ...entry, id: uid() }] })),
  removeDictionaryEntry: (id) => set((state) => ({ dictionary: state.dictionary.filter(e => e.id !== id) })),

  addNote: (title) => set((state) => ({ notes: [...state.notes, { id: uid(), title, content: '', createdAt: new Date().toLocaleDateString('tr-TR') }] })),
  updateNote: (id, content) => set((state) => ({ notes: state.notes.map(n => n.id === id ? { ...n, content } : n) })),
  updateNoteTitle: (id, title) => set((state) => ({ notes: state.notes.map(n => n.id === id ? { ...n, title } : n) })),
  removeNote: (id) => set((state) => ({ notes: state.notes.filter(n => n.id !== id) })),

  addWorldEntry: (entry) => set((state) => ({ world: [...state.world, { ...entry, id: uid() }] })),
  removeWorldEntry: (id) => set((state) => ({ world: state.world.filter(e => e.id !== id) })),
  updateWorldEntry: (id, value) => set((state) => ({ world: state.world.map(e => e.id === id ? { ...e, value } : e) })),
}));

export function getNextColor(arr: { color: string }[]): string {
  return COLORS[arr.length % COLORS.length];
}
