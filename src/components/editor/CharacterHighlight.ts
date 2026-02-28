"use client";

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface CharacterHighlightOptions {
  characters: Array<{ name: string; color: string }>;
}

const colorMap: Record<string, string> = {
  blue: '#60a5fa',
  red: '#f87171',
  emerald: '#34d399',
  purple: '#a78bfa',
  amber: '#fbbf24',
  pink: '#f472b6',
  cyan: '#22d3ee',
  orange: '#fb923c',
};

export const CharacterHighlight = Extension.create<CharacterHighlightOptions>({
  name: 'characterHighlight',

  addOptions() {
    return { characters: [] };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey('characterHighlight'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const { doc } = state;
            const chars = options.characters;

            if (!chars.length) return DecorationSet.empty;

            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              const text = node.text;

              for (const char of chars) {
                const name = char.name.trim();
                if (!name) continue;
                const color = colorMap[char.color] || char.color;
                const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
                let match;
                while ((match = regex.exec(text)) !== null) {
                  decorations.push(
                    Decoration.inline(pos + match.index, pos + match.index + name.length, {
                      style: `color: ${color}; font-weight: 600;`,
                      class: 'character-name',
                    })
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
