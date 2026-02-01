
'use client'

import { useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
// Reuse styles
import styles from '../chapter/[chapterId]/chapter.module.scss'

export default function NewRootChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const response = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: id,
          parentChapterId: null, // Root chapter
          title,
          content: { text: content },
          authorId: user.id
        }),
      })

      if (!response.ok) throw new Error('Failed to create chapter')
      
      const { chapterId: newId } = await response.json()
      router.push(`/books/${id}/chapter/${newId}`)
      
    } catch (err) {
      console.error(err)
      alert('Failed to publish chapter')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.editorContainer}>
      <header className={styles.readerHeader}>
         <Link href={`/books/${id}`} style={{ textDecoration: 'none', color: '#888' }}>
          ← Cancel
        </Link> 
        <h1>Write First Chapter</h1>
      </header>

      <form onSubmit={handleSubmit} className={styles.editorForm}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Chapter Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Chapter 1: The Beginning"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Story Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start your story here..."
            required
          />
        </div>

        <div className={styles.floatingActions}>
           <Button type="submit" variant="primary" isLoading={loading}>
            Publish
          </Button>
        </div>
      </form>
    </div>
  )
}
