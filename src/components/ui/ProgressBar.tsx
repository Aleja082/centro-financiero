import React from 'react'
import { cn } from '../../utils/format'

export default function ProgressBar({
  value,
  max = 100,
  colorClass = 'bg-signal-azure',
  trackClass = 'bg-ink-100 dark:bg-ink-700',
  height = 'h-2',
  className,
}: {
  value: number
  max?: number
  colorClass?: string
  trackClass?: string
  height?: string
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={cn('w-full rounded-full overflow-hidden', height, trackClass, className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', colorClass)} style={{ width: `${pct}%` }} />
    </div>
  )
}
