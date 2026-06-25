import { useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface LiveStockState {
  prices: Record<string, number> // symbol (stooq, lowercase) -> precio en USD
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => void
  apiKeyTwelveData: string
  setApiKeyTwelveData: (k: string) => void
}

const STOOQ_BASE = 'https://stooq.com/q/l/'
const TWELVEDATA_BASE = 'https://api.twelvedata.com/price'
const AUTO_REFRESH_MS = 60 * 60 * 1000 // 1 hora, según lo solicitado

async function fetchStooq(symbols: string[]): Promise<Record<string, number>> {
  if (symbols.length === 0) return {}
  const url = `${STOOQ_BASE}?s=${symbols.join(',')}&f=sd2t2ohlcv&h&e=csv`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Stooq respondió ${res.status}`)
  const text = await res.text()
  const lineas = text.trim().split('\n').slice(1) // primera línea = encabezado
  const out: Record<string, number> = {}
  for (const linea of lineas) {
    const cols = linea.split(',')
    const symbol = cols[0]?.toLowerCase()
    const close = Number(cols[6])
    if (symbol && !isNaN(close) && close > 0) out[symbol] = close
  }
  return out
}

async function fetchTwelveData(symbols: string[], apiKey: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  // El plan gratuito de Twelve Data limita solicitudes — se consultan los
  // símbolos uno por uno para no exceder el formato esperado de la API.
  for (const symbol of symbols) {
    try {
      const res = await fetch(`${TWELVEDATA_BASE}?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`)
      if (!res.ok) continue
      const json = (await res.json()) as { price?: string }
      if (json.price) out[symbol.toLowerCase()] = Number(json.price)
    } catch {
      // se ignora ese símbolo puntual y se sigue con los demás
    }
  }
  return out
}

/**
 * Precio en vivo "best-effort" para acciones/ETFs internacionales (NO
 * cubre BVC Colombia ni fondos colombianos — no existe API gratuita para
 * eso). Intenta primero Stooq (sin clave); si el usuario configuró su
 * propia clave de Twelve Data (guardada solo en su navegador, nunca en el
 * código del proyecto), también la usa como fuente adicional/respaldo.
 */
export function useLiveStockPrices(stooqSymbols: string[], autoRefreshMs: number = AUTO_REFRESH_MS): LiveStockState {
  const [apiKeyTwelveData, setApiKeyTwelveData] = useLocalStorage<string>('twelvedata-api-key-v1', '')
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const symbolsKey = Array.from(new Set(stooqSymbols.filter(Boolean))).sort().join(',')

  const fetchAll = useCallback(async () => {
    if (!symbolsKey) return
    setLoading(true)
    setError(null)
    const symbols = symbolsKey.split(',')
    let resultado: Record<string, number> = {}
    let huboError = false
    try {
      resultado = await fetchStooq(symbols)
    } catch (e) {
      huboError = true
      setError(e instanceof Error ? e.message : 'No se pudo consultar Stooq.')
    }
    if (apiKeyTwelveData) {
      try {
        const desdeTwelve = await fetchTwelveData(symbols, apiKeyTwelveData)
        resultado = { ...resultado, ...desdeTwelve }
      } catch {
        // Twelve Data falló — se mantiene lo que sí haya llegado de Stooq
      }
    }
    setPrices(resultado)
    setLastUpdated(new Date())
    if (!huboError) setError(null)
    setLoading(false)
  }, [symbolsKey, apiKeyTwelveData])

  useEffect(() => {
    fetchAll()
    if (autoRefreshMs > 0 && symbolsKey) {
      const interval = window.setInterval(fetchAll, autoRefreshMs)
      return () => window.clearInterval(interval)
    }
  }, [fetchAll, autoRefreshMs, symbolsKey])

  return { prices, loading, error, lastUpdated, refresh: fetchAll, apiKeyTwelveData, setApiKeyTwelveData }
}
