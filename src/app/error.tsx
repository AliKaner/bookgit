'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'var(--font-geist-sans), sans-serif'
    }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 700 }}>Something went wrong!</h2>
      <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '500px' }}>
        We apologize for the inconvenience. An unexpected error has occurred.
      </p>
      <Button
        onClick={() => reset()}
        variant="primary"
      >
        Try again
      </Button>
    </div>
  )
}
