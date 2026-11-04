import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

/** SvelteKit's project options. The Vitest configs run the same plugin with these. */
export const sveltekitOptions = {
	preprocess: vitePreprocess(),
	adapter: adapter({
		pages: "dist",
		assets: "dist",
		fallback: "index.html",
		precompress: false,
		strict: true,
	}),
} satisfies Parameters<typeof sveltekit>[0];

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(sveltekitOptions)],
	clearScreen: false,
	server: {
		// Port SSOT: [services.network.dev_server] in platform.default.toml
		// xtask sets DEVPULSE_DEV_PORT env var before spawning Vite.
		port: parseInt(process.env.DEVPULSE_DEV_PORT || "1420", 10),
		strictPort: true,
	},
	envPrefix: ["VITE_", "TAURI_"],
});
