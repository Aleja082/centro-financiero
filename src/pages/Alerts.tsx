import React, { useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import type { SeveridadAlerta, EstadoAlerta } from '../types/portfolio'
import type { UmbralesAlerta } from '../types/movimientos'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Tabs from '../components/ui/Tabs'
import MarketStatusBar from '../components/ui/MarketStatusBar'
import { cn } from '../utils/format'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

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
  const { data, alertState, setAlertState, livePrices, liveTRM, alertasDinamicas, umbrales, setUmbrales } = usePortfolio()
  const [filtro, setFiltro] = useState<FiltroEstado>('todas')
  const [configAbierta, setConfigAbierta] = useState(false)

  const alertasConEstado = useMemo(
    () => data.alertas.map((a) => ({ ...a, estado: alertState[a.id] ?? 'pendiente' as EstadoAlerta })),
    [data.alertas, alertState],
  )

  const visibles = filtro === 'todas' ? alertasConEstado : alertasConEstado.filter((a) => a.estado === filtro)
  const conteo = (estado: EstadoAlerta) => alertasConEstado.filter((a) => a.estado === estado).length

  function actualizarUmbral(campo: keyof UmbralesAlerta, valor: number) {
    setUmbrales({ ...umbrales, [campo]: valor })
  }

  return (
    <div className="space-y-6">
      {livePrices.enabled && <MarketStatusBar live={livePrices} trm={liveTRM} />}

      <Card>
        <button onClick={() => setConfigAbierta((v) => !v)} className="w-full flex items-center justify-between text-sm font-medium text-ink-700 dark:text-ink-200">
          Configurar umbrales de alertas automáticas
          <ChevronDownIcon className={cn('h-4 w-4 transition-transform', configAbierta && 'rotate-180')} />
        </button>
        {configAbierta && (
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <UmbralSlider label="Alertar si un activo cae más de" valor={umbrales.caidaPctAlerta} onChange={(v) => actualizarUmbral('caidaPctAlerta', v)} min={5} max={80} unidad="%" />
            <UmbralSlider label="Alertar si un activo sube más de" valor={umbrales.subidaPctAlerta} onChange={(v) => actualizarUmbral('subidaPctAlerta', v)} min={5} max={200} unidad="%" />
            <UmbralSlider label="Alertar si un sector supera" valor={umbrales.sectorMaxPct} onChange={(v) => actualizarUmbral('sectorMaxPct', v)} min={10} max={80} unidad="%" />
            <UmbralSlider label="Alertar si un país supera" valor={umbrales.paisMaxPct} onChange={(v) => actualizarUmbral('paisMaxPct', v)} min={10} max={100} unidad="%" />
          </div>
        )}
      </Card>

      <div>
        <h2 className="font-display text-base font-medium text-ink-900 dark:text-ink-50 mb-1">Alertas automáticas (motor de reglas)</h2>
        <p className="text-xs text-ink-400 mb-3">Se recalculan solas con cada precio en vivo, movimiento o cambio de TRM — según los umbrales configurados arriba.</p>
        <div className="space-y-3">
          {alertasDinamicas.length === 0 && (
            <p className="text-sm text-ink-400 text-center py-4 bg-ink-50 dark:bg-ink-800/40 rounded-lg">Ningún activo o categoría cruza tus umbrales configurados en este momento.</p>
          )}
          {alertasDinamicas.map((a) => {
            const sc = severidadConfig[a.severidad]
            return (
              <Card key={a.id} accent={a.severidad === 'critico' ? 'coral' : a.severidad === 'alto' ? 'amber' : 'azure'}>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant={sc.variant}>{sc.label}</Badge>
                  <span className="text-xs text-ink-400">{a.categoria} · {a.fecha}</span>
                </div>
                <p className="font-medium text-ink-800 dark:text-ink-100 mb-1">{a.titulo}</p>
                <p className="text-sm text-ink-500 dark:text-ink-400 mb-2">{a.descripcion}</p>
                <p className="text-xs text-ink-600 dark:text-ink-300"><strong>Acción sugerida:</strong> {a.accionSugerida}</p>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="font-display text-base font-medium text-ink-900 dark:text-ink-50 mb-1">Alertas curadas (comité de inversiones)</h2>
        <p className="text-xs text-ink-400 mb-3">Análisis cualitativo de fondo — puedes marcarlas como revisadas o resueltas a tu propio ritmo.</p>
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

        <div className="space-y-3 mt-4">
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
    </div>
  )
}

function UmbralSlider({ label, valor, onChange, min, max, unidad }: { label: string; valor: number; onChange: (v: number) => void; min: number; max: number; unidad: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-ink-600 dark:text-ink-300">{label}</label>
        <span className="text-xs font-medium tabular text-ink-900 dark:text-ink-50">{valor}{unidad}</span>
      </div>
      <input type="range" min={min} max={max} value={valor} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-signal-emerald" />
    </div>
  )
}
