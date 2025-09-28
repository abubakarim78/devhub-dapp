import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // It's common to include the react plugin explicitly
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(), // Add the react plugin
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});