import React, { useMemo, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import type { AssetType } from '../types/portfolio'
import type { TipoMovimiento, NuevoMovimientoInput } from '../types/movimientos'
import { interpretarMovimiento } from '../utils/nlParser'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import Badge from '../components/ui/Badge'
import { formatCOP, formatPercent, plPercent } from '../utils/format'

const TIPOS: { value: TipoMovimiento; label: string }[] = [
  { value: 'compra', label: 'Compra' },
  { value: 'venta', label: 'Venta' },
  { value: 'aporte', label: 'Aporte' },
  { value: 'retiro', label: 'Retiro' },
  { value: 'dividendo', label: 'Dividendo' },
  { value: 'staking', label: 'Staking' },
  { value: 'split', label: 'Split' },
  { value: 'fusion', label: 'Fusión' },
  { value: 'conversion', label: 'Conversión' },
]

const requiereActivo: Record<TipoMovimiento, boolean> = {
  compra: false, // puede ser activo nuevo
  venta: true,
  aporte: false,
  retiro: false,
  dividendo: true,
  staking: true,
  split: true,
  fusion: true,
  conversion: true,
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700 dark:text-ink-200 block mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-400 mt-1">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-ink-200 dark:border-ink-600 bg-white dark:bg-ink-800 px-3 py-2 text-sm text-ink-900 dark:text-ink-50 tabular focus:outline-none focus:ring-2 focus:ring-signal-emerald/40'

export default function Movimientos() {
  const { staticData, registrarMovimiento, ledger } = usePortfolio()

  return (
    <div className="space-y-6">
      <AsistenteLenguajeNatural />
      <FormularioMovimiento />
      <ActualizarValoresMercado />
      <Historial />
    </div>
  )
}

function AsistenteLenguajeNatural() {
  const { staticData, registrarMovimiento } = usePortfolio()
  const [texto, setTexto] = useState('')
  const [interpretacion, setInterpretacion] = useState<ReturnType<typeof interpretarMovimiento> | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  function analizar() {
    setMensaje(null)
    setInterpretacion(interpretarMovimiento(texto, staticData.assets))
  }

  function confirmar() {
    if (!interpretacion?.input) return
    const r = registrarMovimiento(interpretacion.input)
    setMensaje({ tipo: r.ok ? 'ok' : 'error', texto: r.mensaje })
    if (r.ok) {
      setTexto('')
      setInterpretacion(null)
    }
  }

  return (
    <Card title="Analizar Nuevo Movimiento" subtitle="Describe la operación en una frase — funciona mejor con frases cercanas a estos ejemplos">
      <div className="space-y-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={'Ej: "Compré 0.5 acciones de VOO por 290 USD"  ·  "Vendí 50% de mi posición en BTC"'}
          rows={2}
          className={inputCls}
        />
        <div className="flex items-center gap-2">
          <button onClick={analizar} className="rounded-lg bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-ink-100 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
            Analizar
          </button>
          <p className="text-[11px] text-ink-400">
            Es un asistente basado en patrones, no IA generativa — siempre revisa la interpretación antes de confirmar.
          </p>
        </div>

        {interpretacion && (
          <div className={`rounded-lg px-4 py-3 text-sm ${interpretacion.ok ? 'bg-signal-azure/10' : 'bg-signal-coral/10 text-signal-coralDeep dark:text-signal-coral'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant={interpretacion.confianza === 'alta' ? 'emerald' : interpretacion.confianza === 'media' ? 'amber' : 'coral'}>
                Confianza {interpretacion.confianza}
              </Badge>
            </div>
            <p className={interpretacion.ok ? 'text-ink-700 dark:text-ink-200' : ''}>{interpretacion.explicacion}</p>
            {interpretacion.ok && (
              <button onClick={confirmar} className="mt-3 rounded-lg bg-ink-900 dark:bg-signal-emerald text-white dark:text-ink-950 px-4 py-2 text-xs font-medium hover:opacity-90 transition-opacity">
                Confirmar y registrar
              </button>
            )}
          </div>
        )}

        {mensaje && (
          <div className={`rounded-lg px-4 py-3 text-sm ${mensaje.tipo === 'ok' ? 'bg-signal-emerald/10 text-signal-emeraldDeep dark:text-signal-emerald' : 'bg-signal-coral/10 text-signal-coralDeep dark:text-signal-coral'}`}>
            {mensaje.texto}
          </div>
        )}
      </div>
    </Card>
  )
}

function FormularioMovimiento() {
  const { staticData, registrarMovimiento } = usePortfolio()
  const [tipo, setTipo] = useState<TipoMovimiento>('compra')
  const [assetId, setAssetId] = useState(staticData.assets[0]?.id ?? '')
  const [esActivoNuevo, setEsActivoNuevo] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [tickerNuevo, setTickerNuevo] = useState('')
  const [tipoNuevo, setTipoNuevo] = useState<AssetType>('accion')
  const [cantidad, setCantidad] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [comision, setComision] = useState('')
  const [moneda, setMoneda] = useState<'COP' | 'USD'>('COP')
  const [montoTotal, setMontoTotal] = useState('')
  const [porcentajeVendido, setPorcentajeVendido] = useState('100')
  const [eliminarDelPortafolio, setEliminarDelPortafolio] = useState(true)
  const [factorSplit, setFactorSplit] = useState('2')
  const [assetDestinoId, setAssetDestinoId] = useState('')
  const [nombreDestinoNuevo, setNombreDestinoNuevo] = useState('')
  const [comentarios, setComentarios] = useState('')
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v))

  function limpiar() {
    setCantidad(''); setPrecioUnitario(''); setComision(''); setMontoTotal('')
    setNombreNuevo(''); setTickerNuevo(''); setComentarios(''); setNombreDestinoNuevo('')
  }

  function handleSubmit() {
    setMensaje(null)
    const input: NuevoMovimientoInput = {
      tipo,
      assetId: requiereActivo[tipo] || !esActivoNuevo ? assetId : undefined,
      nombreActivoNuevo: esActivoNuevo ? nombreNuevo : undefined,
      tickerNuevo: esActivoNuevo ? tickerNuevo : undefined,
      assetTipoNuevo: esActivoNuevo ? tipoNuevo : undefined,
      cantidad: num(cantidad),
      precioUnitario: num(precioUnitario),
      comision: num(comision),
      moneda,
      montoTotal: num(montoTotal),
      porcentajeVendido: tipo === 'venta' ? Number(porcentajeVendido) : undefined,
      eliminarDelPortafolio,
      factorSplit: tipo === 'split' ? Number(factorSplit) : undefined,
      assetDestinoId: (tipo === 'fusion' || tipo === 'conversion') && assetDestinoId ? assetDestinoId : undefined,
      nombreDestinoNuevo: (tipo === 'fusion' || tipo === 'conversion') && !assetDestinoId ? nombreDestinoNuevo : undefined,
      comentarios,
    }
    const r = registrarMovimiento(input)
    setMensaje({ tipo: r.ok ? 'ok' : 'error', texto: r.mensaje })
    if (r.ok) limpiar()
  }

  return (
    <Card title="Registrar un movimiento (formulario)" subtitle="Compra · Venta · Aporte · Retiro · Dividendo · Staking · Split · Fusión · Conversión">
      <Tabs value={tipo} onChange={setTipo} options={TIPOS} />

      <div className="mt-5 grid sm:grid-cols-2 gap-4">
        {tipo !== 'aporte' && tipo !== 'retiro' && (
          <div className="sm:col-span-2">
            {tipo === 'compra' && (
              <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300 mb-2">
                <input type="checkbox" checked={esActivoNuevo} onChange={(e) => setEsActivoNuevo(e.target.checked)} className="accent-signal-emerald" />
                Es un activo que nunca había tenido
              </label>
            )}
            {esActivoNuevo && tipo === 'compra' ? (
              <div className="grid sm:grid-cols-3 gap-3">
                <input value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} placeholder="Nombre (ej. CSPX)" className={inputCls} />
                <input value={tickerNuevo} onChange={(e) => setTickerNuevo(e.target.value)} placeholder="Ticker" className={inputCls} />
                <Tabs value={tipoNuevo} onChange={setTipoNuevo} options={[{ value: 'accion', label: 'Acción' }, { value: 'fondo', label: 'Fondo/ETF' }, { value: 'cripto', label: 'Cripto' }]} />
              </div>
            ) : (
              <Field label="Activo">
                <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className={inputCls}>
                  {staticData.assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre} ({a.ticker})</option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        )}

        <Field label="Cantidad (opcional)" hint="Unidades, acciones o cripto.">
          <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="0.5" className={inputCls} />
        </Field>
        <Field label="Precio unitario (opcional)">
          <input type="number" value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} placeholder="290" className={inputCls} />
        </Field>

        {(tipo === 'compra' || tipo === 'venta' || tipo === 'aporte' || tipo === 'retiro' || tipo === 'dividendo' || tipo === 'fusion' || tipo === 'conversion') && (
          <>
            <Field label="Monto total de la operación">
              <input type="number" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} placeholder="500000" className={inputCls} />
            </Field>
            <Field label="Moneda">
              <Tabs value={moneda} onChange={setMoneda} options={[{ value: 'COP', label: 'COP' }, { value: 'USD', label: 'USD (convierte con TRM en vivo)' }]} />
            </Field>
          </>
        )}

        {(tipo === 'compra' || tipo === 'venta') && (
          <Field label="Comisión (opcional, misma moneda)">
            <input type="number" value={comision} onChange={(e) => setComision(e.target.value)} placeholder="0" className={inputCls} />
          </Field>
        )}

        {tipo === 'venta' && (
          <>
            <Field label="% de la posición vendida">
              <input type="number" value={porcentajeVendido} onChange={(e) => setPorcentajeVendido(e.target.value)} className={inputCls} />
            </Field>
            {Number(porcentajeVendido) >= 100 && (
              <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300 self-end pb-2">
                <input type="checkbox" checked={eliminarDelPortafolio} onChange={(e) => setEliminarDelPortafolio(e.target.checked)} className="accent-signal-emerald" />
                Eliminar del portafolio (desmarca solo si fue pérdida total, ej. $0 como ONDO/IO)
              </label>
            )}
          </>
        )}

        {tipo === 'split' && (
          <Field label="Factor del split" hint="Ej. 2 para un split 2-por-1.">
            <input type="number" value={factorSplit} onChange={(e) => setFactorSplit(e.target.value)} className={inputCls} />
          </Field>
        )}

        {(tipo === 'fusion' || tipo === 'conversion') && (
          <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3">
            <Field label="Activo destino existente (opcional)">
              <select value={assetDestinoId} onChange={(e) => setAssetDestinoId(e.target.value)} className={inputCls}>
                <option value="">— Crear uno nuevo —</option>
                {staticData.assets.map((a) => (<option key={a.id} value={a.id}>{a.nombre} ({a.ticker})</option>))}
              </select>
            </Field>
            {!assetDestinoId && (
              <Field label="Nombre del activo destino nuevo">
                <input value={nombreDestinoNuevo} onChange={(e) => setNombreDestinoNuevo(e.target.value)} className={inputCls} />
              </Field>
            )}
          </div>
        )}

        <div className="sm:col-span-2">
          <Field label="Comentarios (opcional)">
            <input value={comentarios} onChange={(e) => setComentarios(e.target.value)} className={inputCls} placeholder="Notas libres sobre esta operación" />
          </Field>
        </div>
      </div>

      <button onClick={handleSubmit} className="mt-4 rounded-lg bg-ink-900 dark:bg-signal-emerald text-white dark:text-ink-950 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
        Registrar movimiento
      </button>

      {mensaje && (
        <div className={`mt-3 rounded-lg px-4 py-3 text-sm ${mensaje.tipo === 'ok' ? 'bg-signal-emerald/10 text-signal-emeraldDeep dark:text-signal-emerald' : 'bg-signal-coral/10 text-signal-coralDeep dark:text-signal-coral'}`}>
          {mensaje.texto}
        </div>
      )}
    </Card>
  )
}

function ActualizarValoresMercado() {
  const { staticData, actualizarPosicion, liveStocks } = usePortfolio()
  const [editando, setEditando] = useState<Record<string, { cantidad: string; invertido: string; actual: string }>>({})
  const [guardados, setGuardados] = useState<Record<string, boolean>>({})

  const noCripto = useMemo(() => staticData.assets.filter((a) => a.tipo !== 'cripto'), [staticData.assets])

  function valoresDe(a: (typeof noCripto)[number]) {
    return editando[a.id] ?? { cantidad: a.cantidad !== undefined ? String(a.cantidad) : '', invertido: String(a.invertidoCOP), actual: String(a.actualCOP) }
  }

  function setCampo(assetId: string, campo: 'cantidad' | 'invertido' | 'actual', valor: string, base: ReturnType<typeof valoresDe>) {
    setEditando((prev) => ({ ...prev, [assetId]: { ...base, [campo]: valor } }))
  }

  function guardar(assetId: string) {
    const v = editando[assetId]
    if (!v) return
    const cambios: Partial<{ cantidad: number; invertidoCOP: number; actualCOP: number }> = {}
    if (v.cantidad.trim() !== '' && !isNaN(Number(v.cantidad))) cambios.cantidad = Number(v.cantidad)
    if (v.invertido.trim() !== '' && !isNaN(Number(v.invertido))) cambios.invertidoCOP = Number(v.invertido)
    if (v.actual.trim() !== '' && !isNaN(Number(v.actual))) cambios.actualCOP = Number(v.actual)
    if (Object.keys(cambios).length === 0) return
    actualizarPosicion(assetId, cambios)
    setGuardados((prev) => ({ ...prev, [assetId]: true }))
    setEditando((prev) => { const next = { ...prev }; delete next[assetId]; return next })
    setTimeout(() => setGuardados((prev) => ({ ...prev, [assetId]: false })), 2000)
  }

  return (
    <Card
      title="Actualizar valores de mercado"
      subtitle="Acciones BVC y fondos colombianos no tienen API gratuita — corrige cantidad, invertido o valor actual cada vez que revises tu extracto de TRII/MPF"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200/70 dark:border-ink-700/70 text-left">
              <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400 font-medium">Activo</th>
              <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400 font-medium">Cantidad</th>
              <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400 font-medium">Invertido (COP)</th>
              <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400 font-medium">Actual (COP)</th>
              <th className="px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400 font-medium text-right">P/L</th>
              <th className="px-3 py-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {noCripto.map((a) => {
              const v = valoresDe(a)
              const pl = plPercent(Number(v.invertido) || a.invertidoCOP, Number(v.actual) || a.actualCOP)
              const tieneLive = a.stooqSymbol && a.cantidad !== undefined && liveStocks.prices[a.stooqSymbol.toLowerCase()] !== undefined
              return (
                <tr key={a.id} className="border-b border-ink-100 dark:border-ink-800">
                  <td className="px-3 py-2">
                    <p className="font-medium text-ink-800 dark:text-ink-100 flex items-center gap-1.5">
                      {a.nombre}
                      {tieneLive && <span className="h-1.5 w-1.5 rounded-full bg-signal-emerald" title="Precio en vivo (best-effort)" />}
                    </p>
                    <p className="text-xs text-ink-400">{a.ticker}</p>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      placeholder="—"
                      value={v.cantidad}
                      onChange={(e) => setCampo(a.id, 'cantidad', e.target.value, v)}
                      className="w-20 rounded-md border border-ink-200 dark:border-ink-600 bg-white dark:bg-ink-800 px-2 py-1 text-sm tabular focus:outline-none focus:ring-2 focus:ring-signal-emerald/40"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={v.invertido}
                      onChange={(e) => setCampo(a.id, 'invertido', e.target.value, v)}
                      className="w-28 rounded-md border border-ink-200 dark:border-ink-600 bg-white dark:bg-ink-800 px-2 py-1 text-sm tabular focus:outline-none focus:ring-2 focus:ring-signal-emerald/40"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={v.actual}
                      onChange={(e) => setCampo(a.id, 'actual', e.target.value, v)}
                      className="w-28 rounded-md border border-ink-200 dark:border-ink-600 bg-white dark:bg-ink-800 px-2 py-1 text-sm tabular focus:outline-none focus:ring-2 focus:ring-signal-emerald/40"
                    />
                  </td>
                  <td className={`px-3 py-2 text-right tabular font-medium ${pl >= 0 ? 'text-signal-emeraldDeep dark:text-signal-emerald' : 'text-signal-coralDeep dark:text-signal-coral'}`}>
                    {formatPercent(pl)}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => guardar(a.id)} className="text-xs font-medium rounded-md border border-ink-200 dark:border-ink-600 px-2.5 py-1 text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                      {guardados[a.id] ? '✓ Guardado' : 'Guardar'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {stooqNota(noCripto)}
    </Card>
  )
}

function stooqNota(assets: { stooqSymbol?: string; cantidad?: number; nombre: string }[]) {
  const conSimbolo = assets.filter((a) => a.stooqSymbol)
  if (conSimbolo.length === 0) return null
  const sinCantidad = conSimbolo.filter((a) => a.cantidad === undefined)
  if (sinCantidad.length === 0) return null
  return (
    <p className="text-[11px] text-ink-400 mt-3">
      {sinCantidad.map((a) => a.nombre).join(', ')} tiene símbolo configurado para precio en vivo, pero falta la cantidad de unidades —
      indícala desde un movimiento de compra para activarlo automáticamente.
    </p>
  )
}

function Historial() {
  const { ledger } = usePortfolio()
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const filtrado = useMemo(() => {
    return ledger.filter((m) => (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta))
  }, [ledger, desde, hasta])

  return (
    <Card title="Historial de movimientos" subtitle="Registro permanente guardado en este navegador — filtra por fecha para consultar cualquier período">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Field label="Desde">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Hasta">
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputCls} />
        </Field>
        {(desde || hasta) && (
          <button onClick={() => { setDesde(''); setHasta('') }} className="text-xs text-ink-400 hover:text-ink-600 self-end pb-2">
            Limpiar filtro
          </button>
        )}
      </div>

      {filtrado.length === 0 ? (
        <p className="text-sm text-ink-400 text-center py-6">No hay movimientos registrados en este rango.</p>
      ) : (
        <div className="space-y-2 max-h-[28rem] overflow-y-auto">
          {filtrado.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-3 rounded-lg bg-ink-50 dark:bg-ink-800/60 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="neutral">{TIPOS.find((t) => t.value === m.tipo)?.label ?? m.tipo}</Badge>
                  <span className="text-sm font-medium text-ink-800 dark:text-ink-100 truncate">{m.nombreActivo}{m.ticker && m.ticker !== '—' ? ` (${m.ticker})` : ''}</span>
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  {formatCOP(m.montoTotalCOP)}
                  {m.cantidad !== undefined ? ` · ${m.cantidad} unidades` : ''}
                  {m.comentarios ? ` · "${m.comentarios}"` : ''}
                </p>
              </div>
              <p className="text-[11px] text-ink-400 shrink-0 tabular">{m.fecha} {m.hora}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
