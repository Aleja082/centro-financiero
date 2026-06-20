import React from 'react'
import type { Recomendacion } from '../../types/portfolio'
import Badge from './Badge'

const config: Record<Recomendacion, { label: string; variant: 'emerald' | 'azure' | 'amber' | 'coral' }> = {
  comprar: { label: '🟢 Comprar', variant: 'emerald' },
  acumular: { label: '🟢 Acumular', variant: 'emerald' },
  mantener: { label: '🟡 Mantener', variant: 'azure' },
  reducir: { label: '🟠 Reducir', variant: 'amber' },
  vender: { label: '🔴 Vender', variant: 'coral' },
}

export default function RecommendationBadge({ value }: { value: Recomendacion }) {
  const c = config[value]
  return <Badge variant={c.variant}>{c.label}</Badge>
}
