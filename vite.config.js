import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

const vendorRules = [
  { test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/, name: "vendor-react" },
  { test: /[\\/]node_modules[\\/](lucide-react|sonner|clsx)[\\/]/, name: "vendor-ui" },
  { test: /[\\/]node_modules[\\/](date-fns|@tanstack)/, name: "vendor-utility" },
  { test: /[\\/]node_modules[\\/](\@supabase)[\\/]/, name: "vendor-supabase" },
  { test: /[\\/]node_modules[\\/](\@radix-ui)[\\/]/, name: "vendor-radix" },
];

export default defineConfig({
  resolve: {
    alias: [{ find: "@", replacement: resolve(__dirname, "src") }],
  },
  plugins: [react(), tailwindcss()],
  build: {
    manifest: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return undefined;
          const modulePath = id.replace(/\\/g, "/");
          if (!modulePath.includes("node_modules")) return undefined;

          for (const rule of vendorRules) {
            if (rule.test.test(modulePath)) {
              return rule.name;
            }
          }

          return "vendor-others";
        },
      },
    },
  },
});
