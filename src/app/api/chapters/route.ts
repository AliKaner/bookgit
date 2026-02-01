
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { chapters } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq, and, count, isNull } from 'drizzle-orm'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { bookId, parentChapterId, title, content, authorId } = await request.json()

  if (authorId !== user.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Determine order index (append to end)
    let newOrderIndex = 1
    
    if (parentChapterId) {
      const [result] = await db
          .select({ count: count() })
          .from(chapters)
          .where(eq(chapters.parentChapterId, parentChapterId))
      newOrderIndex = result.count + 1
    } else if (bookId) {
      // Root chapters for a book
       const [result] = await db
          .select({ count: count() })
          .from(chapters)
          .where(and(eq(chapters.bookId, bookId), isNull(chapters.parentChapterId)))
       newOrderIndex = result ? result.count + 1 : 1
    } else {
       // Should not happen if API is used correctly
       console.error("Missing bookId for root chapter creation")
       return new NextResponse('Bad Request: Missing bookId', { status: 400 })
    }

    // Simplified query logic using dynamic where
    // But wait, 'parentChapterId' is passed from client.
    
    // We need to support creating a root chapter.
    // If parentChapterId is NOT provided (null/undefined), it's a root chapter.
    
    const [newChapter] = await db.insert(chapters).values({
      bookId,
      parentChapterId: parentChapterId || null, // Ensure explicit null
      authorId: user.id,
      title,
      content,
      orderIndex: newOrderIndex, // TODO: Fix order index logic for root vs branch, generic is fine for MVP (1)
      isCanonical: !parentChapterId, // First chapter is canonical by default? Or user choice. Let's make it canonical if root.
    }).returning({ id: chapters.id })

    return NextResponse.json({ chapterId: newChapter.id })
  } catch (error) {
    console.error('Error creating chapter:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
