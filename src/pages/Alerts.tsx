import React, { useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import type { SeveridadAlerta, EstadoAlerta } from '../types/portfolio'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Tabs from '../components/ui/Tabs'
import LivePriceStatus from '../components/ui/LivePriceStatus'
import { cn } from '../utils/format'

const severidadConfig: Record<SeveridadAlerta, { label: string; variant: 'coral' | 'amber' | 'azure' | 'neutral' }> = {
  critico: { label: 'Crítico', variant: 'coral' },
  alto: { label: 'Alto', variant: 'amber' },
  medio: { label: 'Medio', variant: 'azure' },
  bajo: { label: 'Bajo', variant: 'neutral' },
}

const estadoOptions: { value: EstadoAlerta; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'revisada', label: 'Revisada' },
  { value: 'resuelta', label: 'Resuelta' },
]

type FiltroEstado = 'todas' | EstadoAlerta

export default function Alerts() {
  const { data, alertState, setAlertState, livePrices } = usePortfolio()
  const [filtro, setFiltro] = useState<FiltroEstado>('todas')

  const alertasConEstado = useMemo(
    () => data.alertas.map((a) => ({ ...a, estado: alertState[a.id] ?? 'pendiente' as EstadoAlerta })),
    [data.alertas, alertState],
  )

  const visibles = filtro === 'todas' ? alertasConEstado : alertasConEstado.filter((a) => a.estado === filtro)
  const conteo = (estado: EstadoAlerta) => alertasConEstado.filter((a) => a.estado === estado).length

  return (
    <div className="space-y-5">
      {livePrices.enabled && <LivePriceStatus live={livePrices} />}

      <Tabs
        value={filtro}
        onChange={setFiltro}
        options={[
          { value: 'todas', label: `Todas (${alertasConEstado.length})` },
          { value: 'pendiente', label: `Pendientes (${conteo('pendiente')})` },
          { value: 'revisada', label: `Revisadas (${conteo('revisada')})` },
          { value: 'resuelta', label: `Resueltas (${conteo('resuelta')})` },
        ]}
      />

      <div className="space-y-3">
        {visibles.map((a) => {
          const sc = severidadConfig[a.severidad]
          return (
            <Card key={a.id} accent={a.severidad === 'critico' ? 'coral' : a.severidad === 'alto' ? 'amber' : 'azure'}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                    <span className="text-xs text-ink-400">{a.categoria}</span>
                  </div>
                  <p className="font-medium text-ink-800 dark:text-ink-100 mb-1">{a.titulo}</p>
                  <p className="text-sm text-ink-500 dark:text-ink-400">{a.descripcion}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {estadoOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAlertState(a.id, opt.value)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                        a.estado === opt.value
                          ? 'bg-signal-emerald/15 border-signal-emerald/40 text-signal-emeraldDeep dark:text-signal-emerald'
                          : 'border-ink-200 dark:border-ink-600 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )
        })}
        {visibles.length === 0 && <p className="text-sm text-ink-400 text-center py-8">No hay alertas en este filtro.</p>}
      </div>
    </div>
  )
}
