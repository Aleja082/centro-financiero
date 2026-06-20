import React from 'react'
import { cn } from '../../utils/format'

export default function Tabs<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-ink-100 dark:bg-ink-800 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
            value === opt.value
              ? 'bg-white dark:bg-ink-600 text-ink-900 dark:text-ink-50 shadow-sm'
              : 'text-ink-400 hover:text-ink-600 dark:hover:text-ink-200',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
