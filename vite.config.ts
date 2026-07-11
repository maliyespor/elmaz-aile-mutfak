import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Base path is set for GitHub Pages once the repo name is known (see README/deploy notes).
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Aile Mutfak Programı',
        short_name: 'Mutfak',
        description: 'Aile için buzdolabı, kiler ve alışveriş listesi takip uygulaması',
        lang: 'tr',
        start_url: '.',
        display: 'standalone',
        background_color: '#f5f5f0',
        theme_color: '#2f6f4f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
