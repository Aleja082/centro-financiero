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
- **Conexión a precios en vivo:** integrar una API de cotizaciones (cripto y
  acciones) para que `actualCOP` se actualice automáticamente en vez de editarse a
  mano — implicaría pasar de "app estática" a tener al menos una función serverless
  ligera para no expurar claves de API en el cliente.
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
