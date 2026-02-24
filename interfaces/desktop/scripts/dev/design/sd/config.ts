/**
 * @file scripts/dev/design/sd/config.ts
 * @package @devpulse/coldlight
 *
 * SD5 config factory.
 *
 * Imports and registers all custom formats.
 * Returns the StyleDictionary config object.
 *
 * Platforms:
 *   css          → SD5 native css/variables → tokens.css (:root block)
 *   tailwindCss  → coldlight/tailwind-theme → tailwind.css (@theme block)
 *   ts           → coldlight/types          → types.ts (TypeScript enums)
 *   tailwind     → coldlight/tailwind-preset → tailwind.preset.ts (TW v3)
 */

import { resolve } from "node:path";
import { registerTailwindTheme } from "./formats/tailwind-theme.js";
import { registerTypes }         from "./formats/types.js";
import { registerTailwindPreset } from "./formats/tailwind-preset.js";

type Enums = Record<string, readonly (string | number)[]>;
type Mapping = { namespace: string; prefix: string | null };

interface TokensConfig {
	dtcg: { output: string };
	platforms: {
		css: {
			output: string;
			tailwindTheme: {
				enabled: boolean;
				mappings: Record<string, Mapping>;
			};
		};
		tailwindCss: { output: string };
		ts: { output: string };
		tailwind: { output: string };
	};
}

export function buildConfig(
	dtcgPath: string,
	tokensConfig: TokensConfig,
	jitiEnums: Enums,
	desktopRoot: string,
) {
	// Register all custom formats before building config
	registerTailwindTheme(tokensConfig.platforms.css.tailwindTheme.mappings);
	registerTypes(jitiEnums);
	registerTailwindPreset();

	return {
		source: [dtcgPath],
		// Tell SD5 our tokens use DTCG format ($value, $type) so it reads
		// $value and puts the transformed result into token.value correctly.
		usesDtcg: true,
		platforms: {
			// ── SD5 native: css/variables → :root { --token-name: value; } ───────
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

			// ── Custom: @theme { } for Tailwind v4 ────────────────────────────────
			tailwindCss: {
				transformGroup: "css",
				buildPath: "",
				files: [
					{
						destination: resolve(desktopRoot, tokensConfig.platforms.tailwindCss.output),
						format: "coldlight/tailwind-theme",
					},
				],
			},

			// ── Custom: TypeScript enum arrays ─────────────────────────────────────
			ts: {
				transformGroup: "css",
				buildPath: "",
				files: [
					{
						destination: resolve(desktopRoot, tokensConfig.platforms.ts.output),
						format: "coldlight/types",
					},
				],
			},

			// ── Custom: Tailwind v3 preset ─────────────────────────────────────────
			tailwind: {
				transformGroup: "css",
				buildPath: "",
				files: [
					{
						destination: resolve(desktopRoot, tokensConfig.platforms.tailwind.output),
						format: "coldlight/tailwind-preset",
					},
				],
			},
		},
	};
}
