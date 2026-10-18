import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // React + Router — core UI framework, always needed
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Framer Motion — heavy animation lib, used on many pages
          'vendor-motion': ['framer-motion'],

          // Recharts — charting, only loaded on Dashboard/Analytics pages
          'vendor-recharts': ['recharts'],

          // Firebase — backend SDK, loaded after auth
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],

          // jsPDF + html2canvas — PDF export, loaded on demand
          'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],


        },
      },
    },
  },
})
