import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

const normalizeId = (id) => (id ? id.split("\\").join("/") : id);

const reactVendorPatterns = [
  "node_modules/react",
  "node_modules/react-dom",
  "node_modules/react-router",
  "node_modules/react-router-dom",
  "node_modules/@tanstack/react-query",
];

const iconLibraries = [
  "node_modules/lucide-react",
  "node_modules/react-icons",
  "node_modules/@radix-ui/react-icons",
];

const uiLibraries = [
  "node_modules/clsx",
  "node_modules/tailwind-merge",
  "node_modules/class-variance-authority",
  "node_modules/sonner",
  "node_modules/@radix-ui",
];

const manualChunks = (id) => {
  const normalizedId = normalizeId(id);

  if (!normalizedId) {
    return;
  }

  if (reactVendorPatterns.some((pattern) => normalizedId.includes(pattern))) {
    return "react-vendor";
  }

  if (normalizedId.includes("node_modules/@supabase")) {
    return "supabase";
  }

  if (iconLibraries.some((pattern) => normalizedId.includes(pattern))) {
    return "icons";
  }

  if (uiLibraries.some((pattern) => normalizedId.includes(pattern)) || normalizedId.includes("/src/components/ui")) {
    return "ui";
  }

  if (normalizedId.includes("/src/pages/Admin")) {
    return "admin";
  }

  if (normalizedId.includes("node_modules")) {
    return "vendor";
  }
};

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2020",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks,
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: ({ name }) => {
          if (!name) {
            return "assets/[name]-[hash][extname]";
          }

          if (/(png|jpe?g|svg|gif|webp)$/i.test(name)) {
            return "assets/images/[name]-[hash][extname]";
          }

          if (/(woff2?|eot|ttf|otf)$/i.test(name)) {
            return "assets/fonts/[name]-[hash][extname]";
          }

          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
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
