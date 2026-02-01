
import { db } from '@/db'
import { books, chapters } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import styles from './book-detail.module.scss'
import { createClient } from '@/lib/supabase/server'

// Fetch full tree
async function getBookTree(bookId: string) {
  const allChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.bookId, bookId))
  
  // Build simple generic tree structure
  const chapterMap = new Map()
  allChapters.forEach(ch => chapterMap.set(ch.id, { ...ch, children: [] }))
  
  const rootNodes: any[] = []
  
  chapterMap.forEach(node => {
    if (node.parentChapterId) {
      const parent = chapterMap.get(node.parentChapterId)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      rootNodes.push(node)
    }
  })

  // Recursive sort by orderIndex
  const sortNodes = (nodes: any[]) => {
    nodes.sort((a, b) => a.orderIndex - b.orderIndex)
    nodes.forEach(node => {
      if (node.children.length > 0) sortNodes(node.children)
    })
  }
  sortNodes(rootNodes)
  
  return rootNodes
}

// Client component for the fork button
import ForkButton from '@/components/ForkButton'
import { Button } from '@/components/ui/Button'

const TreeNode = ({ node }: { node: any }) => {
  return (
    <div className={styles.treeNode}>
      <Link href={`/books/${node.bookId}/chapter/${node.id}`} className={`${styles.nodeCard} ${node.isCanonical ? styles.canonical : ''}`}>
        <span className={styles.title}>{node.title}</span>
        {node.isCanonical && <span className={styles.meta}>★ Canonical</span>}
      </Link>
      {node.children.length > 0 && (
        <div className={styles.children}>
          {node.children.map((child: any) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  )
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Fetch Book
  const [book] = await db.select().from(books).where(eq(books.id, id))
  if (!book) notFound()

  // Fetch Original Book if it exists
  let originalBook = null
  if (book.originalBookId) {
    const [res] = await db.select({ id: books.id, title: books.title }).from(books).where(eq(books.id, book.originalBookId))
    originalBook = res
  }

  // Fetch Tree
  const tree = await getBookTree(id)

  // Fetch current user to check ownership
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user && user.id === book.authorId
  
  const firstChapterId = tree.length > 0 ? tree[0].id : null

  return (
    <div className={styles.container}>
      <nav className={styles.topNav}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Dashboard
        </Link>
      </nav>

      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h1>{book.title}</h1>
                 {originalBook && (
                  <Link href={`/books/${originalBook.id}`} className={styles.forkLabel}>
                    Forked from {originalBook.title}
                  </Link>
                )}
                <p>{book.description}</p>
            </div>
            {isOwner && (
                <Link href={`/books/${id}/edit`} style={{ textDecoration: 'underline', color: '#666', fontSize: '0.9rem' }}>
                    Edit Settings
                </Link>
            )}
        </div>
      </header>

      <div className={styles.actions}>
        {firstChapterId ? (
          <Link href={`/books/${book.id}/chapter/${firstChapterId}`} className={styles.readBtn}>Start Reading</Link>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ color: '#999', padding: '0.8rem 0' }}>No chapters yet.</span>
                {isOwner && (
                     <Link href={`/books/${book.id}/new-chapter`} className={styles.readBtn}>
                        Write First Chapter
                    </Link>
                )}
            </div>
        )}
        {user && !isOwner && <ForkButton bookId={book.id} />}
      </div>

      {tree.length > 0 && (
        <section className={styles.treeSection}>
          <h2>Story Map</h2>
          <div>
            {tree.map(node => (
              <TreeNode key={node.id} node={node} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
