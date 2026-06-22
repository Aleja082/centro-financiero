import React, { useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import type { Asset, Recomendacion } from '../types/portfolio'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Tabs from '../components/ui/Tabs'
import LivePriceStatus from '../components/ui/LivePriceStatus'
import { formatCOP, formatPercent, plPercent } from '../utils/format'
import { señalTacticaSalida } from '../utils/liveRecalc'

const grupos: { value: Recomendacion; titulo: string; accent: 'emerald' | 'azure' | 'amber' | 'coral' }[] = [
  { value: 'acumular', titulo: '🟢 Acumular', accent: 'emerald' },
  { value: 'comprar', titulo: '🟢 Comprar', accent: 'emerald' },
  { value: 'mantener', titulo: '🟡 Mantener', accent: 'azure' },
  { value: 'reducir', titulo: '🟠 Reducir', accent: 'amber' },
  { value: 'vender', titulo: '🔴 Vender', accent: 'coral' },
]

function prioridadDe(asset: Asset): { label: string; variant: 'coral' | 'amber' | 'azure' | 'neutral' } {
  if (asset.recomendacion === 'vender' && asset.actualCOP === 0) return { label: 'Alta — capital muerto', variant: 'coral' }
  if (asset.recomendacion === 'vender') return { label: 'Alta', variant: 'coral' }
  if (asset.recomendacion === 'reducir') return { label: 'Media-alta', variant: 'amber' }
  if (asset.recomendacion === 'acumular' && (asset.convicción === 'Muy alta' || asset.convicción === 'Alta')) return { label: 'Alta', variant: 'azure' }
  return { label: 'Media', variant: 'neutral' }
}

function confianzaDe(asset: Asset): string {
  return asset.convicción === 'N/A' ? 'No aplica (pérdida ya realizada)' : asset.convicción
}

function impactoDe(asset: Asset): string {
  const pl = plPercent(asset.invertidoCOP, asset.actualCOP)
  if (asset.recomendacion === 'vender' && asset.actualCOP === 0) return 'Libera capital psicológico y administrativo; impacto monetario nulo (ya perdido).'
  if (asset.recomendacion === 'vender') return `Libera ${formatCOP(asset.actualCOP)} para redistribuir hacia activos de mayor convicción.`
  if (asset.recomendacion === 'reducir') return `Reduce riesgo idiosincrático manteniendo parte de la posición (P/L actual: ${formatPercent(pl)}).`
  if (asset.recomendacion === 'acumular') return 'Aumenta exposición a un activo con tesis de largo plazo sólida.'
  return 'Mantiene la exposición actual sin cambios de tamaño.'
}

export default function Recommendations() {
  const { data, staticData, livePrices } = usePortfolio()
  const [tab, setTab] = useState<Recomendacion>('vender')

  const staticMap = useMemo(() => new Map(staticData.assets.map((a) => [a.id, a])), [staticData.assets])

  const porGrupo = useMemo(() => {
    const map = new Map<Recomendacion, Asset[]>()
    for (const g of grupos) map.set(g.value, [])
    for (const a of data.assets) map.get(a.recomendacion)?.push(a)
    for (const arr of map.values()) arr.sort((a, b) => b.actualCOP - a.actualCOP)
    return map
  }, [data.assets])

  return (
    <div className="space-y-6">
      {livePrices.enabled && <LivePriceStatus live={livePrices} />}

      <Card title="Acciones generales prioritarias" subtitle="No ligadas a un activo específico">
        <div className="grid sm:grid-cols-2 gap-3">
          <AccionGeneral
            titulo="Construir fondo de emergencia"
            motivo="Fondo de emergencia en $0 con $23.000.000 de deuda activa. Es el riesgo más urgente del plan financiero."
            prioridad="Crítica" impacto="Evita liquidar inversiones en pérdida ante cualquier imprevisto." confianza="Muy alta"
          />
          <AccionGeneral
            titulo="Definir plan de pago acelerado de deuda"
            motivo="Deuda al 1% mensual (≈12,68% E.A.) — retorno garantizado y libre de riesgo al pagarla anticipadamente."
            prioridad="Alta" impacto="Reduce el costo financiero total y libera capacidad de ahorro futura." confianza="Alta"
          />
          <AccionGeneral
            titulo="Aumentar exposición a ETFs globales"
            motivo="Solo 1,2% del portafolio está en ETFs globales — muy por debajo del objetivo de ~53%."
            prioridad="Alta" impacto="Es el cambio individual con mayor impacto esperado en el retorno ajustado al riesgo a 15 años." confianza="Muy alta"
          />
          <AccionGeneral
            titulo="Solicitar benchmark del Fondo Global MPF"
            motivo="Comisión de 1,5% E.A. — alta frente a alternativas pasivas (~0,07% E.A.)."
            prioridad="Media" impacto="Confirma si el fondo justifica su costo o conviene migrar a un ETF pasivo." confianza="Media"
          />
        </div>
      </Card>

      <div>
        <Tabs
          value={tab}
          onChange={setTab}
          options={grupos.map((g) => ({ value: g.value, label: `${g.titulo} (${porGrupo.get(g.value)?.length ?? 0})` }))}
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(porGrupo.get(tab) ?? []).map((a) => {
          const prioridad = prioridadDe(a)
          const señal = señalTacticaSalida(a, staticMap.get(a.id) ?? a)
          return (
            <Card key={a.id} accent={grupos.find((g) => g.value === tab)?.accent} className="flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-medium text-ink-800 dark:text-ink-100">{a.nombre}</p>
                  <p className="text-xs text-ink-400">{a.ticker}</p>
                </div>
                <Badge variant={prioridad.variant}>{prioridad.label}</Badge>
              </div>
              <p className="text-sm text-ink-600 dark:text-ink-300 mb-3">{a.tesis}</p>
              {señal && (
                <div className="mb-3 rounded-lg bg-signal-azure/10 text-signal-azure text-xs px-2.5 py-2">📡 {señal}</div>
              )}
              <div className="mt-auto space-y-1.5 pt-2 border-t border-ink-200/60 dark:border-ink-700/60 text-xs">
                <p className="text-ink-500 dark:text-ink-400"><strong className="text-ink-700 dark:text-ink-200">Impacto esperado:</strong> {impactoDe(a)}</p>
                <p className="text-ink-500 dark:text-ink-400"><strong className="text-ink-700 dark:text-ink-200">Confianza:</strong> {confianzaDe(a)}</p>
              </div>
            </Card>
          )
        })}
        {(porGrupo.get(tab) ?? []).length === 0 && <p className="text-sm text-ink-400 col-span-full text-center py-8">No hay activos en esta categoría.</p>}
      </div>
    </div>
  )
}

function AccionGeneral({ titulo, motivo, prioridad, impacto, confianza }: { titulo: string; motivo: string; prioridad: string; impacto: string; confianza: string }) {
  return (
    <div className="rounded-lg bg-ink-50 dark:bg-ink-800/60 p-3.5">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="font-medium text-sm text-ink-800 dark:text-ink-100">{titulo}</p>
        <Badge variant={prioridad === 'Crítica' ? 'coral' : prioridad === 'Alta' ? 'amber' : 'azure'}>{prioridad}</Badge>
      </div>
      <p className="text-xs text-ink-500 dark:text-ink-400 mb-2">{motivo}</p>
      <p className="text-xs text-ink-400"><strong className="text-ink-600 dark:text-ink-300">Impacto:</strong> {impacto}</p>
      <p className="text-xs text-ink-400"><strong className="text-ink-600 dark:text-ink-300">Confianza:</strong> {confianza}</p>
    </div>
  )
}
