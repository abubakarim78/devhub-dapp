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
  build: {
    // Increase chunk size warning limit to 1MB (from default 500KB)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Automatic chunk splitting based on size and dependencies
        manualChunks(id) {
          // Vendor chunks for large libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // UI libraries
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // Mysten/Sui libraries
            if (id.includes('@mysten') || id.includes('sui')) {
              return 'vendor-sui';
            }
            // Other vendor libraries
            return 'vendor';
          }
        },
      },
    },
    // Optimize dependencies
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // Optimize dev server
  server: {
    port: 5173,
    host: true, // Allow external connections
  },
});