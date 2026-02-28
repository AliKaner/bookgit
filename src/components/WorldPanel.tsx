"use client";

import { useState } from 'react';
import { Plus, X, Globe, Pencil, Check } from 'lucide-react';
import { useEditorStore, WorldEntry } from '@/store/useEditorStore';
import { AutoTextarea } from '@/components/AutoTextarea';

// Hazır dünya kategorileri
const PRESETS = [
  'Ülke', 'Bölge', 'Şehir', 'Dönem / Tarih', 'Dünya Adı',
  'Yönetim Biçimi', 'Para Birimi', 'Dil', 'Din / İnanç',
  'Teknoloji Seviyesi', 'İklim', 'Önemli Yer', 'Tarihsel Olay',
];

export function WorldPanel() {
  const { world, addWorldEntry, removeWorldEntry, updateWorldEntry } = useEditorStore();
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (!label.trim() || !value.trim()) return;
    addWorldEntry({ label: label.trim(), value: value.trim() });
    setLabel('');
    setValue('');
  };

  const handlePreset = (preset: string) => {
    setLabel(preset);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-zinc-500" />
          <h2 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Dünya Bilgisi</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-3">Kitabının geçtiği evrenin bilgilerini buraya ekle</p>

        {/* Hızlı preset butonlar */}
        <div className="flex flex-wrap gap-1 mb-3">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {world.length === 0 && (
          <p className="text-xs text-zinc-400 text-center mt-8">Henüz dünya bilgisi yok</p>
        )}
        {world.map(entry => (
          <WorldCard
            key={entry.id}
            entry={entry}
            isEditing={editingId === entry.id}
            editValue={editValue}
            onStartEdit={() => { setEditingId(entry.id); setEditValue(entry.value); }}
            onEditChange={setEditValue}
            onCommit={() => { updateWorldEntry(entry.id, editValue); setEditingId(null); }}
            onRemove={() => removeWorldEntry(entry.id)}
          />
        ))}
      </div>

      {/* Ekleme Formu */}
      <div className="px-4 pb-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Kategori (ör. Ülke, Dönem...)"
          className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400 transition-colors text-zinc-700 dark:text-zinc-300"
        />
        <AutoTextarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAdd())}
          placeholder="Değer..."
          className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400 transition-colors text-zinc-700 dark:text-zinc-300"
        />
        <button
          onClick={handleAdd}
          disabled={!label.trim() || !value.trim()}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Ekle
        </button>
      </div>
    </div>
  );
}

function WorldCard({ entry, isEditing, editValue, onStartEdit, onEditChange, onCommit, onRemove }: {
  entry: WorldEntry;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onEditChange: (v: string) => void;
  onCommit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-start gap-2 px-3 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">{entry.label}</div>
        {isEditing ? (
          <form onSubmit={e => { e.preventDefault(); onCommit(); }} className="flex gap-1">
            <AutoTextarea
              autoFocus
              value={editValue}
              onChange={e => onEditChange(e.target.value)}
              onBlur={onCommit}
              className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded px-1.5 py-0.5 outline-none min-w-0"
            />
            <button type="submit"><Check className="w-3 h-3 text-zinc-400" /></button>
          </form>
        ) : (
          <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{entry.value}</div>
        )}
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onStartEdit} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">
          <Pencil className="w-3 h-3 text-zinc-400" />
        </button>
        <button onClick={onRemove} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">
          <X className="w-3 h-3 text-zinc-400 hover:text-red-400" />
        </button>
      </div>
    </div>
  );
}
