"use client";

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useEditorStore, Note } from '@/store/useEditorStore';

export function NotesPanel() {
  const { notes, addNote, removeNote } = useEditorStore();
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    const title = newTitle.trim() || 'Yeni Not';
    addNote(title);
    setNewTitle('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-3">Notlar</h2>
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Not başlığı..."
            className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors text-zinc-700 dark:text-zinc-300"
          />
          <button
            onClick={handleAdd}
            className="p-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Not Listesi */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {notes.length === 0 && (
          <p className="text-xs text-zinc-400 text-center mt-10">Henüz not yok</p>
        )}
        {notes.map(note => (
          <NoteCard key={note.id} note={note} onRemove={() => removeNote(note.id)} />
        ))}
      </div>
    </div>
  );
}

function NoteCard({ note, onRemove }: { note: Note; onRemove: () => void }) {
  const { updateNote, updateNoteTitle } = useEditorStore();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      {/* Başlık Satırı */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group"
        onClick={() => setExpanded(v => !v)}
      >
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
        }
        <input
          value={note.title}
          onClick={e => e.stopPropagation()}
          onChange={e => updateNoteTitle(note.id, e.target.value)}
          className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-transparent outline-none min-w-0 truncate"
        />
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-zinc-400 hidden group-hover:inline">{note.createdAt}</span>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
          >
            <Trash2 className="w-3 h-3 text-zinc-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* İçerik */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3">
          <textarea
            value={note.content}
            onChange={e => updateNote(note.id, e.target.value)}
            placeholder="Notlarını buraya yaz..."
            rows={5}
            className="w-full text-sm text-zinc-700 dark:text-zinc-300 bg-transparent outline-none resize-none leading-relaxed placeholder-zinc-400"
          />
        </div>
      )}
    </div>
  );
}
