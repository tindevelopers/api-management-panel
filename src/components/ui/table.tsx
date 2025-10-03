'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
  className?: string
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode
  className?: string
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode
  className?: string
}

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode
  className?: string
  isHeader?: boolean
}

export function Table({ children, className, ...props }: TableProps) {
  return (
    <table className={cn('w-full', className)} {...props}>
      {children}
    </table>
  )
}

export function TableHeader({ children, className, ...props }: TableHeaderProps) {
  return (
    <thead className={cn('', className)} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className, ...props }: TableBodyProps) {
  return (
    <tbody className={cn('', className)} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className, ...props }: TableRowProps) {
  return (
    <tr className={cn('', className)} {...props}>
      {children}
    </tr>
  )
}

export function TableCell({ children, className, isHeader = false, ...props }: TableCellProps) {
  const Component = isHeader ? 'th' : 'td'
  
  return (
    <Component
      className={cn(
        'px-4 py-3 text-sm',
        isHeader && 'font-medium text-gray-700 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
