import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  resolve: {
    alias: [{ find: "@", replacement: resolve(__dirname, "src") }],
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Target modern browsers for smaller bundles
    target: "es2020",
    // Enable minification
    minify: "esbuild",
    // Generate source maps for production debugging (optional, remove for smaller builds)
    sourcemap: false,
    // Optimize CSS
    cssMinify: true,
    // Chunk splitting configuration
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal caching
        manualChunks: (id) => {
          // React core
          if (id.includes("node_modules/react-dom")) {
            return "react-dom";
          }
          if (id.includes("node_modules/react/")) {
            return "react-vendor";
          }
          // React Router
          if (id.includes("node_modules/react-router") || id.includes("node_modules/@remix-run")) {
            return "router";
          }
          // Supabase
          if (id.includes("node_modules/@supabase")) {
            return "supabase";
          }
          // TanStack Query
          if (id.includes("node_modules/@tanstack")) {
            return "query";
          }
          // Radix UI - split into separate chunk
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-ui";
          }
          // Date utilities
          if (id.includes("node_modules/date-fns")) {
            return "date-utils";
          }
          // UI utilities (small, can be bundled together)
          if (
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge") ||
            id.includes("node_modules/class-variance-authority")
          ) {
            return "ui-utils";
          }
          // Lucide icons
          if (id.includes("node_modules/lucide-react")) {
            return "icons";
          }
          // Sonner toast
          if (id.includes("node_modules/sonner")) {
            return "sonner";
          }
        },
        // Asset file naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
    ],
  },
});
