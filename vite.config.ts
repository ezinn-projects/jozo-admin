import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  define: {
    "process.env": process.env,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("@radix-ui")) {
            return "vendor-radix";
          }

          if (id.includes("@tanstack")) {
            return "vendor-tanstack";
          }

          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }

          if (id.includes("date-fns") || id.includes("dayjs")) {
            return "vendor-date";
          }

          return "vendor";
        },
      },
    },
  },
  server: {
    // cho phép truy cập từ subdomain cụ thể
    host: "0.0.0.0",
    port: 3002,
    strictPort: true,
    proxy: {
      "/socket.io": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 3002,
    // nếu cần HTTPS, bật phần này:
    // https: {
    //   key: fs.readFileSync("./certs/localhost.key"),
    //   cert: fs.readFileSync("./certs/localhost.crt"),
    // }
  },
});
