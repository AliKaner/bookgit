"use client";

import { useState } from 'react';
import { Plus, X, Book, Pencil, Check } from 'lucide-react';
import { useEditorStore, getNextColor } from '@/store/useEditorStore';
import { AutoTextarea } from '@/components/AutoTextarea';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/LanguageContext';

const COLOR_OPTIONS = [
  { key: 'blue', hex: '#60a5fa' },
  { key: 'red', hex: '#f87171' },
  { key: 'emerald', hex: '#34d399' },
  { key: 'purple', hex: '#a78bfa' },
  { key: 'amber', hex: '#fbbf24' },
  { key: 'pink', hex: '#f472b6' },
  { key: 'cyan', hex: '#22d3ee' },
  { key: 'orange', hex: '#fb923c' },
];

export function DictionaryPanel() {
  const { t } = useTranslation();
  const { dictionary, addDictionaryEntry, removeDictionaryEntry, updateDictionaryEntry } = useEditorStore();
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [color, setColor] = useState('blue');
  const [search, setSearch] = useState('');

  const handleAdd = () => {
    if (!word.trim() || !meaning.trim()) return;
    addDictionaryEntry({ word: word.trim(), meaning: meaning.trim(), color });
    setWord('');
    setMeaning('');
    setColor(getNextColor(dictionary));
  };

  const filtered = dictionary.filter(e =>
    e.word.toLowerCase().includes(search.toLowerCase()) ||
    e.meaning.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <Book className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          <h2 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{t.dictionary.title}</h2>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.dictionary.searchPlaceholder}
          className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400 transition-colors text-zinc-700 dark:text-zinc-300"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-400 text-center mt-10">{t.dictionary.noEntries}</p>
        )}
        {filtered.map(entry => (
          <DictionaryCard 
            key={entry.id} 
            entry={entry} 
            onRemove={() => removeDictionaryEntry(entry.id)}
            onUpdate={(updates) => updateDictionaryEntry(entry.id, updates)}
          />
        ))}
      </div>

      {/* Ekleme */}
      <div className="px-4 pb-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
        <input
          value={word}
          onChange={e => setWord(e.target.value)}
          placeholder={t.dictionary.addWord}
          className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400 transition-colors text-zinc-700 dark:text-zinc-300"
        />
        <AutoTextarea
          value={meaning}
          onChange={e => setMeaning(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAdd())}
          placeholder={t.dictionary.addMeaning}
          className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400 transition-colors text-zinc-700 dark:text-zinc-300"
        />
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c.key}
              onClick={() => setColor(c.key)}
              className={cn("w-5 h-5 rounded-full transition-all", color === c.key ? "ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-950" : "")}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
        <button
          onClick={handleAdd}
          disabled={!word.trim() || !meaning.trim()}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> {t.common.add}
        </button>
      </div>
    </div>
  );
}
function DictionaryCard({ entry, onRemove, onUpdate }: { entry: any; onRemove: () => void; onUpdate: (u: any) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editWord, setEditWord] = useState(entry.word);
  const [editMeaning, setEditMeaning] = useState(entry.meaning);
  const colorHex = COLOR_OPTIONS.find(c => c.key === entry.color)?.hex ?? '#888';

  const handleSave = () => {
    if (editWord.trim()) {
      onUpdate({ word: editWord.trim(), meaning: editMeaning.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className="group flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: colorHex }} />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-1.5">
            <input 
              value={editWord} 
              onChange={e => setEditWord(e.target.value)}
              className="w-full text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 outline-none"
            />
            <AutoTextarea 
              value={editMeaning} 
              onChange={e => setEditMeaning(e.target.value)}
              className="w-full text-[10px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 outline-none"
            />
          </div>
        ) : (
          <>
            <div className="text-sm font-medium truncate" style={{ color: colorHex }}>{entry.word}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{entry.meaning}</div>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        {isEditing ? (
          <button onClick={handleSave} className="p-1 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 transition-all">
            <Check className="w-3 h-3" />
          </button>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
              <Pencil className="w-3 h-3 text-zinc-400" />
            </button>
            <button
              onClick={onRemove}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              <X className="w-3 h-3 text-zinc-400" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
