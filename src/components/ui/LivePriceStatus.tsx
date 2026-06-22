import React from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import type { LivePricesStatus } from '../../context/PortfolioContext'
import { cn } from '../../utils/format'

function tiempoRelativo(fecha: Date | null): string {
  if (!fecha) return 'nunca'
  const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000)
  if (segundos < 60) return 'hace unos segundos'
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  return `hace ${horas} h`
}

export default function LivePriceStatus({ live, compact = false }: { live: LivePricesStatus; compact?: boolean }) {
  if (!live.enabled) return null

  const ok = !live.error && live.liveCount > 0

  return (
    <div className={cn('flex items-center gap-2 text-xs', compact ? '' : 'rounded-lg bg-ink-50 dark:bg-ink-800/60 px-3 py-1.5')}>
      <span className={cn('h-2 w-2 rounded-full shrink-0', live.loading ? 'bg-signal-amber animate-pulse' : ok ? 'bg-signal-emerald' : 'bg-signal-coral')} />
      {live.loading ? (
        <span className="text-ink-400">Actualizando precios cripto…</span>
      ) : live.error ? (
        <span className="text-signal-coralDeep dark:text-signal-coral">Sin conexión a precios en vivo — usando últimos valores guardados</span>
      ) : (
        <span className="text-ink-500 dark:text-ink-400">
          Precios cripto en vivo ({live.liveCount}/{live.totalCryptoCount}) · CoinGecko · actualizado {tiempoRelativo(live.lastUpdated)}
        </span>
      )}
      <button
        onClick={live.refresh}
        disabled={live.loading}
        className="text-ink-400 hover:text-signal-emeraldDeep dark:hover:text-signal-emerald transition-colors disabled:opacity-50"
        title="Actualizar ahora"
      >
        <ArrowPathIcon className={cn('h-3.5 w-3.5', live.loading && 'animate-spin')} />
      </button>
    </div>
  )
}
