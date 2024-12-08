import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === "development";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: isDevelopment
            ? "http://localhost:8080"
            : "https://your-production-api.com", // Change this to your production API URL
          // : "https://real-estate-api.onrender.com", // example
          changeOrigin: true,
        },
      },
    },
  };
});
