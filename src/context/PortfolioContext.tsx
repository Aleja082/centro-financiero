import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import type { PortfolioData } from '../types/portfolio'
import type { MovimientoRegistro, NuevoMovimientoInput, UmbralesAlerta } from '../types/movimientos'
import { UMBRALES_DEFAULT } from '../types/movimientos'
import defaultData from '../data/portfolioData'
import { useLivePrices } from '../hooks/useLivePrices'
import { useLiveTRM, type LiveTRMState } from '../hooks/useLiveTRM'
import { useLiveStockPrices, type LiveStockState } from '../hooks/useLiveStockPrices'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { aplicarPreciosVivos, recalcularSubScores, recalcularExposiciones, recalcularAlertas, type CoberturaPrecioVivo } from '../utils/liveRecalc'
import { aplicarMovimientoRegistro } from '../utils/movimientos'
import { generarAlertasDinamicas, type AlertaDinamica } from '../utils/alertEngine'
import { calcularRebalanceo, type FilaRebalanceo } from '../utils/rebalanceEngine'

const STORAGE_KEY = 'portfolio-data-v1'
const ALERT_STATE_KEY = 'portfolio-alert-state-v1'
const CHECKLIST_STATE_KEY = 'portfolio-checklist-state-v1'
const LEDGER_KEY = 'movimientos-ledger-v2'

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
  liveTRM: LiveTRMState
  liveStocks: LiveStockState
  liquidezCOP: number
  registrarMovimiento: (input: NuevoMovimientoInput) => { ok: boolean; mensaje: string }
  actualizarPosicion: (assetId: string, cambios: Partial<{ cantidad: number; invertidoCOP: number; actualCOP: number }>) => void
  ledger: MovimientoRegistro[]
  umbrales: UmbralesAlerta
  setUmbrales: (u: UmbralesAlerta) => void
  alertasDinamicas: AlertaDinamica[]
  rebalanceo: FilaRebalanceo[]
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
  const [ledger, setLedger] = useState<MovimientoRegistro[]>(() => loadJSON(LEDGER_KEY, []))
  const [umbrales, setUmbralesState] = useLocalStorage<UmbralesAlerta>('umbrales-alerta-v1', UMBRALES_DEFAULT)

  // --- TRM en vivo (COP/USD, vía DolarAPI Colombia) ---
  const liveTRM = useLiveTRM(rawData.meta.trm)

  // --- Precios en vivo (cripto, vía CoinGecko) ---
  const coingeckoIds = useMemo(
    () => rawData.assets.filter((a) => a.tipo === 'cripto' && a.coingeckoId).map((a) => a.coingeckoId!),
    [rawData.assets],
  )
  const { prices, loading, error, lastUpdated, refresh } = useLivePrices(coingeckoIds)

  // --- Precios en vivo "best-effort" para acciones internacionales (Stooq / Twelve Data opcional) ---
  const stooqSymbols = useMemo(
    () => rawData.assets.filter((a) => a.tipo === 'accion' && a.stooqSymbol && a.cantidad !== undefined).map((a) => a.stooqSymbol!),
    [rawData.assets],
  )
  const liveStocks = useLiveStockPrices(stooqSymbols)

  const { assets: assetsConCripto, cobertura } = useMemo(
    () => aplicarPreciosVivos(rawData.assets, prices, liveTRM.trm),
    [rawData.assets, liveTRM.trm, prices],
  )

  const liveAssets = useMemo(() => {
    return assetsConCripto.map((a) => {
      if (a.tipo !== 'accion' || !a.stooqSymbol || a.cantidad === undefined) return a
      const precioUsd = liveStocks.prices[a.stooqSymbol.toLowerCase()]
      if (precioUsd === undefined) return a
      return { ...a, actualCOP: Math.round(a.cantidad * precioUsd * liveTRM.trm) }
    })
  }, [assetsConCripto, liveStocks.prices, liveTRM.trm])

  const liquidezCOP = rawData.liquidezCOP ?? 0

  const data = useMemo<PortfolioData>(() => {
    return {
      ...rawData,
      meta: { ...rawData.meta, trm: liveTRM.trm },
      assets: liveAssets,
      subScoresSalud: recalcularSubScores(rawData.subScoresSalud, liveAssets),
      exposicionesTematicas: recalcularExposiciones(rawData.exposicionesTematicas, liveAssets),
      alertas: recalcularAlertas(rawData.alertas, liveAssets),
    }
  }, [rawData, liveAssets, liveTRM.trm])

  const alertasDinamicas = useMemo(
    () => generarAlertasDinamicas(liveAssets, rawData.asignacionObjetivo, umbrales),
    [liveAssets, rawData.asignacionObjetivo, umbrales],
  )

  const rebalanceo = useMemo(
    () => calcularRebalanceo(liveAssets, rawData.asignacionObjetivo, liquidezCOP),
    [liveAssets, rawData.asignacionObjetivo, liquidezCOP],
  )

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

  const registrarMovimiento = useCallback(
    (input: NuevoMovimientoInput) => {
      try {
        const { assets, liquidezDelta, resumen, registro } = aplicarMovimientoRegistro(rawData.assets, input, { trm: liveTRM.trm })
        const nuevoRawData: PortfolioData = { ...rawData, assets, liquidezCOP: (rawData.liquidezCOP ?? 0) + liquidezDelta }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoRawData))
        setRawData(nuevoRawData)
        setIsCustomData(true)
        setLedger((prev) => {
          const next = [registro, ...prev].slice(0, 500)
          window.localStorage.setItem(LEDGER_KEY, JSON.stringify(next))
          return next
        })
        return { ok: true, mensaje: resumen }
      } catch (e) {
        return { ok: false, mensaje: e instanceof Error ? e.message : 'No se pudo registrar el movimiento.' }
      }
    },
    [rawData, liveTRM.trm],
  )

  // Edición directa de una posición (cantidad/invertido/actual) — para
  // corregir datos base (ej. cifras imprecisas del snapshot original) o
  // marcar a mercado activos sin precio en vivo. A diferencia de
  // `registrarMovimiento`, esto REEMPLAZA el valor en vez de sumarle un delta.
  const actualizarPosicion = useCallback(
    (assetId: string, cambios: Partial<{ cantidad: number; invertidoCOP: number; actualCOP: number }>) => {
      const asset = rawData.assets.find((a) => a.id === assetId)
      const assets = rawData.assets.map((a) => (a.id === assetId ? { ...a, ...cambios } : a))
      const nuevoRawData: PortfolioData = { ...rawData, assets }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoRawData))
      setRawData(nuevoRawData)
      setIsCustomData(true)
      if (asset) {
        const partes = Object.entries(cambios).map(([k, v]) => `${k}: ${v}`).join(', ')
        setLedger((prev) => {
          const entry: MovimientoRegistro = {
            id: `mtm-${Date.now()}`,
            fecha: new Date().toISOString().slice(0, 10),
            hora: new Date().toTimeString().slice(0, 5),
            tipo: 'compra',
            assetId,
            nombreActivo: asset.nombre,
            ticker: asset.ticker,
            moneda: 'COP',
            montoTotalCOP: 0,
            comentarios: `Corrección manual de posición (${partes})`,
          }
          const next = [entry, ...prev].slice(0, 500)
          window.localStorage.setItem(LEDGER_KEY, JSON.stringify(next))
          return next
        })
      }
    },
    [rawData],
  )

  const setUmbrales = useCallback((u: UmbralesAlerta) => setUmbralesState(u), [setUmbralesState])

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
      liveTRM,
      liveStocks,
      liquidezCOP,
      registrarMovimiento,
      actualizarPosicion,
      ledger,
      umbrales,
      setUmbrales,
      alertasDinamicas,
      rebalanceo,
    }),
    [
      data,
      rawData,
      isCustomData,
      importData,
      resetData,
      exportData,
      alertState,
      setAlertState,
      checklistState,
      toggleChecklistItem,
      livePrices,
      liveTRM,
      liveStocks,
      liquidezCOP,
      registrarMovimiento,
      actualizarPosicion,
      ledger,
      umbrales,
      setUmbrales,
      alertasDinamicas,
      rebalanceo,
    ],
  )

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio debe usarse dentro de PortfolioProvider')
  return ctx
}
