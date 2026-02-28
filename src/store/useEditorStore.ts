import { create } from 'zustand';

export interface CharacterDetail { key: string; value: string; }
export interface Character {
  id: string; name: string; role: string; color: string; details: CharacterDetail[];
}

export interface DictionaryEntry {
  id: string; word: string; meaning: string; color: string;
}

export interface Note { id: string; title: string; content: string; createdAt: string; }

export interface Chapter { id: string; title: string; content: string; }

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

export const useEditorStore = create<EditorState>((set) => ({
  chapters: [{ id: INITIAL_CHAPTER_ID, title: 'Bölüm 1', content: '' }],
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
    return { chapters: [...state.chapters, { id, title: `Bölüm ${state.chapters.length + 1}`, content: '' }], activeChapterId: id };
  }),
  updateChapterTitle: (id, title) => set((state) => ({ chapters: state.chapters.map(ch => ch.id === id ? { ...ch, title } : ch) })),
  updateChapterContent: (id, content) => set((state) => ({ chapters: state.chapters.map(ch => ch.id === id ? { ...ch, content } : ch) })),
  setActiveChapter: (id) => set({ activeChapterId: id }),
  removeChapter: (id) => set((state) => {
    const remaining = state.chapters.filter(ch => ch.id !== id);
    return { chapters: remaining, activeChapterId: remaining.length ? remaining[0].id : '' };
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
