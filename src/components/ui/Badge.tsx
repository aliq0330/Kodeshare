import { cn } from '@utils/cn'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'outline'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-raised text-gray-300',
  brand:   'bg-brand-900 text-brand-300',
  success: 'bg-green-900/50 text-green-400',
  warning: 'bg-yellow-900/50 text-yellow-400',
  danger:  'bg-red-900/50 text-red-400',
  outline: 'border border-surface-border text-gray-400',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  )
}
