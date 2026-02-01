
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../db';
import { chapters } from '../db/schema';
import { eq } from 'drizzle-orm';

// Type for the Chapter Node in the Tree
type ChapterNode = typeof chapters.$inferSelect & {
  children: ChapterNode[];
};

async function getBookTree(bookId: string) {
  // 1. Fetch all chapters for the book
  const allChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.bookId, bookId));

  // 2. Build map for O(1) access
  const chapterMap = new Map<string, ChapterNode>();
  allChapters.forEach((ch) => {
    chapterMap.set(ch.id, { ...ch, children: [] });
  });

  // 3. Construct Tree
  const rootNodes: ChapterNode[] = [];
  
  chapterMap.forEach((node) => {
    if (node.parentChapterId) {
      const parent = chapterMap.get(node.parentChapterId);
      if (parent) {
        parent.children.push(node);
        // Optional: Sort children by orderIndex
        parent.children.sort((a, b) => a.orderIndex - b.orderIndex);
      }
    } else {
      rootNodes.push(node);
    }
  });
  
  // Sort roots
  rootNodes.sort((a, b) => a.orderIndex - b.orderIndex);

  return rootNodes;
}

// Example usage
async function main() {
  const BOOK_ID = 'your-book-uuid-here';
  
  try {
    const tree = await getBookTree(BOOK_ID);
    console.log(JSON.stringify(tree, null, 2));
  } catch (error) {
    console.error(error);
  }
}

// Check if running directly
if (require.main === module) {
  main();
}

export { getBookTree };
