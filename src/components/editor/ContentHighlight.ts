"use client";

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface HighlightItem {
  text: string;
  color: string;
}

export interface ContentHighlightOptions {
  items: HighlightItem[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    contentHighlight: {
      updateHighlightItems: (items: HighlightItem[]) => ReturnType;
    };
  }
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

export const ContentHighlight = Extension.create<ContentHighlightOptions>({
  name: 'contentHighlight',

  addOptions() {
    return { items: [] };
  },

  addCommands() {
    return {
      updateHighlightItems: (items: HighlightItem[]) => ({ editor }) => {
        this.options.items = items;
        editor.view.dispatch(editor.state.tr); // Trigger update
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey('contentHighlight'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const { doc } = state;
            const items = options.items;

            if (!items.length) return DecorationSet.empty;

            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              const text = node.text;

              for (const item of items) {
                const phrase = item.text.trim();
                if (!phrase) continue;
                
                const color = colorMap[item.color] || item.color;
                // Escaping special characters and prefixing with @
                const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`@${escapedPhrase}\\b`, 'g');
                
                let match;
                while ((match = regex.exec(text)) !== null) {
                  decorations.push(
                    Decoration.inline(pos + match.index, pos + match.index + phrase.length + 1, {
                      style: `color: ${color}; font-weight: 600;`,
                      class: 'content-highlight',
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
