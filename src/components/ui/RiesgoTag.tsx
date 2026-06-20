import React from 'react'
import type { RiesgoNivel, Conviccion } from '../../types/portfolio'
import Badge from './Badge'

const riesgoVariant: Record<RiesgoNivel, 'emerald' | 'azure' | 'amber' | 'coral'> = {
  'Muy bajo': 'emerald',
  Bajo: 'emerald',
  Medio: 'azure',
  'Medio-alto': 'amber',
  Alto: 'amber',
  'Muy alto': 'coral',
  Extremo: 'coral',
}

export function RiesgoTag({ value }: { value: RiesgoNivel }) {
  return <Badge variant={riesgoVariant[value]}>{value}</Badge>
}

const conviccionVariant: Record<Conviccion, 'emerald' | 'azure' | 'amber' | 'coral' | 'neutral'> = {
  'Muy alta': 'emerald',
  Alta: 'emerald',
  'Media-alta': 'emerald',
  Media: 'azure',
  Baja: 'amber',
  'Muy baja': 'coral',
  'N/A': 'neutral',
}

export function ConviccionTag({ value }: { value: Conviccion }) {
  return <Badge variant={conviccionVariant[value]}>{value}</Badge>
}
