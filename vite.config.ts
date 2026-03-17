import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'gsap',
      'gsap/ScrollTrigger',
      'gsap/MotionPathPlugin',
    ],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          if (id.includes('node_modules/gsap')) {
            return 'gsap';
          }
          if (id.includes('@fortawesome/fontawesome-free')) {
            return 'fa';
          }
          if (id.includes('@fortawesome/react-fontawesome') || 
              id.includes('@fortawesome/free-solid-svg-icons') ||
              id.includes('@fortawesome/free-brands-svg-icons')) {
            return 'fa_svg';
          }
        },
      },
    },
  },
})