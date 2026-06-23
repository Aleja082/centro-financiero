import React from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { usePortfolio } from '../../context/PortfolioContext'
import { calcularTotales } from '../../utils/portfolioMath'
import { formatCOP, formatPercent } from '../../utils/format'
import MarketStatusBar from '../ui/MarketStatusBar'

export default function Topbar({ title, subtitle, onMenuClick }: { title: string; subtitle?: string; onMenuClick: () => void }) {
  const { data, livePrices, liveTRM } = usePortfolio()
  const totales = calcularTotales(data.assets)

  return (
    <header className="sticky top-0 z-20 bg-paper-50/90 dark:bg-ink-950/90 backdrop-blur border-b border-ink-200/70 dark:border-ink-700/70">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onMenuClick} className="lg:hidden text-ink-500 dark:text-ink-300 shrink-0">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-semibold text-ink-900 dark:text-ink-50 truncate">{title}</h1>
            {subtitle && <p className="text-xs text-ink-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[11px] text-ink-400">Valor total actual</p>
          <p className="font-display text-sm font-semibold tabular text-ink-900 dark:text-ink-50">{formatCOP(totales.actual)}</p>
          <p className={`text-[11px] tabular ${totales.plPct >= 0 ? 'text-signal-emeraldDeep dark:text-signal-emerald' : 'text-signal-coralDeep dark:text-signal-coral'}`}>
            {formatPercent(totales.plPct)}
          </p>
        </div>
      </div>
      <div className="px-4 sm:px-6 pb-2.5 -mt-1">
        <MarketStatusBar live={livePrices} trm={liveTRM} compact />
      </div>
    </header>
  )
}
