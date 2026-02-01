
import { db } from '@/db'
import { chapters, books } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import styles from './chapter.module.scss'
import { createClient } from '@/lib/supabase/server'

export default async function ChapterPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id, chapterId } = await params
  
  // Fetch current chapter
  const [chapter] = await db.select().from(chapters).where(eq(chapters.id, chapterId))
  if (!chapter) notFound()

  // Fetch current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthor = user && user.id === chapter.authorId

  // Fetch Book Info
  const [book] = await db.select().from(books).where(eq(books.id, id))

  // Fetch children (next options)
  const children = await db
    .select()
    .from(chapters)
    .where(eq(chapters.parentChapterId, chapterId))
    .orderBy(chapters.orderIndex)

  // Parse Content
  // Assuming content is stored as { text: "..." } or simple string for MVP
  // If it's pure JSONB, we need to handle it. For MVP lets assume it has a 'text' field.
  const contentText = (chapter.content as any).text || "No content."

  return (
    <div className={styles.container}>
      <header className={styles.readerHeader}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href={`/books/${id}`} style={{ textDecoration: 'none', color: '#888' }}>
            ← {book.title}
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAuthor && (
            <Link href={`/books/${id}/chapter/${chapterId}/edit`} style={{ fontSize: '0.9rem', color: '#000', textDecoration: 'underline' }}>
              Edit Chapter
            </Link>
          )}
        </div>
        <h1>{chapter.title}</h1>
      </header>

      <article className={styles.content}>
        {contentText.split('\n').map((para: string, i: number) => (
          <p key={i}>{para}</p>
        ))}
      </article>

      <section className={styles.choices}>
        <h3>What happens next?</h3>
        
        <div className={styles.choiceList}>
          {children.map(child => (
            <Link key={child.id} href={`/books/${id}/chapter/${child.id}`} className={styles.choiceCard}>
              <span className={styles.title}>{child.title}</span>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: '#666', marginBottom: '1rem', fontStyle: 'italic' }}>
                {children.length === 0 ? "The story ends here... or does it?" : "Don't like these options?"}
            </p>
            <Link href={`/books/${id}/chapter/${chapterId}/new`} className={styles.writeBranch}>
            Build a New Branch
            </Link>
        </div>
      </section>
    </div>
  )
}
