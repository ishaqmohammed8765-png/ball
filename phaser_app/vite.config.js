import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: "0.0.0.0",
    open: false
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    // Phaser is a large runtime; keep warning useful without failing every build.
    chunkSizeWarningLimit: 1700,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"]
        }
      }
    }
  }
});
