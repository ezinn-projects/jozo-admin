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
    // Vite tự động load các biến môi trường từ file .env, .env.local, .env.[mode], .env.[mode].local
    // Các biến môi trường phải bắt đầu bằng VITE_ để được expose cho client
    // Không cần thay đổi gì ở đây, chỉ cần đảm bảo các biến trong .env.develop và .env.production
    // đều bắt đầu bằng VITE_ (như VITE_API_URL và VITE_SOCKET_URL)
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
