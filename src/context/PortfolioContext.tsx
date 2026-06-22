import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import type { PortfolioData } from '../types/portfolio'
import defaultData from '../data/portfolioData'
import { useLivePrices } from '../hooks/useLivePrices'
import { aplicarPreciosVivos, recalcularSubScores, recalcularExposiciones, recalcularAlertas, type CoberturaPrecioVivo } from '../utils/liveRecalc'

const STORAGE_KEY = 'portfolio-data-v1'
const ALERT_STATE_KEY = 'portfolio-alert-state-v1'
const CHECKLIST_STATE_KEY = 'portfolio-checklist-state-v1'

export type EstadoAlertaMap = Record<string, 'pendiente' | 'revisada' | 'resuelta'>
export type ChecklistStateMap = Record<string, boolean>

export interface LivePricesStatus {
  enabled: boolean
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => void
  liveCount: number
  totalCryptoCount: number
  cobertura: CoberturaPrecioVivo[]
}

interface PortfolioContextValue {
  data: PortfolioData
  staticData: PortfolioData
  isCustomData: boolean
  importData: (json: unknown) => { ok: boolean; error?: string }
  resetData: () => void
  exportData: () => string
  alertState: EstadoAlertaMap
  setAlertState: (id: string, estado: 'pendiente' | 'revisada' | 'resuelta') => void
  checklistState: ChecklistStateMap
  toggleChecklistItem: (id: string) => void
  livePrices: LivePricesStatus
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined)

function loadStoredData(): PortfolioData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PortfolioData
  } catch {
    return null
  }
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

// Validación mínima — confirma que el JSON importado tiene la forma esperada
// antes de aceptarlo, sin exigir que sea 100% idéntico al esquema (permite
// que el usuario edite/actualice montos sin romper la app).
function isValidPortfolioData(obj: unknown): obj is PortfolioData {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  return Array.isArray(o.assets) && Array.isArray(o.alertas) && Array.isArray(o.checklist) && !!o.perfil
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [rawData, setRawData] = useState<PortfolioData>(() => loadStoredData() ?? defaultData)
  const [isCustomData, setIsCustomData] = useState<boolean>(() => loadStoredData() !== null)

  const [alertState, setAlertStateMap] = useState<EstadoAlertaMap>(() => loadJSON(ALERT_STATE_KEY, {}))
  const [checklistState, setChecklistStateMap] = useState<ChecklistStateMap>(() => loadJSON(CHECKLIST_STATE_KEY, {}))

  // --- Precios en vivo (cripto, vía CoinGecko) ---
  const coingeckoIds = useMemo(
    () => rawData.assets.filter((a) => a.tipo === 'cripto' && a.coingeckoId).map((a) => a.coingeckoId!),
    [rawData.assets],
  )
  const { prices, loading, error, lastUpdated, refresh } = useLivePrices(coingeckoIds)

  const { assets: liveAssets, cobertura } = useMemo(
    () => aplicarPreciosVivos(rawData.assets, prices, rawData.meta.trm),
    [rawData.assets, rawData.meta.trm, prices],
  )

  // El resto de la app (dashboard, análisis, alertas, recomendaciones,
  // simulador) consume `data` sin saber que existen precios en vivo: aquí
  // se inyectan los activos recalculados y se actualizan en cascada los
  // subscores de salud, la exposición temática y las alertas que dependen
  // del % de cripto.
  const data = useMemo<PortfolioData>(() => {
    return {
      ...rawData,
      assets: liveAssets,
      subScoresSalud: recalcularSubScores(rawData.subScoresSalud, liveAssets),
      exposicionesTematicas: recalcularExposiciones(rawData.exposicionesTematicas, liveAssets),
      alertas: recalcularAlertas(rawData.alertas, liveAssets),
    }
  }, [rawData, liveAssets])

  const livePrices: LivePricesStatus = useMemo(
    () => ({
      enabled: coingeckoIds.length > 0,
      loading,
      error,
      lastUpdated,
      refresh,
      liveCount: cobertura.filter((c) => c.enVivo).length,
      totalCryptoCount: rawData.assets.filter((a) => a.tipo === 'cripto').length,
      cobertura,
    }),
    [coingeckoIds.length, loading, error, lastUpdated, refresh, cobertura, rawData.assets],
  )

  const importData = useCallback((json: unknown) => {
    if (!isValidPortfolioData(json)) {
      return { ok: false, error: 'El archivo no tiene la estructura esperada (faltan assets, alertas, checklist o perfil).' }
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(json))
    setRawData(json)
    setIsCustomData(true)
    return { ok: true }
  }, [])

  const resetData = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    setRawData(defaultData)
    setIsCustomData(false)
  }, [])

  // Se exporta el dato crudo (sin la sobreescritura de precios en vivo) para
  // que el respaldo conserve siempre los valores de referencia del usuario.
  const exportData = useCallback(() => JSON.stringify(rawData, null, 2), [rawData])

  const setAlertState = useCallback((id: string, estado: 'pendiente' | 'revisada' | 'resuelta') => {
    setAlertStateMap((prev) => {
      const next = { ...prev, [id]: estado }
      window.localStorage.setItem(ALERT_STATE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const toggleChecklistItem = useCallback((id: string) => {
    setChecklistStateMap((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      window.localStorage.setItem(CHECKLIST_STATE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo<PortfolioContextValue>(
    () => ({
      data,
      staticData: rawData,
      isCustomData,
      importData,
      resetData,
      exportData,
      alertState,
      setAlertState,
      checklistState,
      toggleChecklistItem,
      livePrices,
    }),
    [data, rawData, isCustomData, importData, resetData, exportData, alertState, setAlertState, checklistState, toggleChecklistItem, livePrices],
  )

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio debe usarse dentro de PortfolioProvider')
  return ctx
}
