import React, { useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import Card from '../components/ui/Card'
import MarketStatusBar from '../components/ui/MarketStatusBar'
import { formatCOP, formatUSD } from '../utils/format'
import { calcularPlanPersonalizado } from '../utils/calculations'

export default function Contributions() {
  const { data, livePrices, liveTRM } = usePortfolio()
  const [montoPersonalizado, setMontoPersonalizado] = useState(750000)
  const trm = liveTRM.trm

  const plantilla = data.planesAporte[0].asignaciones.map((a) => ({ id: a.activoId, nombre: a.nombre, porcentaje: a.porcentaje }))
  const personalizado = calcularPlanPersonalizado(montoPersonalizado, plantilla)

  return (
    <div className="space-y-6">
      {livePrices.enabled && <MarketStatusBar live={livePrices} trm={liveTRM} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {data.planesAporte.map((plan) => (
          <Card key={plan.montoMensual} title={`${formatCOP(plan.montoMensual)} / mes`} subtitle={`≈ ${formatUSD(plan.montoMensual / trm)} a la TRM en vivo`}>
            <div className="space-y-2.5">
              {plan.asignaciones.map((a) => {
                const valor = Math.round((plan.montoMensual * a.porcentaje) / 100)
                return (
                  <div key={a.activoId} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="text-ink-700 dark:text-ink-200 font-medium truncate">{a.nombre}</p>
                      <p className="text-[11px] text-ink-400 truncate">{a.vehiculoSugerido}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="tabular font-medium text-ink-800 dark:text-ink-100">{formatCOP(valor)}</p>
                      <p className="text-[11px] text-ink-400 tabular">{a.porcentaje}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-ink-400 mt-4 pt-3 border-t border-ink-200/60 dark:border-ink-700/60">{plan.notaComisiones}</p>
          </Card>
        ))}
      </div>

      <Card title="Calculadora de aporte personalizado" subtitle="Usa la misma distribución objetivo para cualquier monto mensual">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="monto" className="text-sm font-medium text-ink-700 dark:text-ink-200">Monto mensual</label>
            <div className="text-right">
              <span className="font-display text-lg font-semibold tabular text-ink-900 dark:text-ink-50 block">{formatCOP(montoPersonalizado)}</span>
              <span className="text-[11px] text-ink-400">≈ {formatUSD(montoPersonalizado / trm)}</span>
            </div>
          </div>
          <input
            id="monto"
            type="range"
            min={100000}
            max={3000000}
            step={50000}
            value={montoPersonalizado}
            onChange={(e) => setMontoPersonalizado(Number(e.target.value))}
            className="w-full accent-signal-emerald"
          />
          <div className="flex justify-between text-[11px] text-ink-400 mt-1">
            <span>{formatCOP(100000)}</span>
            <span>{formatCOP(3000000)}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {personalizado.map((p) => (
            <div key={p.id} className="rounded-lg bg-ink-50 dark:bg-ink-800/60 p-3">
              <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{p.nombre}</p>
              <p className="font-display text-base font-semibold tabular text-ink-900 dark:text-ink-50 mt-1">{formatCOP(p.valorExacto)}</p>
              <p className="text-xs text-ink-400">{p.porcentaje}% del aporte · ≈ {formatUSD(p.valorExacto / trm)}</p>
            </div>
          ))}
        </div>
        {montoPersonalizado < 500000 && (
          <p className="text-xs text-signal-amberDeep dark:text-signal-amber mt-4">
            Para montos menores a $500.000, canaliza la porción de ETF a través de fondos colectivos sin comisión de suscripción (500 ACCIONES US, DONAMICO) en vez de comprar un ETF individual en TRII.
          </p>
        )}
      </Card>
    </div>
  )
}
