import React from 'react'
import { cn } from '../../utils/format'

export default function StatCard({
  label,
  value,
  sub,
  tone = 'default',
  icon,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'positive' | 'negative' | 'warning'
  icon?: React.ReactNode
}) {
  const toneClass = {
    default: 'text-ink-900 dark:text-ink-50',
    positive: 'text-signal-emeraldDeep dark:text-signal-emerald',
    negative: 'text-signal-coralDeep dark:text-signal-coral',
    warning: 'text-signal-amberDeep dark:text-signal-amber',
  }[tone]

  return (
    <div className="rounded-xl border border-ink-200/70 dark:border-ink-700/70 bg-white dark:bg-ink-850 shadow-soft p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wide text-ink-400 font-medium">{label}</span>
        {icon}
      </div>
      <div className={cn('font-display text-xl font-semibold tabular', toneClass)}>{value}</div>
      {sub && <div className="text-xs text-ink-400 mt-1">{sub}</div>}
    </div>
  )
}
