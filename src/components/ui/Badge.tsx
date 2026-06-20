import React from 'react'
import { cn } from '../../utils/format'

type Variant = 'emerald' | 'amber' | 'coral' | 'azure' | 'neutral' | 'purple'

const styles: Record<Variant, string> = {
  emerald: 'bg-signal-emerald/15 text-signal-emeraldDeep dark:text-signal-emerald',
  amber: 'bg-signal-amber/15 text-signal-amberDeep dark:text-signal-amber',
  coral: 'bg-signal-coral/15 text-signal-coralDeep dark:text-signal-coral',
  azure: 'bg-signal-azure/15 text-signal-azure',
  neutral: 'bg-ink-200/60 dark:bg-ink-700/60 text-ink-600 dark:text-ink-300',
  purple: 'bg-violet-200/50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
}

export default function Badge({ children, variant = 'neutral', className }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap', styles[variant], className)}>
      {children}
    </span>
  )
}
