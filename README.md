# Centro de Control Financiero

Centro de control de inversiones personales construido como aplicación web estática
(React + TypeScript + Tailwind + Recharts), sin backend. Toda la información vive en
el bundle (`src/data/portfolioData.ts`) y en `localStorage` del navegador para tus
preferencias, alertas y checklist.

Construida a partir del portafolio real analizado en el proyecto: posiciones en
Binance (cripto), TRII (acciones y fondos colombianos) y MPF Invest (fondo global),
más el perfil de inversionista y el análisis del comité de inversiones ya realizado.

> ⚠️ **Esto no es asesoría financiera.** Es una herramienta de organización y cálculo
> personal. Las proyecciones del simulador son ilustrativas y ninguna rentabilidad
> está garantizada.

---

## Funcionalidades

- **Precios cripto y TRM en vivo** — BTC, ETH y el resto de tus criptomonedas
  se consultan en tiempo real contra la API pública y gratuita de CoinGecko,
  y la TRM (COP/USD) contra la API pública de DolarAPI Colombia — ambas
  directamente desde el navegador (sin backend, sin clave de API). A partir
  de ahí, todo lo que depende de esos valores se recalcula en cascada: el
  valor total y P/L del dashboard, la valoración en USD, el % de cripto en
  cada gráfico, el subscore de "Gestión de riesgo" y la alerta de
  concentración cripto (con su severidad 🟢🟡🟠🔴 y el porcentaje exacto
  actualizándose solos), y una señal táctica 📡 en las posiciones marcadas
  como "reducir"/"vender". Si alguna de las dos APIs no responde, se usa el
  último valor guardado en Local Storage y se muestra una alerta explícita
  de datos desactualizados. Ver la sección **"Cómo funcionan los precios y
  la TRM en vivo"** más abajo para el alcance exacto (qué se actualiza solo
  y qué sigue siendo manual).
- **Movimientos del portafolio** — registra compra, venta, aporte, retiro,
  dividendo, staking, split, fusión y conversión desde un formulario (o
  describiéndolo en lenguaje natural). Todo se recalcula solo: cantidades,
  costo promedio, P/L, distribución, alertas y rebalanceo. Historial
  permanente filtrable por fecha. Ver **"Sistema vivo de seguimiento"** más
  abajo.
- **Rebalanceo en vivo** — tabla de asignación actual vs. objetivo con
  sugerencias de cuánto comprar/vender de cada categoría, en pesos.
- **Motor de alertas automáticas** — umbrales configurables (caída/subida %
  desde el costo, concentración por sector/país), recalculado en cada
  cambio de precio o movimiento, separado de las alertas curadas del comité.
- **Dashboard** — valor total, rentabilidad total y anualizada (aproximada), P/L
  por activo, próxima acción recomendada, oportunidades detectadas, liquidez
  disponible, distribución por tipo de activo/país/moneda, comparación vs. objetivo.
- **Análisis** — salud del portafolio (0-100) con desglose ponderado, semáforos de
  exposición temática (tecnología, IA, cripto, mercados emergentes).
- **Activos** — tabla filtrable (cripto / acciones / fondos) con fila expandible:
  tesis, ventajas, riesgos, convicción, riesgo y recomendación por activo.
- **Recomendaciones** — centro agrupado por 🟢 Acumular/Comprar, 🟡 Mantener,
  🟠 Reducir, 🔴 Vender, con motivo, prioridad, impacto esperado y confianza.
- **Alertas** — motor automático + alertas curadas, con severidad
  (bajo/medio/alto/crítico) y estado persistente (pendiente/revisada/resuelta).
- **Checklist** — sugerencias automáticas (desde el motor de alertas/rebalanceo)
  más tareas manuales agrupadas, con progreso persistente.
- **Plan de aportes** — escenarios fijos de $200.000 / $500.000 / $1.000.000 COP
  mensuales, más una calculadora de monto personalizado con slider.
- **Simulador financiero** — aporte mensual, incremento anual, inflación, tres
  escenarios (pesimista/base/optimista) y cuatro horizontes (5/10/20/30 años), con
  valores nominales y ajustados por inflación.
- **Centro de oportunidades** — ideas de inversión por categoría (ETF, Acciones, IA,
  Salud, Energía, Infraestructura, Mercados Emergentes, Criptomonedas).
- **Datos** — exportar/importar el dataset completo como JSON, restablecer al
  original, e instrucciones para mantenerlo actualizado.
- **Modo oscuro / claro** con persistencia, navegación lateral responsive.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| UI | React 18 + TypeScript |
| Estilos | Tailwind CSS (modo oscuro por clase) |
| Gráficos | Recharts |
| Iconos | Heroicons |
| Routing | React Router (`HashRouter`, compatible con hosting estático sin config de servidor) |
| Build | Vite |
| Persistencia | `localStorage` (sin backend, sin base de datos) |

---

## Empezar

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build         # genera dist/
npm run preview        # sirve dist/ localmente para verificar el build de producción
npm run smoke-test     # renderiza las 12 rutas en un entorno headless (jsdom) y reporta errores
npm run test-engines   # 24 aserciones sobre movimientos/alertas/rebalanceo/parser NL
npm run gen-example    # regenera public/data/portfolio.example.json a partir de src/data/portfolioData.ts
```

Para desplegar a GitHub Pages, Vercel, Netlify o Cloudflare Pages, ver
[`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Estructura de carpetas

```
src/
├── types/
│   ├── portfolio.ts          # Modelo de datos central (única fuente de verdad de tipos)
│   └── movimientos.ts        # Tipos del ledger de movimientos y umbrales de alertas
├── data/portfolioData.ts     # Dataset real, tipado con PortfolioData
├── context/
│   ├── ThemeContext.tsx      # Modo oscuro/claro + persistencia
│   └── PortfolioContext.tsx  # Datos + precios/TRM/acciones en vivo + movimientos + alertas + rebalanceo
├── hooks/
│   ├── useLocalStorage.ts
│   ├── useLivePrices.ts      # Precios cripto en vivo (CoinGecko)
│   ├── useLiveTRM.ts         # TRM en vivo (DolarAPI Colombia)
│   └── useLiveStockPrices.ts # Precios de acciones "best-effort" (Stooq + Twelve Data opcional)
├── utils/
│   ├── format.ts             # formatCOP, formatUSD, formatPercent, etc.
│   ├── calculations.ts       # healthScore, simulate() (motor del simulador)
│   ├── portfolioMath.ts      # totales, agrupaciones por tipo/país/moneda
│   ├── liveRecalc.ts         # Recalcula subscores/exposición/alertas con precios en vivo
│   ├── movimientos.ts        # Motor de los 9 tipos de movimiento
│   ├── alertEngine.ts        # Motor de alertas automáticas (umbrales configurables)
│   ├── rebalanceEngine.ts    # Motor de rebalanceo (actual vs. objetivo)
│   └── nlParser.ts           # Parser por patrones para "Analizar Nuevo Movimiento"
├── components/
│   ├── ui/                   # Card, Badge, Gauge, ProgressBar, Semaphore, Tabs, RiesgoTag, MarketStatusBar...
│   ├── layout/                # Sidebar, Topbar, Layout, HorizonRuler
│   └── charts/                # AllocationDonut, ExposureBars, ComparisonBars, SimulatorChart
├── pages/                     # Una página por ruta (Dashboard, Analysis, Assets, Movimientos, Rebalanceo, ...)
└── App.tsx                    # HashRouter + providers

public/data/portfolio.example.json   # Ejemplo de JSON importable (mismo esquema que PortfolioData)
scripts/
├── gen-example.mts            # Regenera el JSON de ejemplo desde el dataset TS
├── smoke-test.mts             # Prueba de humo headless (jsdom) de las 12 rutas
└── test-engines.mts           # 24 aserciones funcionales (movimientos, alertas, rebalanceo, parser NL)
```

---

## Cómo funcionan los precios y la TRM en vivo

### Precios cripto (CoinGecko)

- **Fuente:** API pública gratuita de [CoinGecko](https://www.coingecko.com/en/api)
  (`/api/v3/simple/price`), consultada directamente desde el navegador — sin
  servidor intermedio ni clave de API.
- **Frecuencia:** al abrir cualquier página y luego cada 5 minutos
  automáticamente. Botón de actualización manual (↻) disponible.
- **Qué se actualiza solo:** el precio en USD de cada criptomoneda con
  `coingeckoId` configurado en `src/data/portfolioData.ts` (las 16
  posiciones cripto). A partir de ahí, todo lo derivado se recalcula en
  cascada: valor actual y P/L de cada posición, totales y distribución del
  dashboard, % de cripto, subscore de riesgo, alerta de concentración cripto,
  y la señal táctica 📡 en las posiciones "reducir"/"vender".

### TRM — Tasa Representativa del Mercado COP/USD (DolarAPI Colombia)

- **Fuente:** API pública y gratuita de [DolarAPI Colombia](https://co.dolarapi.com/v1/trm)
  — la TRM oficial publicada por la Superintendencia Financiera.
- **Frecuencia:** se consulta al cargar el dashboard (o cualquier página) y
  se refresca automáticamente cada 30 minutos. Botón de actualización manual
  (↻) disponible junto al indicador.
- **Cadena de respaldo si la API falla:**
  1. Se usa el último valor guardado en **Local Storage** del navegador
     (clave `trm-live-v1`, con su fecha de consulta).
  2. Si nunca se guardó un valor (primera vez que se abre la app, o Local
     Storage deshabilitado), se usa la TRM congelada en el dataset
     (`data.meta.trm`, $3.426 al 16 de junio de 2026).
  3. En ambos casos de respaldo se marca el estado como **desactualizado** y
     se muestra una alerta explícita: *"Datos de TRM desactualizados — no se
     pudo conectar con DolarAPI Colombia, mostrando el último valor
     guardado"*, junto a un punto de estado rojo en vez de verde.
- **Dónde se usa:** todos los cálculos de valoración del portafolio en USD,
  la conversión de precios cripto en vivo a COP, y los equivalentes en USD
  que aparecen en el Simulador y el Plan de Aportes. La TRM congelada del
  dataset (visible en la sección **Datos**) solo se usa como respaldo de
  último recurso — el resto de la app siempre prioriza la TRM en vivo.

### Qué NO se actualiza solo (en ninguno de los dos casos)

- Las acciones y fondos colombianos (TRII, MPF) — no existe una API gratuita
  y abierta equivalente para esos instrumentos.
- La clasificación 🟢 Comprar/Acumular, 🟡 Mantener, 🟠 Reducir, 🔴 Vender de
  cada activo — es un juicio analítico (redundancia, calidad de tesis,
  convicción), no una regla mecánica de precio. Lo que sí ves en vivo es el
  porcentaje, el valor en pesos/dólares, y la señal táctica de cada posición.
- **Cobertura de monedas cripto:** los identificadores de CoinGecko para
  tokens muy pequeños o recientes (ej. SAHARA, CGPT, VIRTUAL) pueden no
  resolver siempre. Cada fila de la tabla de Activos muestra un punto verde
  (🟢 en vivo) o gris (○ valor guardado) junto al valor "Actual".

---

## Sistema vivo de seguimiento de inversiones

La app está diseñada para que **nunca tengas que tocar código ni editar JSON a
mano** para tu uso del día a día. Todo movimiento se registra desde la
interfaz y se propaga solo.

### Movimientos del portafolio

En la sección **Movimientos** puedes registrar 9 tipos de operación: Compra,
Venta, Aporte, Retiro, Dividendo, Staking, Split, Fusión y Conversión. Cada
registro guarda fecha, hora, activo, ticker, cantidad, precio unitario,
comisión, moneda y comentarios, y queda en un **historial permanente**
(`localStorage`, clave `movimientos-ledger-v2`) que puedes filtrar por rango
de fechas.

Qué hace cada tipo, en resumen:

| Tipo | Efecto |
|---|---|
| Compra | Suma al invertido (y a la cantidad) de un activo existente, o crea uno nuevo |
| Venta | Resta proporcionalmente invertido/cantidad (parcial) o liquida la posición (100%) |
| Aporte / Retiro | Suma/resta de tu **liquidez disponible** — no afecta ninguna posición |
| Dividendo | Suma a tu liquidez disponible; no cambia la posición que lo pagó |
| Staking | Aumenta la cantidad del activo cripto con costo base $0 (recompensa libre) |
| Split | Multiplica la cantidad por el factor indicado; el valor total no cambia |
| Fusión / Conversión | Traslada el valor de un activo de origen a uno de destino (existente o nuevo) |

Las compras/ventas en USD se convierten a COP automáticamente con la **TRM en
vivo** del momento.

### Analizar Nuevo Movimiento (asistente de lenguaje natural)

En la misma sección hay un cuadro de texto donde puedes escribir frases como:

> "Compré 0.5 acciones de VOO por 290 USD"
> "Vendí 50% de mi posición en BTC"

Es un **parser basado en patrones** (`src/utils/nlParser.ts`), no un modelo de
lenguaje — reconoce el tipo de movimiento (verbos como compré/vendí/aporté),
el ticker, el monto/moneda y el porcentaje cuando la frase se parece a los
ejemplos. Siempre muestra una **vista previa con nivel de confianza** antes
de aplicar nada; si no logra interpretar la frase, te lo dice explícitamente
en vez de adivinar, y el formulario manual de abajo queda como respaldo
confiable para cualquier caso ambiguo.

### Recálculo automático en cascada

Cada movimiento (y cada actualización de precio en vivo) recalcula al
instante, sin pedírselo a nadie: cantidades, valor invertido/actual, P/L%,
distribución por tipo/país/moneda/sector, el subscore de riesgo, y todas las
alertas y el rebalanceo descritos abajo.

### Motor de alertas automáticas (umbrales configurables)

En **Alertas** hay un panel "Configurar umbrales" con 4 controles deslizantes:
caída/subida % desde el costo que dispara una alerta por activo, y
concentración máxima por sector/país. El motor (`src/utils/alertEngine.ts`)
recorre tus posiciones en vivo y genera alertas con fecha, prioridad,
motivo y acción sugerida — separadas de las alertas curadas del comité de
inversiones (esas son cualitativas y no cambian solas con el precio).

### Rebalanceo en vivo

La sección **Rebalanceo** compara tu asignación actual (con precios y TRM en
vivo) contra `asignacionObjetivo` y te dice exactamente cuánto comprar o
vender de cada categoría, en pesos, para volver al objetivo
(`src/utils/rebalanceEngine.ts`).

### Checklist dinámico

**Checklist** ahora muestra una sección "Sugeridas automáticamente" arriba de
tus tareas manuales, generada en vivo a partir del motor de alertas y de
rebalanceo (ej. "Comprar más ETF global", "Reducir exposición a BTC").

### Precios de acciones/ETF — qué es realmente posible

Pediste integrar Yahoo Finance, Alpha Vantage, Twelve Data, Finnhub y Stooq.
Honestamente: **ninguna de esas API cubre la Bolsa de Valores de Colombia ni
fondos colombianos** (PFAVAL, MINEROS, GEB, CEMARGOS, ICHNCO, TRIIRENTA,
500 ACCIONES US, DONAMICO, MPF Global) — no es una limitación de esta app,
es que ese dato simplemente no se publica en ninguna API gratuita conocida.

Lo que sí se implementó:

- **Stooq (sin clave, mejor esfuerzo):** para activos con `stooqSymbol`
  configurado y `cantidad` conocida (hoy ninguno, porque no tenemos el número
  de acciones de NU — agrégalo desde un movimiento de compra para activarlo).
  Se refresca cada hora, con botón de actualización manual implícito en el
  refresco de la barra de estado.
- **Twelve Data (opcional, con tu propia clave):** en **Datos**, puedes pegar
  tu clave gratuita de Twelve Data — se guarda **solo en tu navegador**
  (`localStorage`), nunca en el código público del proyecto. Así, ningún
  visitante del repositorio puede ver ni gastar tu cupo gratuito.
- **Para todo lo demás (BVC + fondos colombianos):** la tabla "Actualizar
  valores de mercado" en **Movimientos** sigue siendo la herramienta
  correcta — un campo + un clic cada vez que revises tu extracto de TRII/MPF.

### Liquidez disponible

Los Aportes y Retiros (y los Dividendos recibidos) se acumulan en un campo
`liquidezCOP` separado de las posiciones — visible en el Dashboard y en
Rebalanceo — para que sepas cuánto dinero tienes disponible sin invertir
todavía.

---

## Sistema de actualización de datos (alternativa masiva)

Para respaldos completos o ediciones masivas (no para el día a día):

1. **Exportar/Importar JSON** en la sección **Datos** — sube un archivo con
   el mismo esquema que `public/data/portfolio.example.json`.
2. **Editando el código:** edita `src/data/portfolioData.ts`, corre
   `npm run build` y vuelve a desplegar (cambia el dato por defecto que ven
   los visitantes nuevos, no el de tu propio navegador).

El tipo `PortfolioData` (en `src/types/portfolio.ts`) es el contrato que
cualquier JSON importado debe cumplir. La validación al importar es mínima a
propósito (solo confirma que existan `assets`, `alertas`, `checklist` y
`perfil`) para que puedas editar montos y textos libremente.

---

## Decisiones de diseño relevantes

- **`HashRouter`** en lugar de `BrowserRouter`: evita el clásico problema de "404 al
  refrescar" en hosting estático (GitHub Pages, y subpaths en general) sin tener que
  configurar reglas de redirección por plataforma.
- **`base: './'`** en `vite.config.ts`: las rutas de los assets son relativas, así que
  el mismo build funciona en la raíz de un dominio (Vercel/Netlify/Cloudflare) o en un
  subpath (`usuario.github.io/repo/`).
- **Sin backend, sin claves de API expuestas:** toda la lógica (salud del portafolio,
  simulador, motor de alertas, rebalanceo, agregaciones) corre en el navegador. Esto hace que el despliegue sea
  trivial y que tus datos financieros nunca salgan de tu propio navegador salvo que
  tú decidas exportarlos. La única clave opcional (Twelve Data) la guarda cada
  visitante en su propio `localStorage`, nunca en el bundle público.
- **Ledger + materialización, no event-sourcing puro:** cada movimiento se
  aplica inmediatamente sobre el activo afectado (cantidad/invertido/actual) Y
  se guarda en el historial — así el dashboard no tiene que "reproducir" años
  de movimientos en cada carga, pero conservas el registro completo para auditar.
- **El motor de alertas dinámico mide "desde el costo", no "desde ayer":** sin
  snapshots diarios históricos, la comparación más honesta y útil para un
  inversionista de largo plazo es el P/L% desde el precio de compra, no el
  movimiento intradiario — por eso los umbrales de caída/subida se miden así.

---

## Mejoras futuras recomendadas

- **Multi-portafolio / multi-perfil:** permitir guardar varios escenarios o
  versiones del portafolio (ej. "actual" vs. "objetivo a 12 meses") y compararlos.
- **Rentabilidad anualizada con XIRR real:** el dashboard usa hoy un CAGR
  simplificado (asume todo el capital invertido desde la fecha del snapshot).
  Con el historial de movimientos ya guardado, se puede calcular una
  rentabilidad money-weighted real (XIRR) que respete la fecha exacta de cada
  aporte/retiro/compra — más preciso para un portafolio con flujos irregulares.
- **Snapshots diarios para alertas de movimiento intradiario:** el motor de
  alertas mide caída/subida "desde el costo" porque no hay histórico de
  precios día a día guardado. Guardar un snapshot diario (cron-like, al abrir
  la app una vez por día) permitiría alertas de "cayó X% hoy", más cercanas a
  lo que pediste originalmente.
- **Ampliar cobertura de Stooq/Twelve Data:** hoy solo NU tiene `stooqSymbol`
  configurado, y le falta la cantidad de acciones para activarse. Si agregas
  ETFs internacionales (VOO, CSPX, QQQ) vía Movimientos con su ticker y
  cantidad, se puede sumar su símbolo de Stooq fácilmente.
- **Exportar reportes en PDF:** un botón "Exportar informe" que genere un PDF del
  dashboard/análisis para guardar un histórico mensual.
- **Autenticación opcional + sincronización en la nube:** para quienes quieran ver su
  portafolio desde varios dispositivos sin reimportar el JSON manualmente.
- **Cálculo de impuestos colombiano:** módulo que estime la retención de dividendos
  (ETFs US-domiciliados vs. UCITS) y el efecto de la declaración de renta sobre
  ganancias en cripto y acciones internacionales.
- **Code-splitting:** Recharts pesa ~411 KB sin comprimir por sí solo; dividir
  por ruta con `React.lazy()` reduciría la carga inicial de páginas que no
  usan gráficos (ej. Movimientos, Datos).
- **Asistente de lenguaje natural más robusto:** el parser actual
  (`src/utils/nlParser.ts`) es por patrones/regex — funciona con frases
  cercanas a los ejemplos dados. Una versión más flexible necesitaría una
  llamada a un modelo de lenguaje real (ej. API de Anthropic), lo cual
  implica que cada usuario aporte su propia clave (igual que con Twelve
  Data) y asuma el costo asociado — no se implementó por defecto para no
  introducir un costo no solicitado.
- **Tests automatizados más profundos:** el proyecto incluye un smoke test headless
  (`npm run smoke-test`, 12 rutas) y un test funcional de los motores de
  movimientos/alertas/rebalanceo/parser (`npm run test-engines`, 24
  aserciones); el siguiente paso natural es Vitest + React Testing Library
  para probar interacciones de UI (clicks, formularios) directamente.
