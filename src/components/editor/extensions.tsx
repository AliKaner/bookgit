import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';

// Bu extension satır içi özel InK taglarını yönetecek. 
// Örnek: [[THOUGHT]] tagları için süslü bir kutu gösterecek.

export const ThoughtBlock = Node.create({
  name: 'thoughtBlock',
  group: 'block',
  content: 'inline*',
  
  parseHTML() {
    return [
      { tag: 'div[data-type="thought-block"]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'thought-block', class: 'p-4 my-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 italic text-purple-900 dark:text-purple-200 rounded-r-lg' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ThoughtBlockComponent)
  },
})

const ThoughtBlockComponent = (props: any) => {
  return (
    <NodeViewWrapper className="thought-block-wrapper relative">
      <div className="text-xs uppercase font-bold text-purple-500 absolute -top-2 left-2 bg-white dark:bg-zinc-950 px-1">GİZLİ DÜŞÜNCE</div>
      <div className="p-4 my-4 mt-2 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 italic text-purple-900 dark:text-purple-200 rounded-r-lg">
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  )
}
