import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})

// @ts-expect-error - poblar globals tipo navegador para que React/contextos funcionen
globalThis.window = dom.window
// @ts-expect-error
globalThis.document = dom.window.document
try {
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
} catch {
  // Node 22+ expone su propio `navigator` global de solo lectura en algunos contextos; se ignora si no se puede sobrescribir.
}
// @ts-expect-error
globalThis.HTMLElement = dom.window.HTMLElement
// @ts-expect-error
globalThis.localStorage = dom.window.localStorage

// jsdom no implementa matchMedia ni ResizeObserver — se necesitan para
// ThemeContext y para Recharts ResponsiveContainer respectivamente.
dom.window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia
// @ts-expect-error
globalThis.matchMedia = dom.window.matchMedia

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error
globalThis.ResizeObserver = ResizeObserverMock
// @ts-expect-error
dom.window.ResizeObserver = ResizeObserverMock

const errores: string[] = []
const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  errores.push(args.map(String).join(' '))
  originalConsoleError(...args)
}

const React = (await import('react')).default
const { createRoot } = await import('react-dom/client')
const { default: App } = await import('../src/App')

const rutas = ['/', '/analisis', '/activos', '/recomendaciones', '/alertas', '/checklist', '/aportes', '/simulador', '/oportunidades', '/datos']

async function visitarRuta(hash: string) {
  dom.window.location.hash = hash
  const container = dom.window.document.getElementById('root')!
  container.innerHTML = ''
  const root = createRoot(container)
  root.render(React.createElement(App))
  await new Promise((r) => setTimeout(r, 80))
  const texto = container.textContent ?? ''
  const ok = texto.trim().length > 0
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${hash.padEnd(20)} (${texto.length} chars de texto renderizado)`)
  root.unmount()
  return ok
}

let todasOk = true
for (const ruta of rutas) {
  try {
    const ok = await visitarRuta(`#${ruta}`)
    todasOk = todasOk && ok
  } catch (e) {
    todasOk = false
    console.log(`FAIL  #${ruta} — excepción:`, e)
  }
}

console.log('\n--- Resumen ---')
console.log(`Rutas visitadas: ${rutas.length}`)
console.log(`console.error capturados: ${errores.length}`)
if (errores.length > 0) {
  console.log('Primeros errores:')
  errores.slice(0, 10).forEach((e) => console.log('  -', e.slice(0, 200)))
}
console.log(todasOk ? '\n✅ Smoke test: todas las rutas renderizaron contenido' : '\n❌ Smoke test: alguna ruta falló')
process.exit(todasOk ? 0 : 1)
