import React from 'react'

// Elemento de firma visual de la app: una regla vertical que representa
// el horizonte de inversión real del usuario (edad actual -> edad de retiro),
// presente de forma discreta en el pie del sidebar. Es el recordatorio
// silencioso de que cada decisión del dashboard se juzga contra 30+ años,
// no contra el precio de hoy.
export default function HorizonRuler({ edadActual, edadRetiro }: { edadActual: number; edadRetiro: number }) {
  const totalAnios = edadRetiro - edadActual
  const marcas = Array.from({ length: totalAnios + 1 }, (_, i) => edadActual + i)
  const marcasVisibles = marcas.filter((a) => a === edadActual || a === edadRetiro || a % 10 === 0)

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-ink-400 font-medium">Horizonte</span>
        <span className="text-[10px] text-ink-300 tabular">{totalAnios} años</span>
      </div>
      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-ink-200 dark:bg-ink-600" />
        {marcasVisibles.map((edad) => {
          const pct = ((edad - edadActual) / totalAnios) * 100
          const esHoy = edad === edadActual
          return (
            <div key={edad} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${pct}%`, top: 0 }}>
              <div className={esHoy ? 'h-2.5 w-2.5 rounded-full bg-signal-emerald ring-2 ring-signal-emerald/30' : 'h-1.5 w-1.5 rounded-full bg-ink-300 dark:bg-ink-500 mt-0.5'} />
              <span className={esHoy ? 'text-[9px] mt-1 text-signal-emeraldDeep dark:text-signal-emerald font-medium' : 'text-[9px] mt-1 text-ink-300'}>
                {edad}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
