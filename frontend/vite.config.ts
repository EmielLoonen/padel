import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
  },
  resolve: {
    alias: {
      'react-is': path.resolve(__dirname, '../node_modules/react-is'),
    },
  },
  optimizeDeps: {
    include: ['react-is'],
  },
})
