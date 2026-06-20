import React, { useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import type { CategoriaOportunidad } from '../types/portfolio'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import { RiesgoTag, ConviccionTag } from '../components/ui/RiesgoTag'

const categorias: CategoriaOportunidad[] = ['ETF', 'Acciones', 'Inteligencia Artificial', 'Salud', 'Energía', 'Infraestructura', 'Mercados Emergentes', 'Criptomonedas']

export default function Opportunities() {
  const { data } = usePortfolio()
  const [categoria, setCategoria] = useState<CategoriaOportunidad | 'todas'>('todas')

  const filtradas = useMemo(
    () => (categoria === 'todas' ? data.oportunidades : data.oportunidades.filter((o) => o.categoria === categoria)),
    [data.oportunidades, categoria],
  )

  const disponibles = categorias.filter((c) => data.oportunidades.some((o) => o.categoria === c))

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto pb-1">
        <Tabs
          value={categoria}
          onChange={setCategoria}
          options={[{ value: 'todas', label: `Todas (${data.oportunidades.length})` }, ...disponibles.map((c) => ({ value: c, label: c }))]}
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtradas.map((o) => (
          <Card key={o.id}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-medium text-ink-800 dark:text-ink-100">{o.nombre}</p>
                <p className="text-xs text-ink-400">{o.categoria}</p>
              </div>
              <ConviccionTag value={o.conviccion} />
            </div>
            <p className="text-sm text-ink-600 dark:text-ink-300 mb-3">{o.tesis}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-ink-200/60 dark:border-ink-700/60">
              <RiesgoTag value={o.riesgo} />
              <span className="text-ink-400">Horizonte: <strong className="text-ink-600 dark:text-ink-300">{o.horizonte}</strong></span>
            </div>
            <p className="text-xs text-ink-400 mt-1.5">Potencial estimado: <span className="text-ink-600 dark:text-ink-300">{o.potencialEstimado}</span></p>
          </Card>
        ))}
        {filtradas.length === 0 && <p className="text-sm text-ink-400 col-span-full text-center py-8">No hay oportunidades registradas en esta categoría.</p>}
      </div>

      <p className="text-xs text-ink-400 text-center pt-2">
        Esto no es una recomendación de inversión personalizada ni garantía de rentabilidad — son categorías e hipótesis a evaluar según tu propio criterio.
      </p>
    </div>
  )
}
