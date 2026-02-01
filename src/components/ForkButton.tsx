
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function ForkButton({ bookId }: { bookId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleFork = async () => {
    if (!confirm('Fork this book? You will start a fresh version of it.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/books/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalBookId: bookId })
      })
      if (!res.ok) throw new Error('Failed to fork')
      const { bookId: newId } = await res.json()
      router.push(`/books/${newId}`)
    } catch (e) {
      console.error(e)
      alert('Error forking book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleFork} isLoading={loading}>
      Fork Book
    </Button>
  )
}
