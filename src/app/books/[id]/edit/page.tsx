
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
// Reuse styles from new-book for consistency or create shared styles
import styles from '../../new/new-book.module.scss' 

export default function EditBookPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchBook = async () => {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single()
        
        if (error || !data) {
            console.error(error)
            return
        }

        setTitle(data.title)
        setDescription(data.description || '')
        setIsPublic(data.is_public)
        setLoading(false)
    }
    fetchBook()
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
        // We can use Supabase client directly since RLS enforces update policy (only owner can update)
      const { error } = await supabase
        .from('books')
        .update({
          title,
          description,
          is_public: isPublic
        })
        .eq('id', id)

      if (error) throw error
      
      router.push(`/books/${id}`)
      router.refresh()
      
    } catch (err) {
      console.error(err)
      alert('Failed to update book')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className={styles.container}>Loading...</div>

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit Book Settings</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.group}>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className={styles.group}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
          <Button href={`/books/${id}`} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
