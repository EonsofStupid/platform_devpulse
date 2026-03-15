import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	clearScreen: false,
	server: {
		// Port SSOT: [services.network.dev_server] in platform.default.toml
		// xtask sets DEVPULSE_DEV_PORT env var before spawning Vite.
		port: parseInt(process.env.DEVPULSE_DEV_PORT || "1420", 10),
		strictPort: true,
	},
	envPrefix: ["VITE_", "TAURI_"],
});
