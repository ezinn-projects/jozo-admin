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
    hmr: {
      host: "admin.jozo.com.vn",
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
