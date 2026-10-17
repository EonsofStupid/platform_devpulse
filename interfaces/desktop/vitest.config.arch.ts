/**
 * @file vitest.config.arch.ts
 * @package @devpulse/coldlight
 *
 * Architecture test config — Node mode (no browser needed).
 * Runs file-system checks: IP boundary enforcement, and the route manifest
 * against the route folders (plan 0008).
 *
 * The route manifest imports every route's `+page.ts` / `+layout.ts`. Those
 * import lucide icons (Svelte components) and SvelteKit modules (`$app/paths`),
 * so the config runs SvelteKit's own Vite plugin (Svelte compiler, `$lib`,
 * `$app/*`), and `lucide-svelte` is transformed by Vite instead of loaded raw
 * by Node.
 *
 * Usage: pnpm test:arch
 */

import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ["tests/architecture/**/*.test.ts"],
		server: { deps: { inline: ["lucide-svelte"] } },
	},
});
