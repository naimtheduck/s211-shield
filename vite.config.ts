import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path" // 👈 ADD THIS

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { // 👈 ADD THIS BLOCK
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})