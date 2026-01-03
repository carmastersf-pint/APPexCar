import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
                name: 'Car Masters App',
                short_name: 'CarMasters',
                description: 'Gestor de Taller y Catálogo Digital',
                theme_color: '#09090b',
                background_color: '#09090b',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                  {
                    src: 'icon.svg',
                    sizes: 'any',
                    type: 'image/svg+xml',
                    purpose: 'any maskable'
                  }
                ]
              }
    })
  ],
  server: {
    host: true
  },
  build: {
    sourcemap: false
  }
})
