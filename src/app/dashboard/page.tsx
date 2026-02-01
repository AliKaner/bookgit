
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './dashboard.module.scss'
import { db } from '@/db'
import { books } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch users books using Drizzle
  const myBooks = await db
    .select()
    .from(books)
    .where(eq(books.authorId, user.id))
    .orderBy(desc(books.createdAt))

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <Link href="/books/new" className={styles.newBookBtn}>
          + New Book
        </Link>
      </header>

      <section className={styles.section}>
        <h2>My Books</h2>
        {myBooks.length > 0 ? (
          <div className={styles.grid}>
            {myBooks.map((book) => (
              <Link href={`/books/${book.id}`} key={book.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.card}>
                  <h3>{book.title}</h3>
                  <p>{book.description || 'No description provided.'}</p>
                  <div className={styles.meta}>
                    <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                    <span>{book.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>You haven't written any books yet.</p>
            <Link href="/books/new" className={styles.newBookBtn}>
              Start Your First Book
            </Link>
          </div>
        )}
      </section>
      
      {/* TODO: Add 'My Contributions' section later */}
    </div>
  )
}
