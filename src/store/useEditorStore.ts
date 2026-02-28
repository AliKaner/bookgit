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

interface EditorState {
  chapters: Chapter[];
  activeChapterId: string;
  characters: Character[];
  dictionary: DictionaryEntry[];
  notes: Note[];
  styles: EditorStyles;
  showCharacterPanel: boolean;
  showNotesPanel: boolean;
  showSettingsPanel: boolean;
  showDictionaryPanel: boolean;
  setStyle: (key: keyof EditorStyles, value: string) => void;

  // Chapter actions
  addChapter: () => void;
  updateChapterTitle: (id: string, title: string) => void;
  updateChapterContent: (id: string, content: string) => void;
  setActiveChapter: (id: string) => void;
  removeChapter: (id: string) => void;

  // Panel toggles
  setShowCharacterPanel: (v: boolean) => void;
  setShowNotesPanel: (v: boolean) => void;
  setShowSettingsPanel: (v: boolean) => void;
  setShowDictionaryPanel: (v: boolean) => void;

  // Character actions
  addCharacter: (char: Omit<Character, 'id' | 'details'>) => void;
  removeCharacter: (id: string) => void;
  addDetail: (characterId: string, detail: CharacterDetail) => void;
  removeDetail: (characterId: string, key: string) => void;

  // Dictionary actions
  addDictionaryEntry: (entry: Omit<DictionaryEntry, 'id'>) => void;
  removeDictionaryEntry: (id: string) => void;

  // Note actions
  addNote: (title: string) => void;
  updateNote: (id: string, content: string) => void;
  updateNoteTitle: (id: string, title: string) => void;
  removeNote: (id: string) => void;
}

const COLORS = ['blue', 'red', 'emerald', 'purple', 'amber', 'pink', 'cyan', 'orange'];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const INITIAL_CHAPTER_ID = uid();

export const useEditorStore = create<EditorState>((set) => ({
  chapters: [{ id: INITIAL_CHAPTER_ID, title: 'Bölüm 1', content: '' }],
  activeChapterId: INITIAL_CHAPTER_ID,
  characters: [],
  dictionary: [],
  notes: [],
  styles: {
    titleFont: 'serif',
    titleColor: '#18181b',
    titleSize: '2xl',
    bodyFont: 'serif',
    bodyColor: '#27272a',
    bodySize: 'lg',
  },
  showCharacterPanel: true,
  showNotesPanel: false,
  showSettingsPanel: false,
  showDictionaryPanel: false,
  setStyle: (key, value) => set((state) => ({ styles: { ...state.styles, [key]: value } })),

  addChapter: () => set((state) => {
    const id = uid();
    return {
      chapters: [...state.chapters, { id, title: `Bölüm ${state.chapters.length + 1}`, content: '' }],
      activeChapterId: id,
    };
  }),
  updateChapterTitle: (id, title) => set((state) => ({
    chapters: state.chapters.map(ch => ch.id === id ? { ...ch, title } : ch)
  })),
  updateChapterContent: (id, content) => set((state) => ({
    chapters: state.chapters.map(ch => ch.id === id ? { ...ch, content } : ch)
  })),
  setActiveChapter: (id) => set({ activeChapterId: id }),
  removeChapter: (id) => set((state) => {
    const remaining = state.chapters.filter(ch => ch.id !== id);
    return {
      chapters: remaining,
      activeChapterId: remaining.length ? remaining[0].id : '',
    };
  }),

  setShowCharacterPanel: (v) => set({ showCharacterPanel: v }),
  setShowNotesPanel: (v) => set({ showNotesPanel: v }),
  setShowSettingsPanel: (v) => set({ showSettingsPanel: v }),
  setShowDictionaryPanel: (v) => set({ showDictionaryPanel: v }),

  addCharacter: (char) => set((state) => ({
    characters: [...state.characters, { ...char, id: uid(), details: [] }]
  })),
  removeCharacter: (id) => set((state) => ({ characters: state.characters.filter(c => c.id !== id) })),
  addDetail: (characterId, detail) => set((state) => ({
    characters: state.characters.map(c =>
      c.id === characterId
        ? { ...c, details: [...c.details.filter(d => d.key !== detail.key), detail] }
        : c
    )
  })),
  removeDetail: (characterId, key) => set((state) => ({
    characters: state.characters.map(c =>
      c.id === characterId ? { ...c, details: c.details.filter(d => d.key !== key) } : c
    )
  })),

  addDictionaryEntry: (entry) => set((state) => ({
    dictionary: [...state.dictionary, { ...entry, id: uid() }]
  })),
  removeDictionaryEntry: (id) => set((state) => ({
    dictionary: state.dictionary.filter(e => e.id !== id)
  })),

  addNote: (title) => set((state) => ({
    notes: [...state.notes, { id: uid(), title, content: '', createdAt: new Date().toLocaleDateString('tr-TR') }]
  })),
  updateNote: (id, content) => set((state) => ({
    notes: state.notes.map(n => n.id === id ? { ...n, content } : n)
  })),
  updateNoteTitle: (id, title) => set((state) => ({
    notes: state.notes.map(n => n.id === id ? { ...n, title } : n)
  })),
  removeNote: (id) => set((state) => ({ notes: state.notes.filter(n => n.id !== id) })),
}));

export function getNextColor(arr: { color: string }[]): string {
  return COLORS[arr.length % COLORS.length];
}
