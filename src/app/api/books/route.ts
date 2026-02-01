
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { books } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { title, description, authorId, isPublic } = await request.json()

  if (authorId !== user.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const [newBook] = await db.insert(books).values({
      title,
      description,
      authorId: user.id,
      isPublic: isPublic, 
    }).returning({ id: books.id })

    return NextResponse.json({ bookId: newBook.id })
  } catch (error) {
    console.error('Error creating book:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
