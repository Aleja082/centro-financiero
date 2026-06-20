import React from 'react'
import { cn } from '../../utils/format'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  accent?: 'none' | 'emerald' | 'amber' | 'coral' | 'azure'
  action?: React.ReactNode
}

const accentBorder: Record<string, string> = {
  none: '',
  emerald: 'border-l-[3px] border-l-signal-emerald',
  amber: 'border-l-[3px] border-l-signal-amber',
  coral: 'border-l-[3px] border-l-signal-coral',
  azure: 'border-l-[3px] border-l-signal-azure',
}

export default function Card({ children, className, title, subtitle, accent = 'none', action }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-ink-200/70 dark:border-ink-700/70 bg-white dark:bg-ink-850 shadow-soft p-5',
        accentBorder[accent],
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            {title && <h3 className="font-display text-[15px] font-medium text-ink-900 dark:text-ink-100">{title}</h3>}
            {subtitle && <p className="text-xs text-ink-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
