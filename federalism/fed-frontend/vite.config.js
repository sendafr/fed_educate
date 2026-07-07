import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Ensure babel-plugin-react-compiler is installed: npm install babel-plugin-react-compiler
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    })
  ],
  
  // ✅ CRITICAL: 
  // Use '/' if your Vercel URL is https://project.vercel.app
  // Use '/subpath/' if your Vercel URL is https://project.vercel.app/subpath
  base: '/', 

  server: {
    port: 5173,
    proxy: {
      // Local development proxy to your Koyeb backend
      '/api': {
        target: 'http://localhost:8000', 
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Ensure output is 'dist' (Vercel default)
    outDir: 'dist',
    sourcemap: false, // Reduce build size for production
  },
})