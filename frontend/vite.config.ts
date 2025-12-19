import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 벤더 라이브러리 분리
          'vendor-react': ['react', 'react-dom'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
    // 경고 임계값을 700KB로 상향 (locale 파일 포함)
    chunkSizeWarningLimit: 700,
  },
})
