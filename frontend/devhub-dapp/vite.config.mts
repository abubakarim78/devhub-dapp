import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    tailwindcss(),
    base: Process.env.BASE_VITE_PATH || '/DEVHUB_',
  ],
})