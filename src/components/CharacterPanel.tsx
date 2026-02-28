"use client";

import { useState } from 'react';
import { X, Plus, Shuffle, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useEditorStore, getNextColor, Character, CharacterDetail } from '@/store/useEditorStore';
import { generateRandomName } from '@/lib/randomNames';
import { cn } from '@/lib/utils';

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

const ROLES = ['Ana Karakter', 'Yardımcı', 'Düşman', 'Yan Karakter', 'Figüran'];

const DETAIL_KEYS = [
  'Yaş', 'Boy', 'Kilo', 'Meslek', 'Özel Güç', 'Zayıf Nokta', 'Kişilik',
  'Hedef', 'Korku', 'Gizli', 'Doğum Yeri', 'Silah', 'Diğer',
];

export function CharacterPanel() {
  const { characters, addCharacter, removeCharacter } = useEditorStore();
  const [name, setName] = useState('');
  const [role, setRole] = useState('Yan Karakter');
  const [color, setColor] = useState('blue');
  const [search, setSearch] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addCharacter({ name: name.trim(), role, color });
    setName('');
    setColor(getNextColor([...characters, { id: '', name, role, color, details: [] }]));
  };

  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-3">Karakter Defteri</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Ara..."
          className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors text-zinc-700 dark:text-zinc-300"
        />
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-400 text-center mt-10">Henüz karakter yok</p>
        )}
        {filtered.map(char => (
          <CharacterCard key={char.id} char={char} onRemove={() => removeCharacter(char.id)} />
        ))}
      </div>

      {/* Ekleme Formu */}
      <div className="px-4 pb-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Karakter adı..."
            className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors text-zinc-700 dark:text-zinc-300"
          />
          <button onClick={() => { setName(generateRandomName()); setColor(getNextColor(characters)); }} title="Rastgele isim" className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-400 transition-colors">
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>
        <select value={role} onChange={e => setRole(e.target.value)} className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none text-zinc-600 dark:text-zinc-400">
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_OPTIONS.map(c => (
            <button key={c.key} onClick={() => setColor(c.key)} className={cn("w-5 h-5 rounded-full transition-all", color === c.key ? "ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-950" : "")} style={{ backgroundColor: c.hex }} />
          ))}
        </div>
        <button onClick={handleAdd} disabled={!name.trim()} className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium">
          <Plus className="w-3.5 h-3.5" /> Ekle
        </button>
      </div>
    </div>
  );
}

function CharacterCard({ char, onRemove }: { char: Character; onRemove: () => void }) {
  const { addDetail, removeDetail } = useEditorStore();
  const [expanded, setExpanded] = useState(true); // Varsayılan açık
  const [selectedKey, setSelectedKey] = useState(DETAIL_KEYS[0]);
  const [detailValue, setDetailValue] = useState('');
  const colorHex = COLOR_OPTIONS.find(c => c.key === char.color)?.hex ?? '#888';

  const handleAddDetail = () => {
    if (!detailValue.trim()) return;
    addDetail(char.id, { key: selectedKey, value: detailValue.trim() });
    setDetailValue('');
  };

  return (
    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      {/* Başlık */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group" onClick={() => setExpanded(v => !v)}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colorHex }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{char.name}</div>
          <div className="text-xs text-zinc-400">{char.role}</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
            <Trash2 className="w-3 h-3 text-zinc-400" />
          </button>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
        </div>
      </div>

      {/* Detaylar — her zaman görünür madde madde */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 px-3 py-2.5 space-y-2">

          {/* Detay listesi */}
          {char.details.length > 0 && (
            <ul className="space-y-1 mb-1.5">
              {char.details.map(d => (
                <li key={d.key} className="flex items-start gap-2 group/d text-xs">
                  <span className="text-zinc-400 mt-0.5">·</span>
                  <span className="font-medium text-zinc-600 dark:text-zinc-400 flex-shrink-0">{d.key}:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 flex-1">{d.value}</span>
                  <button onClick={() => removeDetail(char.id, d.key)} className="opacity-0 group-hover/d:opacity-100 flex-shrink-0">
                    <X className="w-2.5 h-2.5 text-zinc-400 hover:text-red-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Tek satır: Dropdown + input */}
          <div className="flex gap-1.5">
            <select
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
              className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 outline-none text-zinc-600 dark:text-zinc-400 flex-shrink-0"
            >
              {DETAIL_KEYS.map(k => <option key={k}>{k}</option>)}
            </select>
            <input
              value={detailValue}
              onChange={e => setDetailValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddDetail()}
              placeholder="Değer gir..."
              className="flex-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors text-zinc-700 dark:text-zinc-300 min-w-0"
            />
            <button onClick={handleAddDetail} disabled={!detailValue.trim()} className="p-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 transition-colors flex-shrink-0">
              <Plus className="w-3 h-3" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
