/**
 * @file scripts/dev/design/sd/config.ts
 * @package @devpulse/coldlight
 *
 * SD5 config factory.
 *
 * Imports and registers all custom formats.
 * Returns the StyleDictionary config object.
 *
 * Platforms (ColdLight's 3 output targets):
 *   css   → SD5 native css/variables → tokens.css (:root block)
 *   theme → coldlight/tailwind-theme → tailwind.css (@theme block, TW v4)
 *   types → coldlight/types          → types.ts (TypeScript constants)
 */

import { resolve } from "node:path";
import { registerTailwindTheme } from "./formats/tailwind-theme.js";
import { registerTypes } from "./formats/types.js";

type Enums = Record<string, readonly (string | number)[]>;
type Mapping = { namespace: string; prefix: string | null };

interface TokensConfig {
	dtcg: { output: string };
	platforms: {
		css: { output: string };
		theme: { output: string };
		types: { output: string };
	};
	themeMappings: Record<string, Mapping>;
}

export function buildConfig(
	dtcgPath: string,
	tokensConfig: TokensConfig,
	jitiEnums: Enums,
	desktopRoot: string,
) {
	// Register all custom formats before building config
	registerTailwindTheme(tokensConfig.themeMappings);
	registerTypes(jitiEnums);

	return {
		source: [dtcgPath],
		// Tell SD5 our tokens use DTCG format ($value, $type) so it reads
		// $value and puts the transformed result into token.value correctly.
		usesDtcg: true,
		// Auto-expand composite tokens (typography, border, transition)
		// into individual flat tokens. Only object $values are expanded;
		// string $values pass through untouched.
		expand: true,
		platforms: {
			// ── CSS custom properties → :root { --token-name: value; } ────────
			css: {
				transformGroup: "css",
				buildPath: "",
				files: [
					{
						destination: resolve(desktopRoot, tokensConfig.platforms.css.output),
						format: "css/variables",
						options: {
							selector: ":root",
							outputReferences: false,
						},
					},
				],
			},

			// ── Tailwind v4 @theme block ──────────────────────────────────────
			theme: {
				transformGroup: "css",
				buildPath: "",
				files: [
					{
						destination: resolve(desktopRoot, tokensConfig.platforms.theme.output),
						format: "coldlight/tailwind-theme",
					},
				],
			},

			// ── TypeScript constants + union types ────────────────────────────
			types: {
				transformGroup: "css",
				buildPath: "",
				files: [
					{
						destination: resolve(desktopRoot, tokensConfig.platforms.types.output),
						format: "coldlight/types",
					},
				],
			},
		},
	};
}
