
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

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new NextResponse('Bad Request: Invalid JSON', { status: 400 });
  }

  const { bookId, parentChapterId, title, content, authorId } = body;

  if (authorId !== user.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (!bookId) {
    return new NextResponse('Bad Request: Missing bookId', { status: 400 })
  }

  try {
    // Determine order index (append to end)
    let newOrderIndex = 1
    
    if (parentChapterId) {
      const [result] = await db
          .select({ count: count() })
          .from(chapters)
          .where(eq(chapters.parentChapterId, parentChapterId))
      newOrderIndex = (result?.count ?? 0) + 1
    } else {
      // Root chapters for a book
       const [result] = await db
          .select({ count: count() })
          .from(chapters)
          .where(and(eq(chapters.bookId, bookId), isNull(chapters.parentChapterId)))
       newOrderIndex = (result?.count ?? 0) + 1
    }

    const [newChapter] = await db.insert(chapters).values({
      bookId,
      parentChapterId: parentChapterId || null, // Ensure explicit null
      authorId: user.id,
      title,
      content,
      orderIndex: newOrderIndex,
      isCanonical: !parentChapterId, // First chapter is canonical by default
    }).returning({ id: chapters.id })

    return NextResponse.json({ chapterId: newChapter.id })
  } catch (error) {
    console.error('Error creating chapter:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
