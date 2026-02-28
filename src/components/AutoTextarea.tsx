"use client";

import { useEffect, useRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

/**
 * Yazdıkça yukarı doğru büyüyen textarea.
 * Tek satırdan başlar, içerik arttıkça genişler.
 */
export function AutoTextarea({ className, value, onChange, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={e => { onChange?.(e); resize(); }}
      className={cn(
        "resize-none overflow-hidden leading-relaxed",
        className
      )}
      {...rest}
    />
  );
}
