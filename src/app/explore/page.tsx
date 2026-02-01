
import { db } from '@/db'
import { books, profiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import styles from './explore.module.scss'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let allBooks: any[] = []
  let error = null

  try {
    allBooks = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        authorName: profiles.fullName,
        authorUsername: profiles.username,
        createdAt: books.createdAt,
      })
      .from(books)
      .innerJoin(profiles, eq(books.authorId, profiles.id))
      .where(eq(books.isPublic, true))
      .orderBy(desc(books.createdAt))
  } catch (e) {
    console.error('Explore page DB error:', e)
    error = 'Failed to load books. Please try again later.'
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h1>Explore Books</h1>
            {user ? (
              <Button href="/dashboard" variant="secondary">My Dashboard</Button>
            ) : (
              <Button href="/login" variant="primary">Login to Write</Button>
            )}
        </div>
        <p className={styles.subtitle}>Discover stories written by the community.</p>
      </header>

      <div className={styles.grid}>
        {error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : allBooks.length > 0 ? (
          allBooks.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{book.title}</h3>
                <span className={styles.author}>by {book.authorName || book.authorUsername || 'Unknown'}</span>
              </div>
              <p className={styles.cardDesc}>{book.description}</p>
            </Link>
          ))
        ) : (
          <p>No public books found yet. Be the first to write one!</p>
        )}
      </div>
    </div>
  )
}
