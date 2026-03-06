import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    host: true, // Needed for Docker container port mapping
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    allowedHosts: ["overfiercely-vandalistic-bobbi.ngrok-free.dev"],
  },
});
