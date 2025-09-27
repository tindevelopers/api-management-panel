'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  variant?: 'default' | 'dots' | 'pulse' | 'bounce'
}

export function Spinner({ size = 'md', className, variant = 'default' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('animate-pulse bg-current rounded-full', sizeClasses[size], className)}></div>
    )
  }

  if (variant === 'bounce') {
    return (
      <div className={cn('animate-bounce bg-current rounded-full', sizeClasses[size], className)}></div>
    )
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  )
}

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  spinnerProps?: SpinnerProps
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  className, 
  spinnerProps = {} 
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className={cn(
          'absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10',
          className
        )}>
          <Spinner size="lg" {...spinnerProps} />
        </div>
      )}
    </div>
  )
}
