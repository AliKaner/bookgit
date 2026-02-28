"use client";

import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CharacterHighlight } from './CharacterHighlight';
import { useEditorStore } from '@/store/useEditorStore';

interface Props {
  chapterId: string;
  initialContent?: string;
  onContentChange?: (html: string) => void;
}

const fontMap: Record<string, string> = {
  serif: 'Georgia, serif',
  sans: 'system-ui, sans-serif',
  mono: 'monospace',
};
const sizeClass: Record<string, string> = {
  sm: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export function StoryEditor({ chapterId, initialContent = '', onContentChange }: Props) {
  const { characters, styles } = useEditorStore();
  // Bölüm değişimini takip etmek için ref
  const prevChapterIdRef = useRef<string>(chapterId);
  const isMountedRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Placeholder.configure({
        placeholder: 'Bir zamanlar...',
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterHighlight.configure({
        characters: characters.map(c => ({ name: c.name, color: c.color })),
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none min-h-[60vh] pb-40 ${sizeClass[styles.bodySize] ?? 'text-lg'}`,
      },
    },
    onCreate() {
      isMountedRef.current = true;
    },
    onUpdate({ editor }) {
      // Sadece gerçek kullanıcı değişikliktinde kaydet
      if (isMountedRef.current) {
        onContentChange?.(editor.getHTML());
      }
    },
  });

  // Bölüm değiştiğinde içeriği sıfırla — stacking bug fix
  useEffect(() => {
    if (!editor) return;
    if (prevChapterIdRef.current !== chapterId) {
      prevChapterIdRef.current = chapterId;
      isMountedRef.current = false;
      editor.commands.clearContent();
      if (initialContent) {
        editor.commands.setContent(initialContent);
      }
      isMountedRef.current = true;
    }
  }, [chapterId, initialContent, editor]);

  // Font / renk değişimi
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    dom.style.fontFamily = fontMap[styles.bodyFont] ?? 'Georgia, serif';
    dom.style.color = styles.bodyColor || '';
  }, [styles.bodyFont, styles.bodyColor, editor]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
