import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/v1': {
        target: 'https://api.siliconflow.cn',
        changeOrigin: true,
        secure: true,
        headers: {
          'Origin': 'https://api.siliconflow.cn'
        }
      }
    }
  }
}) 