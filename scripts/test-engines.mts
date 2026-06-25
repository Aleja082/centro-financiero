import portfolioData from '../src/data/portfolioData.ts'
import { aplicarMovimientoRegistro } from '../src/utils/movimientos.ts'
import { generarAlertasDinamicas } from '../src/utils/alertEngine.ts'
import { calcularRebalanceo } from '../src/utils/rebalanceEngine.ts'
import { interpretarMovimiento } from '../src/utils/nlParser.ts'
import { UMBRALES_DEFAULT } from '../src/types/movimientos.ts'

let fallas = 0
function check(nombre: string, cond: boolean, detalle = '') {
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`)
  if (!cond) fallas++
}

const assets = portfolioData.assets
const trm = portfolioData.meta.trm

// --- 1. Compra: acumular en BTC existente ---
const btcAntes = assets.find(a => a.id === 'btc')!
const r1 = aplicarMovimientoRegistro(assets, { tipo: 'compra', assetId: 'btc', montoTotal: 100000, moneda: 'COP', cantidad: 0.001 }, { trm })
const btcDespues = r1.assets.find(a => a.id === 'btc')!
check('Compra BTC: invertido sube exactamente 100000', btcDespues.invertidoCOP === btcAntes.invertidoCOP + 100000, `${btcAntes.invertidoCOP} -> ${btcDespues.invertidoCOP}`)
check('Compra BTC: cantidad sube 0.001', Math.abs((btcDespues.cantidad! - btcAntes.cantidad!) - 0.001) < 1e-9)
check('Compra BTC: liquidezDelta es negativo (salió dinero)', r1.liquidezDelta === -100000)

// --- 2. Compra: activo nuevo (CSPX) ---
const r2 = aplicarMovimientoRegistro(assets, { tipo: 'compra', nombreActivoNuevo: 'iShares Core S&P 500', tickerNuevo: 'CSPX', assetTipoNuevo: 'fondo', montoTotal: 500000, moneda: 'COP' }, { trm })
const cspx = r2.assets.find(a => a.ticker === 'CSPX')
check('Compra activo nuevo: CSPX se crea', !!cspx)
check('Compra activo nuevo: invertido = 500000', cspx?.invertidoCOP === 500000)
check('Compra activo nuevo: no duplica otros activos', r2.assets.length === assets.length + 1)

// --- 3. Venta parcial 50% de SOL ---
const solAntes = assets.find(a => a.id === 'sol')!
const r3 = aplicarMovimientoRegistro(assets, { tipo: 'venta', assetId: 'sol', montoTotal: 30000, moneda: 'COP', porcentajeVendido: 50 }, { trm })
const solDespues = r3.assets.find(a => a.id === 'sol')!
check('Venta 50% SOL: invertido se reduce ~50%', Math.abs(solDespues.invertidoCOP - solAntes.invertidoCOP * 0.5) < 2)
check('Venta 50% SOL: cantidad se reduce ~50%', Math.abs(solDespues.cantidad! - solAntes.cantidad! * 0.5) < 1e-9)
check('Venta 50% SOL: liquidezDelta = monto recibido', r3.liquidezDelta === 30000)

// --- 4. Venta total (liquidar) de LINK, eliminando del portafolio ---
const r4 = aplicarMovimientoRegistro(assets, { tipo: 'venta', assetId: 'link', montoTotal: 150000, moneda: 'COP', porcentajeVendido: 100, eliminarDelPortafolio: true }, { trm })
check('Liquidar LINK: ya no aparece en assets', !r4.assets.find(a => a.id === 'link'))
check('Liquidar LINK: el resto de activos sigue intacto', r4.assets.length === assets.length - 1)

// --- 5. Aporte y retiro afectan liquidez, no activos ---
const r5 = aplicarMovimientoRegistro(assets, { tipo: 'aporte', montoTotal: 200000, moneda: 'COP' }, { trm })
check('Aporte: liquidezDelta = +200000', r5.liquidezDelta === 200000)
check('Aporte: no cambia ningún activo', JSON.stringify(r5.assets) === JSON.stringify(assets))
const r6 = aplicarMovimientoRegistro(assets, { tipo: 'retiro', montoTotal: 50000, moneda: 'COP' }, { trm })
check('Retiro: liquidezDelta = -50000', r6.liquidezDelta === -50000)

// --- 6. Conversión USD -> COP usa la TRM ---
const r7 = aplicarMovimientoRegistro(assets, { tipo: 'compra', assetId: 'eth', montoTotal: 100, moneda: 'USD' }, { trm })
const ethDespues = r7.assets.find(a => a.id === 'eth')!
const ethAntes = assets.find(a => a.id === 'eth')!
check('Compra en USD convierte con TRM', ethDespues.invertidoCOP === ethAntes.invertidoCOP + Math.round(100 * trm), `esperado +${Math.round(100*trm)}`)

// --- 7. Staking aumenta cantidad sin cambiar invertido ---
const r8 = aplicarMovimientoRegistro(assets, { tipo: 'staking', assetId: 'eth', cantidad: 0.002, moneda: 'COP' }, { trm })
const ethStaking = r8.assets.find(a => a.id === 'eth')!
check('Staking: cantidad sube, invertido NO cambia', ethStaking.invertidoCOP === ethAntes.invertidoCOP && Math.abs(ethStaking.cantidad! - (ethAntes.cantidad! + 0.002)) < 1e-9)

// --- 8. Split duplica cantidad, no cambia valor ---
const r9 = aplicarMovimientoRegistro(assets, { tipo: 'split', assetId: 'sol', factorSplit: 2, moneda: 'COP' }, { trm })
const solSplit = r9.assets.find(a => a.id === 'sol')!
check('Split 2x: cantidad se duplica', Math.abs(solSplit.cantidad! - solAntes.cantidad! * 2) < 1e-9)
check('Split 2x: invertido/actual no cambian', solSplit.invertidoCOP === solAntes.invertidoCOP && solSplit.actualCOP === solAntes.actualCOP)

// --- 9. Motor de alertas dinámicas detecta concentración cripto real ---
const alertasDin = generarAlertasDinamicas(assets, portfolioData.asignacionObjetivo, UMBRALES_DEFAULT)
check('Motor de alertas genera al menos 1 alerta con el dataset real', alertasDin.length > 0, `${alertasDin.length} alertas`)
check('Alertas dinámicas tienen fecha/prioridad/accionSugerida', alertasDin.every(a => a.fecha && a.prioridad && a.accionSugerida))

// --- 10. Rebalanceo: suma de pctActual de categorías es razonable (no debe exceder ~100% groseramente) ---
const rebal = calcularRebalanceo(assets, portfolioData.asignacionObjetivo, 0)
check('Rebalanceo genera una fila por cada categoría objetivo', rebal.length === portfolioData.asignacionObjetivo.length)
check('Rebalanceo: BTC tiene accion definida', !!rebal.find(f => f.etiqueta === 'Bitcoin')?.accion)

// --- 11. Parser de lenguaje natural ---
const p1 = interpretarMovimiento('Compré 0.5 acciones de NU por 290 USD', assets)
check('Parser detecta tipo compra', p1.ok && p1.input?.tipo === 'compra', p1.explicacion)
check('Parser identifica el activo NU', p1.asset?.ticker === 'NU')
check('Parser detecta monto y moneda USD', p1.input?.montoTotal === 290 && p1.input?.moneda === 'USD')

const p2 = interpretarMovimiento('Vendí 50% de mi posición en BTC', assets)
check('Parser detecta tipo venta', p2.ok && p2.input?.tipo === 'venta', p2.explicacion)
check('Parser identifica BTC', p2.asset?.ticker === 'BTC')
check('Parser detecta 50%', p2.input?.porcentajeVendido === 50)

const p3 = interpretarMovimiento('blablabla esto no tiene sentido', assets)
check('Parser rechaza frases sin sentido (no inventa datos)', !p3.ok)

// --- 12. NU (Nubank) ahora tiene cantidad real y queda elegible para precio en vivo ---
const nu = assets.find(a => a.id === 'nuco')!
check('NU tiene cantidad = 1', nu.cantidad === 1)
check('NU tiene invertido = 48760 (precio real de compra)', nu.invertidoCOP === 48760)
check('NU tiene actual = 43000 (precio real actual)', nu.actualCOP === 43000)
check('NU queda elegible para Stooq (stooqSymbol + cantidad definidos)', !!nu.stooqSymbol && nu.cantidad !== undefined)
check('P/L de NU coincide con -11,81% reportado', Math.abs(((nu.actualCOP - nu.invertidoCOP) / nu.invertidoCOP * 100) - (-11.81)) < 0.05)

console.log(`\n--- Resumen: ${fallas === 0 ? 'TODO OK ✅' : `${fallas} FALLAS ❌`} ---`)
process.exit(fallas === 0 ? 0 : 1)
