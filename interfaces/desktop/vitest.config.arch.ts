/**
 * @file vitest.config.arch.ts
 * @package @devpulse/coldlight
 *
 * Architecture test config — Node mode (no browser needed).
 * Runs file-system checks: IP boundary enforcement, and the route manifest
 * against the route folders (plan 0008).
 *
 * The route manifest imports every route's `+page.ts` / `+layout.ts`, which
 * import lucide icons (Svelte components): the Svelte plugin compiles them and
 * `lucide-svelte` is transformed by Vite instead of loaded raw by Node.
 *
 * Usage: pnpm test:arch
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [svelte()],
	resolve: {
		alias: {
			$lib: resolve(__dirname, "./src/lib"),
		},
	},
	test: {
		include: ["tests/architecture/**/*.test.ts"],
		server: { deps: { inline: ["lucide-svelte"] } },
	},
});
