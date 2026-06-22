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

- **Precios cripto en vivo** — BTC, ETH y el resto de tus criptomonedas se
  consultan en tiempo real contra la API pública y gratuita de CoinGecko
  directamente desde el navegador (sin backend, sin clave de API). A partir de
  ahí, todo lo que depende de esos valores se recalcula en cascada: el valor
  total y P/L del dashboard, el % de cripto en cada gráfico, el subscore de
  "Gestión de riesgo" y la alerta de concentración cripto (con su severidad
  🟢🟡🟠🔴 y el porcentaje exacto actualizándose solos), y una señal táctica
  📡 en las posiciones marcadas como "reducir"/"vender" que indica si el
  precio repuntó o profundizó su pérdida desde el corte original. Ver la
  sección **"Cómo funcionan los precios en vivo"** más abajo para el alcance
  exacto (qué se actualiza solo y qué sigue siendo manual).
- **Dashboard** — valor total, rentabilidad, distribución por tipo de activo, país,
  moneda; comparación actual vs. objetivo; alertas prioritarias.
- **Análisis** — salud del portafolio (0-100) con desglose ponderado, semáforos de
  exposición temática (tecnología, IA, cripto, mercados emergentes).
- **Activos** — tabla filtrable (cripto / acciones / fondos) con fila expandible:
  tesis, ventajas, riesgos, convicción, riesgo y recomendación por activo.
- **Recomendaciones** — centro agrupado por 🟢 Acumular/Comprar, 🟡 Mantener,
  🟠 Reducir, 🔴 Vender, con motivo, prioridad, impacto esperado y confianza.
- **Alertas** — sistema con severidad (bajo/medio/alto/crítico) y estado persistente
  (pendiente/revisada/resuelta) guardado en `localStorage`.
- **Checklist** — tareas accionables agrupadas, con progreso persistente.
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
npm run build       # genera dist/
npm run preview      # sirve dist/ localmente para verificar el build de producción
npm run smoke-test   # renderiza las 10 rutas en un entorno headless (jsdom) y reporta errores
npm run gen-example  # regenera public/data/portfolio.example.json a partir de src/data/portfolioData.ts
```

Para desplegar a GitHub Pages, Vercel, Netlify o Cloudflare Pages, ver
[`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Estructura de carpetas

```
src/
├── types/portfolio.ts        # Modelo de datos central (única fuente de verdad de tipos)
├── data/portfolioData.ts     # Dataset real, tipado con PortfolioData
├── context/
│   ├── ThemeContext.tsx      # Modo oscuro/claro + persistencia
│   └── PortfolioContext.tsx  # Datos del portafolio + import/export + estado de alertas/checklist
├── hooks/useLocalStorage.ts
├── utils/
│   ├── format.ts             # formatCOP, formatUSD, formatPercent, etc.
│   ├── calculations.ts       # healthScore, simulate() (motor del simulador)
│   └── portfolioMath.ts      # totales, agrupaciones por tipo/país/moneda
├── components/
│   ├── ui/                   # Card, Badge, Gauge, ProgressBar, Semaphore, Tabs, RiesgoTag...
│   ├── layout/                # Sidebar, Topbar, Layout, HorizonRuler
│   └── charts/                # AllocationDonut, ExposureBars, ComparisonBars, SimulatorChart
├── pages/                     # Una página por ruta (Dashboard, Analysis, Assets, ...)
└── App.tsx                    # HashRouter + providers

public/data/portfolio.example.json   # Ejemplo de JSON importable (mismo esquema que PortfolioData)
scripts/
├── gen-example.mts            # Regenera el JSON de ejemplo desde el dataset TS
└── smoke-test.mts             # Prueba de humo headless (jsdom) de las 10 rutas
```

---

## Cómo funcionan los precios en vivo

- **Fuente:** API pública gratuita de [CoinGecko](https://www.coingecko.com/en/api)
  (`/api/v3/simple/price`), consultada directamente desde el navegador de quien
  visita la página — no hay servidor intermedio ni clave de API involucrada.
- **Frecuencia:** se consulta al abrir cualquier página y luego cada 5 minutos
  automáticamente mientras la pestaña esté abierta. También hay un botón de
  actualización manual (ícono ↻) junto al indicador "Precios cripto en vivo".
- **Qué se actualiza solo:** el precio en USD de cada criptomoneda con
  `coingeckoId` configurado en `src/data/portfolioData.ts` (las 16 posiciones
  cripto del dataset). A partir de ahí, todo lo derivado se recalcula
  automáticamente: valor actual y P/L de cada posición, totales y
  distribución del dashboard, el % de cripto en el portafolio, el subscore de
  riesgo, la alerta de concentración cripto, y la señal táctica de las
  posiciones en "reducir"/"vender".
- **Qué NO se actualiza solo:**
  - La TRM (COP/USD) — se mantiene fija en `data.meta.trm` hasta que la
    edites manualmente (sección Datos → Importar, o editando el código).
  - Las acciones y fondos colombianos (TRII, MPF) — no existe una API
    gratuita y abierta equivalente para esos instrumentos, así que sus
    valores siguen siendo manuales.
  - La clasificación 🟢 Comprar/Acumular, 🟡 Mantener, 🟠 Reducir, 🔴 Vender de
    cada activo — es un juicio analítico (redundancia, calidad de tesis,
    convicción), no una regla mecánica de precio, así que no cambia sola solo
    porque el precio se movió un día. Lo que sí ves en vivo es la señal
    táctica 📡 que indica si esa salida ya recomendada tiene mejor o peor
    ventana de ejecución en este momento.
- **Si la consulta falla** (sin internet, límite de uso alcanzado, CoinGecko
  caído): la app no se rompe — simplemente muestra el último valor guardado
  para esa moneda y un aviso "usando últimos valores guardados" en el
  indicador de estado.
- **Cobertura de monedas:** los identificadores de CoinGecko para tokens muy
  pequeños o recientes (ej. SAHARA, CGPT, VIRTUAL) pueden cambiar o no
  resolver siempre. Cada fila de la tabla de Activos muestra un punto verde
  (🟢 en vivo) o gris (○ valor guardado) junto al valor "Actual" para que
  sepas exactamente qué se está actualizando en cada momento.

---

## Sistema de actualización de datos

No hay base de datos ni backend. Hay dos formas de mantener la información al día:

1. **Desde la propia app (recomendado para uso cotidiano):** ve a la sección
   **Datos** → Importar, y sube un JSON con el mismo esquema que
   `public/data/portfolio.example.json`. Se guarda en `localStorage` de tu navegador
   y todas las páginas (dashboard, análisis, alertas, simulador) se recalculan al
   instante. Puedes exportar primero como respaldo.
2. **Editando el código (para cambiar el dato por defecto que ven todos los
   visitantes nuevos):** edita `src/data/portfolioData.ts`, corre
   `npm run build` y vuelve a desplegar.

El tipo `PortfolioData` (en `src/types/portfolio.ts`) es el contrato que cualquier
JSON importado debe cumplir. La validación al importar es mínima a propósito (solo
confirma que existan `assets`, `alertas`, `checklist` y `perfil`) para que puedas
editar montos y textos libremente sin que la app rechace el archivo.

---

## Decisiones de diseño relevantes

- **`HashRouter`** en lugar de `BrowserRouter`: evita el clásico problema de "404 al
  refrescar" en hosting estático (GitHub Pages, y subpaths en general) sin tener que
  configurar reglas de redirección por plataforma.
- **`base: './'`** en `vite.config.ts`: las rutas de los assets son relativas, así que
  el mismo build funciona en la raíz de un dominio (Vercel/Netlify/Cloudflare) o en un
  subpath (`usuario.github.io/repo/`).
- **Sin backend, sin claves de API:** toda la lógica (salud del portafolio,
  simulador, agregaciones) corre en el navegador. Esto hace que el despliegue sea
  trivial y que tus datos financieros nunca salgan de tu propio navegador salvo que
  tú decidas exportarlos.

---

## Mejoras futuras recomendadas

- **Multi-portafolio / multi-perfil:** permitir guardar varios escenarios o
  versiones del portafolio (ej. "actual" vs. "objetivo a 12 meses") y compararlos.
- **Conexión a precios en vivo para acciones y fondos colombianos:** la parte
  cripto ya se actualiza sola (ver sección de arriba); falta una fuente
  equivalente para TRII/MPF. La BVC y los fondos colombianos no tienen una API
  pública gratuita conocida, así que esto probablemente requeriría un scraper
  propio o una suscripción de datos de mercado — y, a diferencia de cripto,
  ya no sería viable 100% client-side sin exponer credenciales, por lo que
  implicaría sumar al menos una función serverless ligera.
- **TRM en vivo:** hoy la tasa de cambio COP/USD es fija (`data.meta.trm`).
  Conectar una API gratuita de tipo de cambio haría que el valor en USD del
  dashboard y la conversión de precios cripto a COP también se actualicen
  solos.
- **Exportar reportes en PDF:** un botón "Exportar informe" que genere un PDF del
  dashboard/análisis para guardar un histórico mensual.
- **Historial de valor del portafolio:** guardar snapshots periódicos en
  `localStorage` (o en un backend ligero) para graficar la evolución real del
  patrimonio mes a mes, no solo la foto actual.
- **Autenticación opcional + sincronización en la nube:** para quienes quieran ver su
  portafolio desde varios dispositivos sin reimportar el JSON manualmente.
- **Cálculo de impuestos colombiano:** módulo que estime la retención de dividendos
  (ETFs US-domiciliados vs. UCITS) y el efecto de la declaración de renta sobre
  ganancias en cripto y acciones internacionales.
- **Code-splitting:** el bundle de producción actual pesa ~675 KB sin comprimir
  (~192 KB con gzip) porque Recharts y Heroicons se cargan todos de una vez; dividir
  por ruta con `React.lazy()` reduciría la carga inicial.
- **Tests automatizados más profundos:** el proyecto incluye un smoke test headless
  (`npm run smoke-test`) que verifica que las 10 rutas rendericen sin errores; el
  siguiente paso natural es añadir Vitest + React Testing Library para probar lógica
  específica (cálculo de salud del portafolio, simulador, import/export de JSON).
