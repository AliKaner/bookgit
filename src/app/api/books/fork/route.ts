
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { books } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { originalBookId } = await request.json()

  try {
    // 1. Fetch original book
    const [originalBook] = await db.select().from(books).where(eq(books.id, originalBookId))
    
    if (!originalBook) {
      return new NextResponse('Book not found', { status: 404 })
    }

    // 2. Create new book entry
    const [newBook] = await db.insert(books).values({
      title: `${originalBook.title} (Fork)`,
      description: `Forked from ${originalBook.title}. ${originalBook.description}`,
      authorId: user.id,
      originalBookId: originalBook.id,
      isPublic: true,
    }).returning({ id: books.id })

    // Note: We are NOT copying chapters for now. The fork starts empty or could link to original chapters logic later.
    // For MVP, user starts a fresh tree based on the premise of the original book.

    return NextResponse.json({ bookId: newBook.id })
  } catch (error) {
    console.error('Error forking book:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
