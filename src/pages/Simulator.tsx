import React, { useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { calcularTotales } from '../utils/portfolioMath'
import { simulate } from '../utils/calculations'
import { formatCOP, formatUSD, formatPercent } from '../utils/format'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import MarketStatusBar from '../components/ui/MarketStatusBar'
import SimulatorChart from '../components/charts/SimulatorChart'

const horizontes = [5, 10, 20, 30] as const
type Horizonte = typeof horizontes[number]

function Slider({ label, value, onChange, min, max, step, format }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-ink-700 dark:text-ink-200">{label}</label>
        <span className="text-sm tabular font-medium text-ink-900 dark:text-ink-50">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-signal-emerald" />
    </div>
  )
}

export default function Simulator() {
  const { data, livePrices, liveTRM } = usePortfolio()
  const totales = calcularTotales(data.assets)
  const trm = liveTRM.trm

  const [aporteMensual, setAporteMensual] = useState(500000)
  const [incrementoAnual, setIncrementoAnual] = useState(data.supuestosSimulador.incrementoAnualDefault)
  const [inflacionAnual, setInflacionAnual] = useState(data.supuestosSimulador.inflacionDefault)
  const [horizonte, setHorizonte] = useState<Horizonte>(10)

  const serieReal = useMemo(() => {
    const base = { aporteMensual, incrementoAnual, inflacionAnual, valorInicial: totales.actual, años: 30 }
    const pesim = simulate({ ...base, tasaAnual: data.supuestosSimulador.pesimista })
    const bas = simulate({ ...base, tasaAnual: data.supuestosSimulador.base })
    const opt = simulate({ ...base, tasaAnual: data.supuestosSimulador.optimista })
    return { pesimista: pesim, base: bas, optimista: opt }
  }, [aporteMensual, incrementoAnual, inflacionAnual, totales.actual, data.supuestosSimulador])

  const serie = useMemo(
    () => serieReal.base.map((p, i) => ({
      año: p.año,
      pesimista: serieReal.pesimista[i].nominal,
      base: p.nominal,
      optimista: serieReal.optimista[i].nominal,
      aportado: p.aportado,
    })),
    [serieReal],
  )

  const idx = horizonte
  const resumen = [
    { label: 'Pesimista', tasa: data.supuestosSimulador.pesimista, nominal: serieReal.pesimista[idx]?.nominal ?? 0, real: serieReal.pesimista[idx]?.real ?? 0, tone: 'amber' as const },
    { label: 'Base', tasa: data.supuestosSimulador.base, nominal: serieReal.base[idx]?.nominal ?? 0, real: serieReal.base[idx]?.real ?? 0, tone: 'azure' as const },
    { label: 'Optimista', tasa: data.supuestosSimulador.optimista, nominal: serieReal.optimista[idx]?.nominal ?? 0, real: serieReal.optimista[idx]?.real ?? 0, tone: 'emerald' as const },
  ]

  const toneClasses = {
    amber: 'border-l-signal-amber text-signal-amberDeep dark:text-signal-amber',
    azure: 'border-l-signal-azure text-signal-azure',
    emerald: 'border-l-signal-emerald text-signal-emeraldDeep dark:text-signal-emerald',
  }

  return (
    <div className="space-y-6">
      {livePrices.enabled && <MarketStatusBar live={livePrices} trm={liveTRM} />}

      <Card title="Supuestos de la simulación">
        <div className="grid sm:grid-cols-2 gap-6">
          <Slider label="Aporte mensual" value={aporteMensual} onChange={setAporteMensual} min={100000} max={3000000} step={50000} format={formatCOP} />
          <Slider label="Incremento anual del aporte" value={incrementoAnual} onChange={setIncrementoAnual} min={0} max={0.2} step={0.01} format={(v) => formatPercent(v * 100)} />
          <Slider label="Inflación anual esperada" value={inflacionAnual} onChange={setInflacionAnual} min={0} max={0.15} step={0.005} format={(v) => formatPercent(v * 100)} />
          <div>
            <p className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Valor inicial del portafolio</p>
            <p className="text-sm tabular font-medium text-ink-900 dark:text-ink-50">{formatCOP(totales.actual)}</p>
            <p className="text-xs text-ink-400 mt-0.5">≈ {formatUSD(totales.actual / trm)} a la TRM en vivo ({formatCOP(trm, { decimals: 2 })})</p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium text-ink-700 dark:text-ink-200">Horizonte de la proyección</p>
        <Tabs value={horizonte} onChange={setHorizonte} options={horizontes.map((h) => ({ value: h, label: `${h} años` }))} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {resumen.map((r) => (
          <Card key={r.label} className={`border-l-[3px] ${toneClasses[r.tone].split(' ')[0]}`}>
            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${toneClasses[r.tone].split(' ').slice(1).join(' ')}`}>{r.label} · {formatPercent(r.tasa * 100)} anual</p>
            <p className="font-display text-xl font-semibold tabular text-ink-900 dark:text-ink-50">{formatCOP(r.nominal)}</p>
            <p className="text-xs text-ink-400 mt-1">≈ {formatUSD(r.nominal / trm)} · real ajustado por inflación: {formatCOP(r.real)}</p>
          </Card>
        ))}
      </div>

      <Card title="Proyección a 30 años" subtitle={`Valores nominales · horizonte seleccionado: ${horizonte} años`}>
        <SimulatorChart data={serie} />
        <p className="text-xs text-ink-400 mt-3">
          La línea punteada gris muestra el total aportado de tu bolsillo (sin rendimiento). La diferencia con las otras curvas es el efecto del interés compuesto.
          Las conversiones a USD usan la TRM en vivo de DolarAPI Colombia. Estas proyecciones son ilustrativas — ninguna rentabilidad está garantizada.
        </p>
      </Card>
    </div>
  )
}
