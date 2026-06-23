import React, { useRef, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import MarketStatusBar from '../components/ui/MarketStatusBar'
import { formatCOP } from '../utils/format'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function DataManager() {
  const { data, staticData, isCustomData, importData, resetData, exportData, livePrices, liveTRM } = usePortfolio()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  function handleExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portafolio-${data.meta.fechaActualizacion}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result))
        const result = importData(json)
        if (result.ok) setMensaje({ tipo: 'ok', texto: 'Datos importados correctamente. El dashboard ya se actualizó.' })
        else setMensaje({ tipo: 'error', texto: result.error ?? 'No se pudo importar el archivo.' })
      } catch {
        setMensaje({ tipo: 'error', texto: 'El archivo no es un JSON válido.' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      <Card title="Estado de los datos">
        <div className="flex items-center gap-3 mb-3">
          <Badge variant={isCustomData ? 'azure' : 'neutral'}>{isCustomData ? 'Datos personalizados (importados)' : 'Dataset original del proyecto'}</Badge>
          <span className="text-xs text-ink-400">
            Snapshot base del {staticData.meta.fechaActualizacion} · TRM congelada en el dataset: {formatCOP(staticData.meta.trm, { decimals: 2 })}
          </span>
        </div>
        {livePrices.enabled && <MarketStatusBar live={livePrices} trm={liveTRM} />}
      </Card>

      <div className="grid sm:grid-cols-2 gap-5">
        <Card title="Exportar" subtitle="Descarga tu información actual como JSON">
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
            Útil para hacer respaldo antes de editar, o para llevar tus datos a otra instalación de esta misma app.
          </p>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg bg-ink-900 dark:bg-signal-emerald text-white dark:text-ink-950 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Descargar JSON
          </button>
        </Card>

        <Card title="Importar" subtitle="Carga un archivo JSON con tu información actualizada">
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
            El archivo debe seguir la misma estructura que <code className="text-xs bg-ink-100 dark:bg-ink-800 px-1 py-0.5 rounded">portfolio.example.json</code>, incluido en{' '}
            <code className="text-xs bg-ink-100 dark:bg-ink-800 px-1 py-0.5 rounded">public/data/</code>.
          </p>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-300 dark:border-ink-600 px-4 py-2 text-sm font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            <ArrowUpTrayIcon className="h-4 w-4" /> Seleccionar archivo
          </button>
        </Card>
      </div>

      {mensaje && (
        <div className={`rounded-lg px-4 py-3 text-sm ${mensaje.tipo === 'ok' ? 'bg-signal-emerald/10 text-signal-emeraldDeep dark:text-signal-emerald' : 'bg-signal-coral/10 text-signal-coralDeep dark:text-signal-coral'}`}>
          {mensaje.texto}
        </div>
      )}

      <Card title="Restablecer" subtitle="Vuelve al dataset original del proyecto, descartando cualquier importación">
        <button
          onClick={() => { resetData(); setMensaje({ tipo: 'ok', texto: 'Datos restablecidos al dataset original del proyecto.' }) }}
          className="inline-flex items-center gap-2 rounded-lg border border-signal-coral/40 text-signal-coralDeep dark:text-signal-coral px-4 py-2 text-sm font-medium hover:bg-signal-coral/10 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" /> Restablecer datos originales
        </button>
      </Card>

      <Card title="Cómo actualizar tus datos periódicamente" subtitle="Sistema de actualización recomendado">
        <ol className="list-decimal list-inside space-y-2 text-sm text-ink-600 dark:text-ink-300">
          <li>Exporta tu JSON actual desde esta misma página como respaldo.</li>
          <li>Edita los valores de <code className="text-xs bg-ink-100 dark:bg-ink-800 px-1 py-0.5 rounded">invertidoCOP</code> / <code className="text-xs bg-ink-100 dark:bg-ink-800 px-1 py-0.5 rounded">actualCOP</code> de cada activo con un editor de texto o pídele a un asistente de IA que lo haga por ti a partir de tus extractos.</li>
          <li>Importa el archivo editado desde la sección "Importar" de arriba.</li>
          <li>Toda la app (dashboard, análisis, alertas, simulador) se recalcula automáticamente — no hay que tocar el código.</li>
        </ol>
      </Card>
    </div>
  )
}
