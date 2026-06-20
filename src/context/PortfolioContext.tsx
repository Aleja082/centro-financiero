import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import type { PortfolioData } from '../types/portfolio'
import defaultData from '../data/portfolioData'

const STORAGE_KEY = 'portfolio-data-v1'
const ALERT_STATE_KEY = 'portfolio-alert-state-v1'
const CHECKLIST_STATE_KEY = 'portfolio-checklist-state-v1'

export type EstadoAlertaMap = Record<string, 'pendiente' | 'revisada' | 'resuelta'>
export type ChecklistStateMap = Record<string, boolean>

interface PortfolioContextValue {
  data: PortfolioData
  isCustomData: boolean
  importData: (json: unknown) => { ok: boolean; error?: string }
  resetData: () => void
  exportData: () => string
  alertState: EstadoAlertaMap
  setAlertState: (id: string, estado: 'pendiente' | 'revisada' | 'resuelta') => void
  checklistState: ChecklistStateMap
  toggleChecklistItem: (id: string) => void
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
  const [data, setData] = useState<PortfolioData>(() => loadStoredData() ?? defaultData)
  const [isCustomData, setIsCustomData] = useState<boolean>(() => loadStoredData() !== null)

  const [alertState, setAlertStateMap] = useState<EstadoAlertaMap>(() => loadJSON(ALERT_STATE_KEY, {}))
  const [checklistState, setChecklistStateMap] = useState<ChecklistStateMap>(() => loadJSON(CHECKLIST_STATE_KEY, {}))

  const importData = useCallback((json: unknown) => {
    if (!isValidPortfolioData(json)) {
      return { ok: false, error: 'El archivo no tiene la estructura esperada (faltan assets, alertas, checklist o perfil).' }
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(json))
    setData(json)
    setIsCustomData(true)
    return { ok: true }
  }, [])

  const resetData = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    setData(defaultData)
    setIsCustomData(false)
  }, [])

  const exportData = useCallback(() => JSON.stringify(data, null, 2), [data])

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
    () => ({ data, isCustomData, importData, resetData, exportData, alertState, setAlertState, checklistState, toggleChecklistItem }),
    [data, isCustomData, importData, resetData, exportData, alertState, setAlertState, checklistState, toggleChecklistItem],
  )

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio debe usarse dentro de PortfolioProvider')
  return ctx
}
