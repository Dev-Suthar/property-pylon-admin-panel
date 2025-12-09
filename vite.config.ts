import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 3001,
    // Proxy API requests to the Node.js proxy server (development)
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_URL || "http://localhost:3002",
        changeOrigin: true,
        secure: false,
        // Don't rewrite the path - let the proxy server handle it
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // AG Grid
            if (id.includes('ag-grid')) {
              return 'vendor-grid';
            }
            // Charts
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            // Other large vendors
            if (id.includes('axios') || id.includes('date-fns')) {
              return 'vendor-utils';
            }
            // All other node_modules
            return 'vendor-other';
          }
          // Page chunks (for code splitting)
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1]?.split('.')[0];
            if (pageName) {
              return `page-${pageName.toLowerCase()}`;
            }
          }
        },
      },
    },
  },
  base: "/",
});
