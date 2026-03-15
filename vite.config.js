import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  server: {
    host: "::",
    port: 8080,
    hmr: false,
  },
  plugins: [],
})
