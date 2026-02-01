
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './new-book.module.scss'
import { Button } from '@/components/ui/Button'

export default function NewBookPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Call API route to create book (safer than client-side DB call directly if RLS is tricky for multi-table inserts)
      // For MVP, we can enable RLS and use client-side or use a server action. 
      // Let's use a Server Action approach by submitting to an API route for simplicity in this file structure, 
      // OR better, since we are using App Router, we can use a Server Action.
      // BUT for now, to keep it consistent with "Not using Supabase SQL editor", let's use a simple API route 
      // or a client call if we handle the ID generation.
      
      // Actually, since we have Drizzle in `src/db`, we MUST use Server Actions or API routes for DB writes
      // because `drizzle-orm` runs on Node.js (with postgres-js), not browser.
      
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          description, 
          authorId: user.id,
          isPublic
        }),
      })

      if (!response.ok) throw new Error('Failed to create book')
      
      const { bookId } = await response.json()
      router.push(`/books/${bookId}`)
      
    } catch (err) {
      console.error(err)
      alert('Failed to create book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create a New Book</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.group}>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="The Great Adventure"
          />
        </div>
        
        <div className={styles.group}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short summary of your story..."
          />
        </div>

        <div className={styles.group}>
          <label>Visibility</label>
          <div className={styles.radioGroup}>
            <label className={`${styles.radioOption} ${isPublic ? styles.selected : ''}`}>
              <input
                type="radio"
                name="visibility"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
              />
              <span className={styles.radioLabel}>
                <strong>Public</strong>
                <small>Anyone can read and branch.</small>
              </span>
            </label>
            <label className={`${styles.radioOption} ${!isPublic ? styles.selected : ''}`}>
              <input
                type="radio"
                name="visibility"
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
              />
              <span className={styles.radioLabel}>
                <strong>Private</strong>
                <small>Only you can see this book.</small>
              </span>
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <Button href="/dashboard" variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Create Book
          </Button>
        </div>
      </form>
    </div>
  )
}
