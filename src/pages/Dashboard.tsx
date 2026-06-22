import React from 'react'
import { Link } from 'react-router-dom'
import { usePortfolio } from '../context/PortfolioContext'
import { calcularTotales, agruparPor } from '../utils/portfolioMath'
import { formatCOP, formatUSD, formatPercent } from '../utils/format'
import { healthScore, healthLabel } from '../utils/calculations'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Gauge from '../components/ui/Gauge'
import AllocationDonut from '../components/charts/AllocationDonut'
import ComparisonBars from '../components/charts/ComparisonBars'
import Badge from '../components/ui/Badge'
import LivePriceStatus from '../components/ui/LivePriceStatus'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

const severidadVariant = { critico: 'coral', alto: 'amber', medio: 'azure', bajo: 'neutral' } as const

export default function Dashboard() {
  const { data, livePrices } = usePortfolio()
  const { assets, perfil, meta, alertas, asignacionObjetivo } = data
  const totales = calcularTotales(assets)
  const score = healthScore(data.subScoresSalud)
  const { label } = healthLabel(score)
  const valorUSD = totales.actual / meta.trm

  const porTipo = agruparPor(assets, (a) => (a.tipo === 'cripto' ? 'Criptomonedas' : a.tipo === 'accion' ? 'Acciones' : 'Fondos'))
  const porPais = agruparPor(assets, (a) => a.pais)
  const porMoneda = agruparPor(assets, (a) => a.monedaExposicion)

  const actualPorEtiqueta = new Map(porTipo.map((g) => [g.etiqueta, g.porcentaje]))
  const comparacion = [
    { etiqueta: 'ETFs/Fondos', actual: Math.round(((actualPorEtiqueta.get('Fondos') ?? 0))), objetivo: asignacionObjetivo.find((o) => o.etiqueta.includes('ETF'))?.porcentajeObjetivo ?? 0 },
    { etiqueta: 'Cripto', actual: Math.round(actualPorEtiqueta.get('Criptomonedas') ?? 0), objetivo: (asignacionObjetivo.find((o) => o.etiqueta === 'Bitcoin')?.porcentajeObjetivo ?? 0) + (asignacionObjetivo.find((o) => o.etiqueta === 'Ethereum')?.porcentajeObjetivo ?? 0) + 3 },
    { etiqueta: 'Acciones Col.', actual: Math.round(actualPorEtiqueta.get('Acciones') ?? 0), objetivo: asignacionObjetivo.find((o) => o.etiqueta.includes('colombianas'))?.porcentajeObjetivo ?? 0 },
  ]

  const topAlertas = alertas.slice(0, 3)

  return (
    <div className="space-y-6">
      {livePrices.enabled && <LivePriceStatus live={livePrices} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Valor actual" value={formatCOP(totales.actual)} sub={`Invertido: ${formatCOP(totales.invertido)}`} />
        <StatCard
          label="Rentabilidad total"
          value={formatPercent(totales.plPct)}
          sub={formatCOP(totales.pl)}
          tone={totales.plPct >= 0 ? 'positive' : 'negative'}
        />
        <StatCard label="Valor en USD" value={formatUSD(valorUSD)} sub={`TRM ${formatCOP(meta.trm)}`} />
        <StatCard label="Salud del portafolio" value={`${score}/100`} sub={label} tone={score >= 55 ? 'positive' : score >= 35 ? 'warning' : 'negative'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Distribución por tipo de activo" className="lg:col-span-1">
          <AllocationDonut data={porTipo} />
        </Card>
        <Card title="Distribución por país" className="lg:col-span-1">
          <AllocationDonut data={porPais} />
        </Card>
        <Card title="Distribución por moneda de exposición" className="lg:col-span-1">
          <AllocationDonut data={porMoneda} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Composición actual vs. objetivo" subtitle="Por gran categoría de activo" className="lg:col-span-2">
          <ComparisonBars data={comparacion} />
        </Card>

        <Card title="Salud del portafolio" className="lg:col-span-1 flex flex-col items-center justify-center">
          <Gauge value={score} label={label} sublabel="0 — 100" />
          <Link to="/analisis" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-signal-azure hover:underline">
            Ver desglose completo <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Card>
      </div>

      <Card
        title="Alertas prioritarias"
        subtitle={`${alertas.length} alertas activas en total`}
        action={
          <Link to="/alertas" className="text-sm font-medium text-signal-azure hover:underline flex items-center gap-1">
            Ver todas <ArrowRightIcon className="h-4 w-4" />
          </Link>
        }
      >
        <div className="space-y-3">
          {topAlertas.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-4 rounded-lg bg-ink-50 dark:bg-ink-800/60 p-3">
              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{a.titulo}</p>
                <p className="text-xs text-ink-400 mt-0.5">{a.categoria}</p>
              </div>
              <Badge variant={severidadVariant[a.severidad]}>{a.severidad}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-ink-400 text-center pt-2">
        Datos actualizados al {new Date(meta.fechaActualizacion).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })} ·
        Perfil: {perfil.toleranciaRiesgo} · Horizonte: {perfil.horizonteInversion}
      </p>
    </div>
  )
}
