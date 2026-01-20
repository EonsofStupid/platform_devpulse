import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { coldlight } from "./lib/design/vite-plugin";

export default defineConfig({
  resolve: {
    alias: {
      $lib: path.resolve("./lib"),
    },
  },
  plugins: [coldlight(), tailwindcss(), svelte()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
});

