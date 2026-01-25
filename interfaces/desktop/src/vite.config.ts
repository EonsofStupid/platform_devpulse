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
  plugins: [
    // 1. ColdLight generates tokens FIRST
    coldlight(),
    // 2. Tailwind (source paths defined in app.css via @source)
    tailwindcss(),
    // 3. Svelte compiles last
    svelte(),
  ],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
});

