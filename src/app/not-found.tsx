import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
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
      <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>404</h2>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 500 }}>Page Not Found</h3>
      <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '400px' }}>
        The story you are looking for doesn't exist... yet. Or maybe it's in another branch of the multiverse.
      </p>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  )
}
