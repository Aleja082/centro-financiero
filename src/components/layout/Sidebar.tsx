import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Squares2X2Icon,
  ChartBarSquareIcon,
  BanknotesIcon,
  LightBulbIcon,
  BellAlertIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  CalculatorIcon,
  SparklesIcon,
  CircleStackIcon,
  ArrowsRightLeftIcon,
  ScaleIcon,
  SunIcon,
  MoonIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useTheme } from '../../context/ThemeContext'
import { usePortfolio } from '../../context/PortfolioContext'
import HorizonRuler from './HorizonRuler'
import { cn } from '../../utils/format'

const nav = [
  { to: '/', label: 'Dashboard', icon: Squares2X2Icon },
  { to: '/analisis', label: 'Análisis', icon: ChartBarSquareIcon },
  { to: '/activos', label: 'Activos', icon: BanknotesIcon },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowsRightLeftIcon },
  { to: '/rebalanceo', label: 'Rebalanceo', icon: ScaleIcon },
  { to: '/recomendaciones', label: 'Recomendaciones', icon: LightBulbIcon },
  { to: '/alertas', label: 'Alertas', icon: BellAlertIcon },
  { to: '/checklist', label: 'Checklist', icon: CheckCircleIcon },
  { to: '/aportes', label: 'Plan de aportes', icon: CalendarDaysIcon },
  { to: '/simulador', label: 'Simulador', icon: CalculatorIcon },
  { to: '/oportunidades', label: 'Oportunidades', icon: SparklesIcon },
  { to: '/datos', label: 'Datos', icon: CircleStackIcon },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const { data } = usePortfolio()

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 flex flex-col',
          'bg-paper-50 dark:bg-ink-900 border-r border-ink-200/70 dark:border-ink-700/70',
          'transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <p className="font-display text-[15px] font-semibold leading-tight text-ink-900 dark:text-ink-50">Centro Financiero</p>
            <p className="text-[11px] text-ink-400 mt-0.5">Control de inversiones · {data.perfil.monedaBase}</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-ink-400 hover:text-ink-700 dark:hover:text-ink-200">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 scrollbar-none">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-signal-emerald/15 text-signal-emeraldDeep dark:text-signal-emerald'
                    : 'text-ink-500 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-800 dark:hover:text-ink-100',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-200/70 dark:border-ink-700/70">
          <HorizonRuler edadActual={data.perfil.edad} edadRetiro={data.perfil.edadRetiro} />
          <div className="px-4 pb-4">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-ink-200 dark:border-ink-600 px-3 py-2 text-xs font-medium text-ink-500 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
