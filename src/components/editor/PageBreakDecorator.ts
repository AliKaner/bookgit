import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// A5 sayfası için kelime başına ortalama karakter sayısı
// A5'te yaklaşık 280 kelime/sayfa
const WORDS_PER_PAGE = 280;

/**
 * Her ~280 kelimede bir görünmez bir ProseMirror decoration ekler.
 * Bu decoration CSS ile "· · · Sayfa 1 · · ·" görselini gösterir.
 */
export const PageBreakDecorator = Extension.create({
  name: 'pageBreakDecorator',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pageBreakDecorator'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const doc = state.doc;

            let wordCount = 0;
            let pageNumber = 1;

            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;

              const words = node.text.split(/\s+/).filter(Boolean);

              for (let i = 0; i < words.length; i++) {
                wordCount++;

                if (wordCount > 0 && wordCount % WORDS_PER_PAGE === 0) {
                  pageNumber++;
                  // Decoration'ı kelimenin sonuna (yaklaşık) koy
                  const wordPos = pos + node.text.indexOf(words[i]) + words[i].length;
                  const safePos = Math.min(wordPos, doc.content.size);

                  const div = document.createElement('span');
                  div.className = 'page-break-indicator';
                  div.setAttribute('data-page', String(pageNumber - 1));

                  decorations.push(
                    Decoration.widget(safePos, () => {
                      const el = document.createElement('span');
                      el.innerHTML = `<span class="page-break-indicator" data-page="${pageNumber - 1}"></span>`;
                      return el.firstChild as HTMLElement;
                    }, { side: 1, key: `page-${wordCount}` })
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
