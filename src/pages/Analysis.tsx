import React from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { healthScore, healthLabel } from '../utils/calculations'
import Card from '../components/ui/Card'
import Gauge from '../components/ui/Gauge'
import ProgressBar from '../components/ui/ProgressBar'
import Semaphore from '../components/ui/Semaphore'
import ExposureBars from '../components/charts/ExposureBars'
import type { SemaforoNivel } from '../types/portfolio'

const subscoreColor: Record<string, string> = {
  diversificacion: 'bg-signal-azure',
  riesgo: 'bg-signal-coral',
  potencial: 'bg-signal-emerald',
  liquidez: 'bg-signal-coral',
  deuda: 'bg-signal-amber',
}

function nivelDeValor(v: number): SemaforoNivel {
  if (v >= 75) return 'excelente'
  if (v >= 55) return 'aceptable'
  if (v >= 35) return 'revisar'
  return 'critico'
}

export default function Analysis() {
  const { data } = usePortfolio()
  const score = healthScore(data.subScoresSalud)
  const { label } = healthLabel(score)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center py-8">
          <Gauge value={score} label={label} sublabel="Salud general" size={180} />
        </Card>

        <Card title="Desglose de la salud del portafolio" subtitle="Cada componente pondera distinto en el puntaje final" className="lg:col-span-2">
          <div className="space-y-4">
            {data.subScoresSalud.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink-700 dark:text-ink-200">{s.etiqueta}</span>
                  <div className="flex items-center gap-2">
                    <Semaphore nivel={nivelDeValor(s.valor)} showLabel={false} />
                    <span className="text-sm tabular font-medium text-ink-600 dark:text-ink-300">{s.valor}/100</span>
                  </div>
                </div>
                <ProgressBar value={s.valor} colorClass={subscoreColor[s.id] ?? 'bg-signal-azure'} />
                <p className="text-xs text-ink-400 mt-1">{s.descripcion}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Exposición temática" subtitle="Porcentaje del portafolio expuesto a cada gran tema">
        <ExposureBars data={data.exposicionesTematicas} height={240} />
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {data.exposicionesTematicas.map((e) => (
            <div key={e.id} className="rounded-lg bg-ink-50 dark:bg-ink-800/60 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-ink-800 dark:text-ink-100">{e.etiqueta}</span>
                <Semaphore nivel={e.nivel} />
              </div>
              <p className="text-xs text-ink-400">{e.descripcion}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
