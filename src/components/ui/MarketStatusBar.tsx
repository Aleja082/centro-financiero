import React from 'react'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { LivePricesStatus } from '../../context/PortfolioContext'
import type { LiveTRMState } from '../../hooks/useLiveTRM'
import { cn, formatCOP, formatRelativeTime } from '../../utils/format'

export default function MarketStatusBar({
  live,
  trm,
  compact = false,
}: {
  live: LivePricesStatus
  trm: LiveTRMState
  compact?: boolean
}) {
  if (!live.enabled) return null

  const cryptoOk = !live.error && live.liveCount > 0
  const refreshAll = () => {
    live.refresh()
    trm.refresh()
  }

  if (compact) {
    const algoCargando = live.loading || trm.loading
    const algunaAlerta = (live.error && live.liveCount === 0) || trm.isStale
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className={cn('h-2 w-2 rounded-full shrink-0', algoCargando ? 'bg-signal-amber animate-pulse' : algunaAlerta ? 'bg-signal-coral' : 'bg-signal-emerald')} />
        <span className="text-ink-500 dark:text-ink-400 truncate">
          Cripto en vivo ({live.liveCount}/{live.totalCryptoCount}) · TRM {formatCOP(trm.trm, { decimals: 2 })}
          {trm.isStale && <span className="text-signal-amberDeep dark:text-signal-amber"> (desactualizada)</span>}
          {' · '}{formatRelativeTime(trm.lastUpdated)}
        </span>
        <button onClick={refreshAll} disabled={algoCargando} title="Actualizar precios y TRM" className="text-ink-400 hover:text-signal-emeraldDeep dark:hover:text-signal-emerald transition-colors disabled:opacity-50 shrink-0">
          <ArrowPathIcon className={cn('h-3.5 w-3.5', algoCargando && 'animate-spin')} />
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-ink-50 dark:bg-ink-800/60 px-3 py-2.5 space-y-1.5">
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className={cn('h-2 w-2 rounded-full shrink-0', live.loading ? 'bg-signal-amber animate-pulse' : cryptoOk ? 'bg-signal-emerald' : 'bg-signal-coral')} />
        {live.loading ? (
          <span className="text-ink-400">Actualizando precios cripto…</span>
        ) : live.error && live.liveCount === 0 ? (
          <span className="text-signal-coralDeep dark:text-signal-coral">Sin conexión a precios cripto — usando últimos valores guardados</span>
        ) : (
          <span className="text-ink-500 dark:text-ink-400">
            Precios cripto en vivo ({live.liveCount}/{live.totalCryptoCount}) · CoinGecko · actualizado {formatRelativeTime(live.lastUpdated)}
          </span>
        )}
        <button onClick={live.refresh} disabled={live.loading} title="Actualizar precios cripto" className="text-ink-400 hover:text-signal-emeraldDeep dark:hover:text-signal-emerald transition-colors disabled:opacity-50">
          <ArrowPathIcon className={cn('h-3.5 w-3.5', live.loading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className={cn('h-2 w-2 rounded-full shrink-0', trm.loading ? 'bg-signal-amber animate-pulse' : trm.isStale ? 'bg-signal-coral' : 'bg-signal-emerald')} />
        <span className={trm.isStale ? 'text-signal-coralDeep dark:text-signal-coral' : 'text-ink-500 dark:text-ink-400'}>
          TRM en vivo: {formatCOP(trm.trm, { decimals: 2 })} · DolarAPI Colombia · actualizada {formatRelativeTime(trm.lastUpdated)}
        </span>
        <button onClick={trm.refresh} disabled={trm.loading} title="Actualizar TRM" className="text-ink-400 hover:text-signal-emeraldDeep dark:hover:text-signal-emerald transition-colors disabled:opacity-50">
          <ArrowPathIcon className={cn('h-3.5 w-3.5', trm.loading && 'animate-spin')} />
        </button>
      </div>

      {trm.isStale && (
        <div className="flex items-start gap-1.5 text-[11px] text-signal-amberDeep dark:text-signal-amber pt-0.5">
          <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Datos de TRM desactualizados.</strong> No se pudo conectar con DolarAPI Colombia — se está usando el último
            valor guardado en este navegador{trm.fechaOficial ? ` (oficial al ${trm.fechaOficial})` : ''}.
          </span>
        </div>
      )}
    </div>
  )
}
