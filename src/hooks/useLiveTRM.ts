import { useCallback, useEffect, useState } from 'react'

export interface LiveTRMState {
  trm: number
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  isStale: boolean // true si el valor mostrado viene de Local Storage o del dato estático, no de una consulta exitosa
  fechaOficial: string | null // fecha de publicación oficial de la TRM, según la Superintendencia Financiera
  refresh: () => void
}

const ENDPOINT = 'https://co.dolarapi.com/v1/trm'
const STORAGE_KEY = 'trm-live-v1'
const AUTO_REFRESH_MS = 30 * 60 * 1000 // 30 minutos, según lo solicitado

interface TRMCacheada {
  valor: number
  timestamp: string
  fechaOficial?: string
}

function leerCache(): TRMCacheada | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TRMCacheada) : null
  } catch {
    return null
  }
}

function guardarCache(valor: number, fechaOficial?: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ valor, timestamp: new Date().toISOString(), fechaOficial }))
  } catch {
    // Local Storage no disponible (modo privado, cuota llena) — se ignora
  }
}

/**
 * Consulta la TRM oficial (Tasa Representativa del Mercado, COP/USD) en vivo
 * contra la API pública de DolarAPI Colombia. Se ejecuta al montar y luego
 * cada `autoRefreshMs` (30 minutos por defecto). Si la consulta falla, usa el
 * último valor guardado en Local Storage; si nunca hubo uno, usa
 * `trmEstaticoFallback` (la TRM congelada en el dataset del proyecto). En
 * ambos casos de fallback, `isStale` queda en `true` para que la interfaz
 * pueda mostrar la alerta de datos desactualizados.
 */
export function useLiveTRM(trmEstaticoFallback: number, autoRefreshMs: number = AUTO_REFRESH_MS): LiveTRMState {
  const [trm, setTrm] = useState<number>(() => leerCache()?.valor ?? trmEstaticoFallback)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const c = leerCache()
    return c ? new Date(c.timestamp) : null
  })
  const [isStale, setIsStale] = useState(false)
  const [fechaOficial, setFechaOficial] = useState<string | null>(() => leerCache()?.fechaOficial ?? null)

  const fetchTRM = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(ENDPOINT)
      if (!res.ok) throw new Error(`DolarAPI respondió ${res.status}`)
      const json = (await res.json()) as { valor?: number; fechaActualizacion?: string }
      if (typeof json.valor !== 'number') throw new Error('Respuesta de DolarAPI sin el campo "valor"')
      setTrm(json.valor)
      setFechaOficial(json.fechaActualizacion ?? null)
      setLastUpdated(new Date())
      setIsStale(false)
      guardarCache(json.valor, json.fechaActualizacion)
    } catch (e) {
      const cache = leerCache()
      if (cache) {
        setTrm(cache.valor)
        setFechaOficial(cache.fechaOficial ?? null)
        setLastUpdated(new Date(cache.timestamp))
      }
      // si no hay caché, se mantiene el `trmEstaticoFallback` ya cargado como estado inicial
      setIsStale(true)
      setError(e instanceof Error ? e.message : 'No se pudo consultar la TRM en vivo (DolarAPI).')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTRM()
    const interval = window.setInterval(fetchTRM, autoRefreshMs)
    return () => window.clearInterval(interval)
  }, [fetchTRM, autoRefreshMs])

  return { trm, loading, error, lastUpdated, isStale, fechaOficial, refresh: fetchTRM }
}
