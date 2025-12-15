import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // importante en Vercel
  build: {
    outDir: "dist",
  },
  optimizeDeps: {
    include: ["peerjs"],
  },
});

