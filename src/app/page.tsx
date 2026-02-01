
import Link from 'next/link'
import styles from './page.module.scss'

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logo}>CollabBook</div>
        <nav className={styles.nav}>
          <Link href="/explore" style={{ marginRight: '1.5rem', textDecoration: 'none', color: '#666' }}>
            Explore
          </Link>
          <Link href="/login" className={styles.ctaButton} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Login
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1>
          Write Together.<br />
          Branch Infinite Stories.
        </h1>
        <p>
          The first collaborative book platform where every chapter is a choice. 
          Write the canonical story or branch off into your own universe.
        </p>
        
        <Link href="/login" className={styles.ctaButton}>
          Start Writing
        </Link>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <h3>Branching Narrative</h3>
          <p>Don't like where a story is going? Write your own chapter and branch the story into a new direction.</p>
        </div>
        <div className={styles.feature}>
          <h3>Canonical Path</h3>
          <p>The original author maintains the "canonical" storyline, but the community builds the multiverse.</p>
        </div>
        <div className={styles.feature}>
          <h3>Rich Text Editor</h3>
          <p>Focus on writing with our distraction-free, rich text editor designed for long-form storytelling.</p>
        </div>
      </section>
    </main>
  )
}
