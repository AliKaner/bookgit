// src/lib/inkParser.ts

/**
 * INK FORMAT v1.0 basit parser fonksiyonudur.
 * Şimdilik ham metni alıp ekranda render edebilmek için HTML objesine dönüştürür.
 */

export function parseInkToHtml(inkContent: string): string {
  let html = inkContent;
  
  // 1. Scene, Chapter ve Book etiketlerini HTML div'lere çevir
  html = html.replace(/@BOOK\n([\s\S]*?)(?=@CHAPTER|$)/g, '<div class="ink-book-header bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-8 font-mono text-sm border-l-4 border-blue-500 whitespace-pre-line">$1</div>');
  html = html.replace(/@CHAPTER\s+(\d+)\nTITLE:\s+(.*?)\n/g, '<h1 class="ink-chapter-title text-4xl font-serif mt-12 mb-6" data-chapter="$1">$2</h1>');
  
  // 2. Scene bloklarını algıla
  html = html.replace(/@SCENE\n([\s\S]*?)(?=@ENDSCENE)/g, (match, sceneContent) => {
    // Scene header extract
    const headerMatch = sceneContent.match(/LOCATION: (.*?)\nTIME: (.*?)\nPOV: (.*?)\nMOOD: (.*?)\n\n([\s\S]*)/);
    
    if (headerMatch) {
      const [_, loc, time, pov, mood, text] = headerMatch;
      return `<div class="ink-scene mt-8 mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
        <div class="text-xs font-mono uppercase text-zinc-400 mb-6 flex gap-4">
           <span>📍 ${loc}</span>
           <span>⏰ ${time}</span>
           <span>👁️ ${pov}</span>
           <span>🎭 ${mood}</span>
        </div>
        <div class="ink-scene-text">${text}</div>
      </div>`;
    }
    
    return `<div class="ink-scene mt-8 mb-4 border-t pt-8 text-zinc-500 italic">Sahne başladı...<br/><br/>${sceneContent}</div>`;
  });

  html = html.replace(/@ENDSCENE/g, '');
  html = html.replace(/@ENDCHAPTER/g, '<div class="ink-chapter-end text-center italic text-zinc-400 my-12">***</div>');

  // 3. Özel Bloklar (THOUGHT vs)
  html = html.replace(/\[\[THOUGHT\]\]([\s\S]*?)\[\[ENDTHOUGHT\]\]/g, '<div data-type="thought-block">$1</div>');

  // 4. Inline biçimlendirmeler
  html = html.replace(/<<FIX>>/g, '<span class="bg-red-100 text-red-800 text-xs px-1 rounded ml-1">FIX</span>');
  html = html.replace(/<<IDEA>>/g, '<span class="bg-yellow-100 text-yellow-800 text-xs px-1 rounded ml-1">IDEA</span>');

  return html;
}
