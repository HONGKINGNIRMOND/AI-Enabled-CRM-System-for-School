import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  css: {
    postcss: './postcss.config.js'
  },
  build: {
    outDir: 'dist',
    sourcemap: false,           // Disable source maps in production for security
    chunkSizeWarningLimit: 1000, // Suppress warnings for chunks up to 1MB
    rollupOptions: {
      output: {
        // Split vendor libs into a separate chunk for better browser caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        }
      }
    }
  }
})
