import React, { useMemo } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { cn } from '../utils/format'

export default function Checklist() {
  const { data, checklistState, toggleChecklistItem } = usePortfolio()

  const grupos = useMemo(() => {
    const map = new Map<string, typeof data.checklist>()
    for (const item of data.checklist) {
      if (!map.has(item.grupo)) map.set(item.grupo, [])
      map.get(item.grupo)!.push(item)
    }
    return Array.from(map.entries())
  }, [data.checklist])

  const total = data.checklist.length
  const completados = data.checklist.filter((i) => checklistState[i.id]).length
  const pct = total > 0 ? (completados / total) * 100 : 0

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-ink-700 dark:text-ink-200">Progreso general</p>
          <p className="text-sm tabular text-ink-500 dark:text-ink-400">{completados} / {total} completadas</p>
        </div>
        <ProgressBar value={pct} colorClass="bg-signal-emerald" height="h-2.5" />
      </Card>

      {grupos.map(([grupo, items]) => (
        <Card key={grupo} title={grupo}>
          <div className="space-y-1">
            {items.map((item) => {
              const done = !!checklistState[item.id]
              return (
                <button
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className="w-full flex items-start gap-3 text-left rounded-lg px-3 py-2.5 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors"
                >
                  <span className={cn('mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    done ? 'bg-signal-emerald border-signal-emerald' : 'border-ink-300 dark:border-ink-600')}
                  >
                    {done && <CheckCircleIcon className="h-5 w-5 text-white -m-[2px]" />}
                  </span>
                  <span className={cn('text-sm', done ? 'text-ink-400 line-through' : 'text-ink-700 dark:text-ink-200')}>{item.texto}</span>
                </button>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}
