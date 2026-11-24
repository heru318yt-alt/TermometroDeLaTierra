import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
          if (id.includes('world-land.json') || id.includes('gistemp.json')) return 'climate-data'
        },
      },
    },
  },
  server: { watch: { ignored: ['**/unity/**'] } },
  test: { environment: 'jsdom', globals: true },
})
