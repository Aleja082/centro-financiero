import React from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import MarketStatusBar from '../components/ui/MarketStatusBar'
import { formatCOP } from '../utils/format'

const accionVariant = { comprar: 'emerald', vender: 'coral', mantener: 'neutral' } as const
const accionLabel = { comprar: '🟢 Comprar', vender: '🔴 Vender', mantener: '🟡 Mantener' } as const

export default function Rebalanceo() {
  const { rebalanceo, livePrices, liveTRM, liquidezCOP } = usePortfolio()

  return (
    <div className="space-y-6">
      {livePrices.enabled && <MarketStatusBar live={livePrices} trm={liveTRM} />}

      <Card title="Rebalanceo en vivo" subtitle="Compara tu asignación actual (recalculada con precios y TRM en vivo) contra tu portafolio objetivo">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200/70 dark:border-ink-700/70 text-left">
                <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400 font-medium">Categoría</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400 font-medium text-right">Actual</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400 font-medium text-right">Objetivo</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400 font-medium text-right">Brecha</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400 font-medium">Acción sugerida</th>
              </tr>
            </thead>
            <tbody>
              {rebalanceo.map((f) => (
                <tr key={f.etiqueta} className="border-b border-ink-100 dark:border-ink-800">
                  <td className="px-3 py-2 font-medium text-ink-800 dark:text-ink-100">{f.etiqueta}</td>
                  <td className="px-3 py-2 text-right tabular text-ink-600 dark:text-ink-300">
                    {f.pctActual}% <span className="text-ink-400">({formatCOP(f.valorActualCOP)})</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular text-ink-600 dark:text-ink-300">{f.pctObjetivo}%</td>
                  <td className={`px-3 py-2 text-right tabular font-medium ${f.brechaPct > 0 ? 'text-signal-amberDeep dark:text-signal-amber' : f.brechaPct < 0 ? 'text-signal-azure' : 'text-ink-400'}`}>
                    {f.brechaPct > 0 ? '+' : ''}{f.brechaPct} pp
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={accionVariant[f.accion]}>{accionLabel[f.accion]}</Badge>
                    {f.accion !== 'mantener' && (
                      <span className="text-xs text-ink-400 ml-2 tabular">{formatCOP(Math.abs(f.brechaCOP))}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {liquidezCOP > 0 && (
          <p className="text-xs text-ink-400 mt-3">
            Tienes {formatCOP(liquidezCOP)} en liquidez disponible (aportes/dividendos no invertidos) — prioriza dirigirlos a las categorías marcadas como "Comprar".
          </p>
        )}
        <p className="text-xs text-ink-400 mt-2">
          Esta tabla se recalcula sola con cada precio en vivo, movimiento registrado o cambio de TRM — no necesitas pedirla de nuevo.
        </p>
      </Card>
    </div>
  )
}
