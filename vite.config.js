import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

const normalizeId = (id) => (id ? id.split("\\").join("/") : id);

const manualChunks = (id) => {
  const normalizedId = normalizeId(id);
  if (!normalizedId) return;

  if (normalizedId.includes("node_modules/@supabase")) return "supabase";
  if (normalizedId.includes("lucide-react")) return "icons";
  if (
    normalizedId.includes("clsx") ||
    normalizedId.includes("tailwind-merge") ||
    normalizedId.includes("class-variance-authority") ||
    normalizedId.includes("@radix-ui") ||
    normalizedId.includes("sonner")
  ) {
    return "ui";
  }
  if (normalizedId.includes("/src/pages/Admin")) return "admin";
  if (normalizedId.includes("node_modules")) return "vendor";
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
          if (!name) return "assets/[name]-[hash][extname]";
          if (/(png|jpe?g|svg|gif|webp)$/i.test(name))
            return "assets/images/[name]-[hash][extname]";
          if (/(woff2?|eot|ttf|otf)$/i.test(name))
            return "assets/fonts/[name]-[hash][extname]";
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
