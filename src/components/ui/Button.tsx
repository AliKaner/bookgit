
import React from 'react'
import Link from 'next/link'
import styles from './button.module.scss'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  fullWidth?: boolean
  href?: string
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  href, 
  isLoading,
  className = '',
  disabled,
  ...props 
}) => {
  const rootClassName = `
    ${styles.button} 
    ${styles[variant]} 
    ${fullWidth ? styles.fullWidth : ''} 
    ${className}
  `

  if (href) {
    return (
      <Link href={href} className={rootClassName}>
        {isLoading ? 'Loading...' : children}
      </Link>
    )
  }

  return (
    <button 
      className={rootClassName} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
}
