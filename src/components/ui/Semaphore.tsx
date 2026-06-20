import React from 'react'
import type { SemaforoNivel } from '../../types/portfolio'
import { cn } from '../../utils/format'

const config: Record<SemaforoNivel, { dot: string; label: string; text: string }> = {
  excelente: { dot: 'bg-signal-emerald', label: 'Excelente', text: 'text-signal-emeraldDeep dark:text-signal-emerald' },
  aceptable: { dot: 'bg-signal-azure', label: 'Aceptable', text: 'text-signal-azure' },
  revisar: { dot: 'bg-signal-amber', label: 'Revisar', text: 'text-signal-amberDeep dark:text-signal-amber' },
  critico: { dot: 'bg-signal-coral', label: 'Crítico', text: 'text-signal-coralDeep dark:text-signal-coral' },
}

export default function Semaphore({ nivel, showLabel = true, className }: { nivel: SemaforoNivel; showLabel?: boolean; className?: string }) {
  const c = config[nivel]
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('h-2.5 w-2.5 rounded-full', c.dot)} />
      {showLabel && <span className={cn('text-xs font-medium', c.text)}>{c.label}</span>}
    </span>
  )
}
