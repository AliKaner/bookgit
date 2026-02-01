
'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import styles from '../chapter.module.scss'

export default function EditChapterPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id, chapterId } = use(params)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Fetch chapter data
    const fetchChapter = async () => {
      // In a real app we might use a server action or API. 
      // For now, let's use client-side select since RLS allows reading if book is visible.
      // But we need to ensure the user is the author to EDIT.
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single()
      
      if (error || !data) {
        console.error(error)
        // router.push(`/books/${id}`) // Handle error
        return
      }
      
      setTitle(data.title)
      const contentAny = data.content as any
      setContent(contentAny.text || '')
      setLoading(false)
    }
    fetchChapter()
  }, [chapterId, id, supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          title,
          content: { text: content }
        })
        .eq('id', chapterId)

      if (error) throw error
      
      router.push(`/books/${id}/chapter/${chapterId}`)
      router.refresh()
      
    } catch (err) {
      console.error(err)
      alert('Failed to update chapter')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className={styles.container}>Loading...</div>

  return (
    <div className={styles.editorContainer}>
      <header className={styles.readerHeader}>
         <Link href={`/books/${id}/chapter/${chapterId}`} style={{ textDecoration: 'none', color: '#888' }}>
          ← Cancel Editing
        </Link> 
        <h1>Edit Chapter</h1>
      </header>

      <form onSubmit={handleSubmit} className={styles.editorForm}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Chapter Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Story Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div className={styles.floatingActions}>
          <Button type="submit" variant="primary" isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
