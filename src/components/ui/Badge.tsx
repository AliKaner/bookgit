
import React from 'react'
import Link from 'next/link'
import styles from './badge.module.scss'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'secondary' | 'accent'
  href?: string
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  href,
  className = ''
}) => {
  const rootClassName = `
    ${styles.badge} 
    ${styles[variant]} 
    ${className}
  `

  if (href) {
    return (
      <Link href={href} className={rootClassName}>
        {children}
      </Link>
    )
  }

  return (
    <span className={rootClassName}>
      {children}
    </span>
  )
}
