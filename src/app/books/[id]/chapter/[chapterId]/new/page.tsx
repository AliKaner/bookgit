
'use client'

import { useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../chapter.module.scss'
import { Button } from '@/components/ui/Button'

export default function NewChapterPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  // We need to unwrap params in Next.js 15+, but let's assume they are passed as props correctly or use use() hook if async
  // For client component, props are passed directly.
  const { id, chapterId } = use(params)

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
          parentChapterId: chapterId,
          title,
          content: { text: content }, // Simple JSON structure
          authorId: user.id
        }),
      })

      if (!response.ok) throw new Error('Failed to create chapter')
      
      const { chapterId: newId } = await response.json()
      router.push(`/books/${id}/chapter/${newId}`)
      
    } catch (err) {
      console.error(err)
      alert('Failed to branch story')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.editorContainer}>
      <header className={styles.readerHeader}>
         <Link href={`/books/${id}/chapter/${chapterId}`} style={{ textDecoration: 'none', color: '#888' }}>
          ← Back to Story
        </Link> 
        <h1>Write a New Branch</h1>
      </header>

      <form onSubmit={handleSubmit} className={styles.editorForm}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Chapter Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. The Hidden Door"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Story Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write what happens next..."
            required
          />
        </div>

        <div className={styles.floatingActions}>
          <Button type="submit" variant="primary" isLoading={loading}>
            Publish Chapter
          </Button>
        </div>
      </form>
    </div>
  )
}
