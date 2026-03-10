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
  isCanon: boolean;         // true = part of the canon timeline
}

export interface EditorStyles {
  titleFont: string;
  titleColor: string;
  titleSize: string;
  bodyFont: string;
  bodyColor: string;
  bodySize: string;
  autosaveInterval: number; // 0 = off, 1, 2, 5 (minutes)
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
  bookId: string | null;
  showNotesPanel: boolean;
  showSettingsPanel: boolean;
  showDictionaryPanel: boolean;
  setStyle: (key: keyof EditorStyles, value: string | number) => void;

  addChapter: () => void;
  addBranch: (fromChapterId: string) => void;
  updateChapterTitle: (id: string, title: string) => void;
  updateChapterContent: (id: string, content: string) => void;
  updateCharacter: (id: string, updates: Partial<Omit<Character, 'id' | 'details'>>) => void;
  updateDictionaryEntry: (id: string, updates: Partial<Omit<DictionaryEntry, 'id'>>) => void;
  setActiveChapter: (id: string) => void;
  removeChapter: (id: string) => void;
  setChapterCanon: (id: string) => void;  // marks as canon, unsets siblings

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

  loadBookData: (data: Partial<EditorState>) => void;
}

export const COLORS = ['blue', 'red', 'emerald', 'purple', 'amber', 'pink', 'cyan', 'orange'];
const uid = () => crypto.randomUUID();

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
  chapters: [{ id: INITIAL_CHAPTER_ID, title: 'Chapter 1', content: '', parentId: null, order: 0, isCanon: true }],
  activeChapterId: INITIAL_CHAPTER_ID,
  characters: [],
  dictionary: [],
  notes: [],
  world: [],
  bookId: null,
  styles: {
    titleFont: 'serif', titleColor: '#ffffff', titleSize: '2xl',
    bodyFont: 'serif', bodyColor: '#ffffff', bodySize: 'lg',
    autosaveInterval: 1, // Default to 1 minute
  },
  showNotesPanel: false,
  showSettingsPanel: false,
  showDictionaryPanel: false,

  setStyle: (key, value) => set((state) => ({ styles: { ...state.styles, [key]: value } })),

  addChapter: () => set((state) => {
    const id = uid();
    // Find the last canon chapter in the linear chain
    let lastCanon: Chapter | null = null;
    const roots = state.chapters.filter(c => c.parentId === null).sort((a, b) => a.order - b.order);
    const lastRoot = roots[roots.length - 1];
    if (lastRoot) {
      lastCanon = lastRoot;
      // Walk down through canon children to find the deepest one
      let current: Chapter | undefined = lastCanon;
      while (current) {
        const canonChild = state.chapters
          .filter(c => c.parentId === current!.id && c.isCanon)
          .sort((a, b) => a.order - b.order)
          .pop();
        if (canonChild) {
          lastCanon = canonChild;
          current = canonChild;
        } else {
          break;
        }
      }
    }
    const parentId = lastCanon?.id ?? null;
    const siblings = state.chapters.filter(c => c.parentId === parentId);
    const order = siblings.length;
    return {
      chapters: [...state.chapters, { id, title: `Chapter ${state.chapters.length + 1}`, content: '', parentId, order, isCanon: true }],
      activeChapterId: id,
    };
  }),

  addBranch: (fromChapterId) => set((state) => {
    const id = uid();
    const siblings = state.chapters.filter(c => c.parentId === fromChapterId);
    const order = siblings.length;
    const branchNum = state.chapters.length + 1;
    return {
      chapters: [
        ...state.chapters,
        { id, title: `Chapter ${branchNum} (Branch)`, content: '', parentId: fromChapterId, order, isCanon: false },
      ],
      activeChapterId: id,
    };
  }),

  updateChapterTitle: (id, title) => set((state) => ({ chapters: state.chapters.map(ch => ch.id === id ? { ...ch, title } : ch) })),
  updateChapterContent: (id, content) => set((state) => ({ chapters: state.chapters.map(ch => ch.id === id ? { ...ch, content } : ch) })),
  setActiveChapter: (id) => set({ activeChapterId: id }),
  removeChapter: (id) => set((state) => {
    const remaining = state.chapters.filter(ch => ch.id !== id);
    const orphans = remaining.map(ch => ch.parentId === id ? { ...ch, parentId: null } : ch);
    const newActive = orphans.find(ch => ch.id !== id) ?? orphans[0];
    return { chapters: orphans, activeChapterId: newActive?.id ?? '' };
  }),
  // Mark/unmark a chapter as canon. If unmarking, all descendants also lose canon status.
  setChapterCanon: (id) => set((state) => {
    const target = state.chapters.find(c => c.id === id);
    if (!target) return {};

    const becomingCanon = !target.isCanon;

    if (becomingCanon) {
      // Set this one as canon; siblings lose canon status
      return {
        chapters: state.chapters.map(ch => {
          if (ch.id === id) return { ...ch, isCanon: true };
          if (ch.parentId === target.parentId) return { ...ch, isCanon: false };
          return ch;
        })
      };
    } else {
      // Unset this one and ALL its descendants
      const descendantIds = new Set<string>();
      const collect = (pid: string) => {
        state.chapters.filter(ch => ch.parentId === pid).forEach(ch => {
          descendantIds.add(ch.id);
          collect(ch.id);
        });
      };
      collect(id);

      return {
        chapters: state.chapters.map(ch => {
          if (ch.id === id || descendantIds.has(ch.id)) return { ...ch, isCanon: false };
          return ch;
        })
      };
    }
  }),

  setShowNotesPanel: (v) => set({ showNotesPanel: v }),
  setShowSettingsPanel: (v) => set({ showSettingsPanel: v }),
  setShowDictionaryPanel: (v) => set({ showDictionaryPanel: v }),

  addCharacter: (char) => set((state) => ({ characters: [...state.characters, { ...char, id: uid(), details: [] }] })),

  updateCharacter: (id, updates) => set((state) => {
    const char = state.characters.find(c => c.id === id);
    if (!char) return {};

    let newChapters = state.chapters;
    // Eğer isim değişiyorsa, tüm bölümlerde refactor yap
    if (updates.name && updates.name !== char.name) {
      const oldName = char.name.trim();
      const newName = updates.name.trim();
      if (oldName && newName) {
        // Look for @Name (case sensitive or bound to @)
        const regex = new RegExp(`@${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        newChapters = state.chapters.map(ch => ({
          ...ch,
          content: ch.content.replace(regex, `@${newName}`)
        }));
      }
    }

    return {
      characters: state.characters.map(c => c.id === id ? { ...c, ...updates } : c),
      chapters: newChapters
    };
  }),

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

  updateDictionaryEntry: (id, updates) => set((state) => {
    const entry = state.dictionary.find(e => e.id === id);
    if (!entry) return {};

    let newChapters = state.chapters;
    if (updates.word && updates.word !== entry.word) {
      const oldWord = entry.word.trim();
      const newWord = updates.word.trim();
      if (oldWord && newWord) {
        const regex = new RegExp(`@${oldWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        newChapters = state.chapters.map(ch => ({
          ...ch,
          content: ch.content.replace(regex, `@${newWord}`)
        }));
      }
    }

    return {
      dictionary: state.dictionary.map(e => e.id === id ? { ...e, ...updates } : e),
      chapters: newChapters
    };
  }),

  removeDictionaryEntry: (id) => set((state) => ({ dictionary: state.dictionary.filter(e => e.id !== id) })),

  addNote: (title) => set((state) => ({ notes: [...state.notes, { id: uid(), title, content: '', createdAt: new Date().toLocaleDateString('tr-TR') }] })),
  updateNote: (id, content) => set((state) => ({ notes: state.notes.map(n => n.id === id ? { ...n, content } : n) })),
  updateNoteTitle: (id, title) => set((state) => ({ notes: state.notes.map(n => n.id === id ? { ...n, title } : n) })),
  removeNote: (id) => set((state) => ({ notes: state.notes.filter(n => n.id !== id) })),

  addWorldEntry: (entry) => set((state) => ({ world: [...state.world, { ...entry, id: uid() }] })),
  removeWorldEntry: (id) => set((state) => ({ world: state.world.filter(e => e.id !== id) })),
  updateWorldEntry: (id, value) => set((state) => {
    const entry = state.world.find(e => e.id === id);
    if (!entry) return {};

    let newChapters = state.chapters;
    const oldVal = entry.value.trim();
    const newVal = value.trim();

    if (oldVal && newVal && oldVal !== newVal) {
      const regex = new RegExp(`@${oldVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      newChapters = state.chapters.map(ch => ({
        ...ch,
        content: ch.content.replace(regex, `@${newVal}`)
      }));
    }

    return {
      world: state.world.map(e => e.id === id ? { ...e, value } : e),
      chapters: newChapters
    };
  }),

  loadBookData: (data) => set((state) => ({
    ...state,
    ...data,
    // Ensure we have at least one chapter and an active one
    chapters: data.chapters?.length ? data.chapters : state.chapters,
    activeChapterId: data.activeChapterId || (data.chapters?.[0]?.id || state.activeChapterId),
  })),
}));

export function getNextColor(arr: { color: string }[]): string {
  return COLORS[arr.length % COLORS.length];
}
