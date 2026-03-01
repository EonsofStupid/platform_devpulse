/**
 * @file vitest.config.arch.ts
 * @package @devpulse/coldlight
 *
 * Architecture test config — Node mode (no browser needed).
 * Runs file-system checks for IP boundary enforcement.
 *
 * Usage: pnpm test:arch
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			$lib: resolve(__dirname, "./src/lib"),
		},
	},
	test: {
		include: ["tests/architecture/**/*.test.ts"],
	},
});
