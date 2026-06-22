import React, { useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import type { Asset, AssetType } from '../types/portfolio'
import { formatCOP, plPercent, formatPercent, cn } from '../utils/format'
import { señalTacticaSalida } from '../utils/liveRecalc'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import RecommendationBadge from '../components/ui/RecommendationBadge'
import { RiesgoTag, ConviccionTag } from '../components/ui/RiesgoTag'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

type FiltroTipo = 'todos' | AssetType

const tipoLabel: Record<AssetType, string> = { cripto: 'Cripto', accion: 'Acción', fondo: 'Fondo' }

export default function Assets() {
  const { data, staticData, livePrices } = usePortfolio()
  const [filtro, setFiltro] = useState<FiltroTipo>('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const coberturaMap = useMemo(
    () => new Map(livePrices.cobertura.map((c) => [c.assetId, c])),
    [livePrices.cobertura],
  )
  const staticMap = useMemo(() => new Map(staticData.assets.map((a) => [a.id, a])), [staticData.assets])

  const assets = useMemo(() => {
    const base = filtro === 'todos' ? data.assets : data.assets.filter((a) => a.tipo === filtro)
    return [...base].sort((a, b) => b.actualCOP - a.actualCOP)
  }, [data.assets, filtro])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: 'todos', label: `Todos (${data.assets.length})` },
            { value: 'cripto', label: `Cripto (${data.assets.filter((a) => a.tipo === 'cripto').length})` },
            { value: 'accion', label: `Acciones (${data.assets.filter((a) => a.tipo === 'accion').length})` },
            { value: 'fondo', label: `Fondos (${data.assets.filter((a) => a.tipo === 'fondo').length})` },
          ]}
        />
      </div>

      {livePrices.enabled && (
        <p className="text-xs text-ink-400 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-emerald" /> en vivo (CoinGecko)
          <span className="mx-1">·</span>
          <span className="h-1.5 w-1.5 rounded-full bg-ink-300 dark:bg-ink-600" /> valor guardado (sin fuente en vivo disponible)
        </p>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200/70 dark:border-ink-700/70 text-left">
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-ink-400 font-medium">Activo</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-ink-400 font-medium text-right">Invertido</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-ink-400 font-medium text-right">Actual</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-ink-400 font-medium text-right">P/L</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-ink-400 font-medium hidden md:table-cell">Convicción</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-ink-400 font-medium hidden md:table-cell">Riesgo</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-ink-400 font-medium">Recomendación</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => {
                const pl = plPercent(a.invertidoCOP, a.actualCOP)
                const expanded = expandedId === a.id
                const cobertura = coberturaMap.get(a.id)
                return (
                  <React.Fragment key={a.id}>
                    <tr
                      className="border-b border-ink-100 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-800/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedId(expanded ? null : a.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-800 dark:text-ink-100">{a.nombre}</div>
                        <div className="text-xs text-ink-400">{a.ticker} · {tipoLabel[a.tipo]}</div>
                      </td>
                      <td className="px-4 py-3 text-right tabular text-ink-600 dark:text-ink-300">{formatCOP(a.invertidoCOP)}</td>
                      <td className="px-4 py-3 text-right tabular font-medium text-ink-800 dark:text-ink-100">
                        <span className="inline-flex items-center gap-1.5">
                          {a.tipo === 'cripto' && (
                            <span
                              className={cn('h-1.5 w-1.5 rounded-full', cobertura?.enVivo ? 'bg-signal-emerald' : 'bg-ink-300 dark:bg-ink-600')}
                              title={cobertura?.enVivo ? 'Precio en vivo' : 'Valor guardado'}
                            />
                          )}
                          {formatCOP(a.actualCOP)}
                        </span>
                      </td>
                      <td className={cn('px-4 py-3 text-right tabular font-medium', pl >= 0 ? 'text-signal-emeraldDeep dark:text-signal-emerald' : 'text-signal-coralDeep dark:text-signal-coral')}>
                        {formatPercent(pl)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><ConviccionTag value={a.convicción} /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><RiesgoTag value={a.riesgo} /></td>
                      <td className="px-4 py-3"><RecommendationBadge value={a.recomendacion} /></td>
                      <td className="px-4 py-3">
                        <ChevronDownIcon className={cn('h-4 w-4 text-ink-400 transition-transform', expanded && 'rotate-180')} />
                      </td>
                    </tr>
                    {expanded && <AssetDetailRow asset={a} señalTactica={señalTacticaSalida(a, staticMap.get(a.id) ?? a)} />}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function AssetDetailRow({ asset, señalTactica }: { asset: Asset; señalTactica: string | null }) {
  return (
    <tr className="bg-ink-50/70 dark:bg-ink-800/40 border-b border-ink-100 dark:border-ink-800">
      <td colSpan={8} className="px-4 py-4">
        {señalTactica && (
          <div className="mb-3 rounded-lg bg-signal-azure/10 text-signal-azure text-sm px-3 py-2">
            📡 <strong>Señal en vivo:</strong> {señalTactica}
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <p className="text-[11px] uppercase tracking-wide text-ink-400 font-medium mb-1">Tesis de inversión</p>
            <p className="text-sm text-ink-700 dark:text-ink-200">{asset.tesis}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink-400 font-medium mt-3 mb-1">Función en el portafolio</p>
            <p className="text-sm text-ink-600 dark:text-ink-300">{asset.funcion}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-400 font-medium mb-1">Ventajas</p>
            {asset.ventajas.length > 0 ? (
              <ul className="space-y-1">
                {asset.ventajas.map((v, i) => (
                  <li key={i} className="text-sm text-ink-600 dark:text-ink-300 flex gap-1.5">
                    <span className="text-signal-emerald">＋</span>{v}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-400">Sin ventajas relevantes a destacar.</p>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-400 font-medium mb-1">Riesgos</p>
            <ul className="space-y-1">
              {asset.riesgos.map((v, i) => (
                <li key={i} className="text-sm text-ink-600 dark:text-ink-300 flex gap-1.5">
                  <span className="text-signal-coral">－</span>{v}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-ink-200/60 dark:border-ink-700/60 text-xs text-ink-400">
          <span>Sector: <strong className="text-ink-600 dark:text-ink-300">{asset.sector}</strong></span>
          <span>País: <strong className="text-ink-600 dark:text-ink-300">{asset.pais}</strong></span>
          <span>Moneda de exposición: <strong className="text-ink-600 dark:text-ink-300">{asset.monedaExposicion}</strong></span>
          <span>Horizonte recomendado: <strong className="text-ink-600 dark:text-ink-300">{asset.horizonte}</strong></span>
          {asset.cantidad !== undefined && <span>Cantidad aprox.: <strong className="text-ink-600 dark:text-ink-300 tabular">{asset.cantidad}</strong></span>}
        </div>
      </td>
    </tr>
  )
}
