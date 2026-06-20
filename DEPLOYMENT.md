# Guía de despliegue

Esta app es un sitio estático generado por Vite (HTML + CSS + JS puro, sin backend).
El comando `npm run build` genera la carpeta `dist/` — eso es lo único que cualquier
servicio de hosting necesita.

Antes de cualquier despliegue, prueba localmente:

```bash
npm install
npm run build
npm run preview   # sirve dist/ en http://localhost:4173 para verificar
```

---

## 1. GitHub Pages

### Opción A — Automática con GitHub Actions (recomendada)

El proyecto ya incluye `.github/workflows/deploy.yml`, que compila y publica
automáticamente en cada `push` a la rama `main`.

1. Crea un repositorio en GitHub y sube este proyecto:
   ```bash
   git init
   git add .
   git commit -m "Centro de control financiero"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git push -u origin main
   ```
2. En GitHub: **Settings → Pages → Source → GitHub Actions**.
3. Espera a que termine el workflow (pestaña **Actions**). Tu sitio quedará en
   `https://TU-USUARIO.github.io/TU-REPO/`.

### Opción B — Manual con el paquete `gh-pages`

```bash
npm run deploy
```

Esto compila y publica el contenido de `dist/` en la rama `gh-pages`. Luego activa
**Settings → Pages → Source → Deploy from a branch → gh-pages**.

> `vite.config.ts` ya usa `base: './'` (rutas relativas), así que funciona tanto en
> la raíz de un dominio como en un subpath tipo `usuario.github.io/repo/`. La app usa
> `HashRouter`, por lo que no necesitas configurar reglas de redirección para rutas
> internas (`/#/activos`, `/#/simulador`, etc. funcionan sin configuración extra).

---

## 2. Vercel

**Opción rápida:** instala la CLI y ejecuta `vercel` en la carpeta del proyecto, o
conecta el repositorio desde [vercel.com/new](https://vercel.com/new).

Configuración (Vercel detecta Vite automáticamente, pero por si acaso):

| Campo | Valor |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

No se necesitan variables de entorno — todos los datos viven en
`src/data/portfolioData.ts` y en `localStorage` del navegador.

---

## 3. Netlify

**Opción rápida:** arrastra la carpeta `dist/` (tras `npm run build`) a
[app.netlify.com/drop](https://app.netlify.com/drop), o conecta el repositorio.

Configuración para despliegue continuo (`netlify.toml`, opcional — puedes crear este
archivo en la raíz si prefieres no configurarlo desde la UI):

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

---

## 4. Cloudflare Pages

1. Ve a **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
2. Selecciona el repositorio.
3. Configuración de build:

| Campo | Valor |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |

---

## Notas comunes a las 4 plataformas

- **Sin backend, sin variables de entorno.** Todo el estado vive en el navegador
  (`localStorage`) y en el archivo de datos incluido en el bundle.
- **Actualizar datos sin redesplegar:** usa la sección **Datos** dentro de la propia
  app para importar un nuevo JSON — se guarda en `localStorage` del visitante, no
  requiere un nuevo build. Si quieres que el dato por defecto cambie para *todos* los
  visitantes nuevos, edita `src/data/portfolioData.ts` y vuelve a desplegar.
- **Dominio propio:** las cuatro plataformas permiten conectar un dominio propio desde
  su panel — no afecta nada del código de esta app.
- **HTTPS:** las cuatro plataformas lo activan automáticamente.
