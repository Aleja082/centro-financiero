import { useCallback, useEffect, useState } from 'react'

export interface LivePricesState {
  prices: Record<string, number> // coingeckoId -> precio en USD
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => void
}

const ENDPOINT = 'https://api.coingecko.com/api/v3/simple/price'
const DEFAULT_REFRESH_MS = 5 * 60 * 1000 // 5 minutos

// Hook que consulta precios cripto en vivo desde la API pública gratuita de
// CoinGecko directamente desde el navegador (sin backend, sin clave de API).
// Si una moneda no se encuentra o la consulta falla (red, límite de tasa,
// etc.), simplemente no aparece en `prices` — quien consuma el hook debe
// usar el valor guardado como respaldo para esos casos.
export function useLivePrices(coingeckoIds: string[], autoRefreshMs: number = DEFAULT_REFRESH_MS): LivePricesState {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const idsKey = Array.from(new Set(coingeckoIds.filter(Boolean))).sort().join(',')

  const fetchPrices = useCallback(async () => {
    if (!idsKey) return
    setLoading(true)
    setError(null)
    try {
      const url = `${ENDPOINT}?ids=${idsKey}&vs_currencies=usd`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`CoinGecko respondió ${res.status}`)
      const json = (await res.json()) as Record<string, { usd?: number }>
      const next: Record<string, number> = {}
      for (const id of idsKey.split(',')) {
        const v = json[id]?.usd
        if (typeof v === 'number') next[id] = v
      }
      setPrices(next)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron consultar los precios en vivo.')
    } finally {
      setLoading(false)
    }
  }, [idsKey])

  useEffect(() => {
    fetchPrices()
    if (autoRefreshMs > 0 && idsKey) {
      const interval = window.setInterval(fetchPrices, autoRefreshMs)
      return () => window.clearInterval(interval)
    }
  }, [fetchPrices, autoRefreshMs, idsKey])

  return { prices, loading, error, lastUpdated, refresh: fetchPrices }
}
