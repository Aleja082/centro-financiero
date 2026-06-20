import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes the build use relative asset paths so it works
// whether deployed at a domain root (Vercel/Netlify/Cloudflare Pages)
// or in a subpath (GitHub Pages project sites).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
})
