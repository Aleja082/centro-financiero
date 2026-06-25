import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const titles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Resumen ejecutivo de tu portafolio' },
  '/analisis': { title: 'Análisis del portafolio', subtitle: 'Salud, diversificación, riesgo y exposición temática' },
  '/activos': { title: 'Activos', subtitle: 'Detalle individual de cada posición' },
  '/movimientos': { title: 'Movimientos del portafolio', subtitle: 'Registra compras, ventas, aportes, dividendos y más' },
  '/rebalanceo': { title: 'Rebalanceo', subtitle: 'Asignación actual vs. objetivo, recalculada en vivo' },
  '/recomendaciones': { title: 'Centro de recomendaciones', subtitle: 'Qué comprar, mantener, reducir y vender' },
  '/alertas': { title: 'Alertas', subtitle: 'Sistema de alertas inteligentes' },
  '/checklist': { title: 'Checklist', subtitle: 'Tareas accionables de tu plan' },
  '/aportes': { title: 'Plan de aportes', subtitle: 'Escenarios de aporte mensual' },
  '/simulador': { title: 'Simulador financiero', subtitle: 'Proyección a 5, 10, 20 y 30 años' },
  '/oportunidades': { title: 'Centro de oportunidades', subtitle: 'Ideas de inversión por categoría' },
  '/datos': { title: 'Datos', subtitle: 'Importar, exportar y actualizar tu información' },
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const meta = titles[location.pathname] ?? { title: 'Centro Financiero' }

  return (
    <div className="flex min-h-screen bg-paper-50 dark:bg-ink-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar title={meta.title} subtitle={meta.subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
