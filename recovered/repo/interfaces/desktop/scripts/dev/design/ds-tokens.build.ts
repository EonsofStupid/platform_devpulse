/**
 * @file ds-tokens-sd5.ts
 * @package @devpulse/coldlight
 *
 * Style Dictionary v5 build orchestrator.
 * Reads pipeline configuration from coldlight.config.ts — does NOT hardcode
 * paths, prefixes, or output formats. The config is the SSOT.
 *
 * Uses jiti for importing SvelteKit codebase (.js → .ts resolution).
 * Node v24 native TS handles the script itself.
 *
 * Pipeline:
 *   1. Read coldlightConfig.tokens for all settings
 *   2. Import SSOT source files (tokens.ts, semantic.ts, components.ts)
 *   3. Generate DTCG tokens.json interchange
 *   4. Run SD5 with custom formats → tokens.css, types.ts, tailwind.preset.ts
 *
 * Usage: pnpm ds:tokens:build:sd5
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import StyleDictionary from "style-dictionary";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = resolve(__dirname, "../../..");

// jiti handles .js → .ts resolution for SvelteKit-style imports
const jiti = createJiti(import.meta.url, {
	moduleCache: false,
	extensions: [".ts", ".js"],
});

// ---------------------------------------------------------------------------
// 1. Load ColdLight configuration via jiti
// ---------------------------------------------------------------------------
const configPath = resolve(DESKTOP_ROOT, "src/lib/design/coldlight.config.ts");
const configMod = await jiti.import(configPath) as Record<string, unknown>;
const config = (configMod.coldlightConfig ?? configMod.default) as {
	tokens: {
		sdVersion: number;
		sources: { globals: string; semantic: string; components: string };
		dtcg: { output: string; formatVersion: string };
		platforms: {
			css: { enabled: boolean; output: string; prefixes: Record<string, string>; tailwindTheme: { enabled: boolean } };
			ts: { enabled: boolean; output: string };
			tailwind: { enabled: boolean; output: string };
		};
	};
};

if (!config?.tokens) {
	console.error("ERROR: coldlightConfig.tokens is missing. Cannot run SD5 pipeline.");
	process.exit(1);
}

const tokensConfig = config.tokens;

// ---------------------------------------------------------------------------
// 2. Import SSOT source files via jiti
// ---------------------------------------------------------------------------
interface TokensModule {
	hue: Record<string, string>;
	color: Record<string, Record<string, string>>;
	glass: Record<string, string>;
	matte: Record<string, string>;
	text: Record<string, string>;
	space: Record<string, string>;
	radius: Record<string, string>;
	blur: Record<string, string>;
	glow: Record<string, string>;
	shadow: Record<string, string>;
	bevel: Record<string, string>;
	z: Record<string, string>;
	duration: Record<string, string>;
	ease: Record<string, string>;
	textSize: Record<string, string>;
	padding: Record<string, string>;
	signal: Record<string, string>;
	font: Record<string, string>;
	animation: Record<string, string>;
	enums: Record<string, readonly (string | number)[]>;
}

interface SemanticModule {
	semantic: Record<string, Record<string, string>>;
}

interface ComponentsModule {
	components: Record<string, Record<string, string>>;
}

const tokens = await jiti.import(
	resolve(DESKTOP_ROOT, tokensConfig.sources.globals),
) as TokensModule;
const semanticMod = await jiti.import(
	resolve(DESKTOP_ROOT, tokensConfig.sources.semantic),
) as SemanticModule;
const componentsMod = await jiti.import(
	resolve(DESKTOP_ROOT, tokensConfig.sources.components),
) as ComponentsModule;

// ---------------------------------------------------------------------------
// 3. Generate DTCG tokens.json (TS SSOT → JSON interchange)
// ---------------------------------------------------------------------------
function buildDtcg(): Record<string, unknown> {
	const dtcg: Record<string, unknown> = {
		$schema: "https://design-tokens.github.io/community-group/format/",
		$description:
			"ColdLight Design System — DTCG Token Interchange. AUTO-GENERATED from tokens.ts.",
	};

	function addGroup(
		name: string,
		obj: Record<string, unknown>,
		type: string,
		nested = false,
	): void {
		const group: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (typeof value === "object" && value !== null && !nested) {
				const subGroup: Record<string, unknown> = {};
				for (const [subKey, subValue] of Object.entries(
					value as Record<string, string>,
				)) {
					subGroup[subKey] = { $type: type, $value: subValue };
				}
				group[key] = subGroup;
			} else {
				group[key] = { $type: type, $value: value };
			}
		}
		dtcg[name] = group;
	}

	addGroup("hue", tokens.hue, "number");
	addGroup("color", tokens.color, "color");
	addGroup("glass", tokens.glass, "color");
	addGroup("matte", tokens.matte, "color");
	addGroup("text", tokens.text, "color");
	addGroup("space", tokens.space, "dimension");
	addGroup("radius", tokens.radius, "dimension");
	addGroup("blur", tokens.blur, "dimension");
	addGroup("glow", tokens.glow, "shadow");
	addGroup("shadow", tokens.shadow, "shadow");
	addGroup("bevel", tokens.bevel, "shadow");
	addGroup("z", tokens.z, "number");
	addGroup("duration", tokens.duration, "duration");
	addGroup("ease", tokens.ease, "cubicBezier");
	addGroup("textSize", tokens.textSize, "dimension");
	addGroup("padding", tokens.padding, "dimension");
	addGroup("signal", tokens.signal, "color");
	addGroup("font", tokens.font, "fontFamily");
	addGroup("animation", tokens.animation, "other");

	// Semantic (Tier 2)
	const semantic: Record<string, Record<string, unknown>> = {};
	for (const [category, entries] of Object.entries(semanticMod.semantic)) {
		const catGroup: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(entries)) {
			catGroup[key] = { $type: "other", $value: value };
		}
		semantic[category] = catGroup;
	}
	dtcg.semantic = semantic;

	// Component (Tier 3)
	const component: Record<string, Record<string, unknown>> = {};
	for (const [kind, entries] of Object.entries(componentsMod.components)) {
		const kindGroup: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(entries)) {
			kindGroup[key] = { $type: "other", $value: value };
		}
		component[kind] = kindGroup;
	}
	dtcg.component = component;

	return dtcg;
}

const dtcg = buildDtcg();
const dtcgPath = resolve(DESKTOP_ROOT, tokensConfig.dtcg.output);
writeFileSync(dtcgPath, `${JSON.stringify(dtcg, null, "\t")}\n`, "utf-8");
console.log(`[SD5] Generated DTCG: ${tokensConfig.dtcg.output}`);

// ---------------------------------------------------------------------------
// 4. Register SD5 custom formats
// ---------------------------------------------------------------------------
const prefixes = tokensConfig.platforms.css.prefixes;

StyleDictionary.registerFormat({
	name: "coldlight/css",
	format: () => {
		const lines: string[] = [
			"/**",
			" * AUTO-GENERATED — DO NOT EDIT",
			" * Generated from tokens.ts via pnpm ds:tokens:build:sd5",
			" */",
			"",
			":root {",
		];

		function addSection(
			comment: string,
			prefix: string,
			obj: Record<string, unknown>,
			nested = false,
		): void {
			lines.push(`\t/* ${comment} */`);
			for (const [key, value] of Object.entries(obj)) {
				if (typeof value === "object" && value !== null && !nested) {
					for (const [subKey, subValue] of Object.entries(
						value as Record<string, string>,
					)) {
						lines.push(`\t--${prefix}-${key}-${subKey}: ${subValue};`);
					}
				} else {
					lines.push(`\t--${prefix}-${key}: ${value};`);
				}
			}
			lines.push("");
		}

		addSection("Hues", prefixes.hue, tokens.hue);
		addSection("Colors", prefixes.color, tokens.color);
		addSection("Glass", prefixes.glass, tokens.glass);
		addSection("Matte", prefixes.matte, tokens.matte);
		addSection("Text", prefixes.text, tokens.text);
		addSection("Spacing", prefixes.space, tokens.space);
		addSection("Radius", prefixes.radius, tokens.radius);
		addSection("Blur", prefixes.blur, tokens.blur);
		addSection("Glow", prefixes.glow, tokens.glow);
		addSection("Shadow", prefixes.shadow, tokens.shadow);
		addSection("Bevel", prefixes.bevel, tokens.bevel);
		addSection("Z-Index", prefixes.z, tokens.z);
		addSection("Duration", prefixes.duration, tokens.duration);
		addSection("Easing", prefixes.ease, tokens.ease);
		addSection("Text Size", prefixes.textSize, tokens.textSize);
		addSection("Padding", prefixes.padding, tokens.padding);
		addSection("Signal", prefixes.signal, tokens.signal);
		addSection("Font", prefixes.font, tokens.font);
		addSection("Animation", prefixes.animation, tokens.animation);

		// Tier 2: Semantic tokens
		lines.push("\t/* --- Tier 2: Semantic Tokens --- */");
		for (const [category, entries] of Object.entries(semanticMod.semantic)) {
			for (const [key, value] of Object.entries(entries)) {
				lines.push(`\t--${category}-${key}: ${value};`);
			}
		}
		lines.push("");

		// Tier 3: Component tokens
		lines.push("\t/* --- Tier 3: Component Tokens --- */");
		for (const [kind, entries] of Object.entries(componentsMod.components)) {
			for (const [key, value] of Object.entries(entries)) {
				lines.push(`\t--${kind}-${key}: ${value};`);
			}
		}
		lines.push("");

		lines.push("}");
		lines.push("");

		// ---------------------------------------------------------------
		// @theme block for Tailwind v4
		// ---------------------------------------------------------------
		const varMap = new Map<string, string>();
		for (const [k, v] of Object.entries(tokens.glass))
			varMap.set(`--glass-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.matte))
			varMap.set(`--matte-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.text))
			varMap.set(`--text-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.shadow))
			varMap.set(`--shadow-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.space))
			varMap.set(`--space-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.radius))
			varMap.set(`--radius-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.blur))
			varMap.set(`--blur-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.glow))
			varMap.set(`--glow-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.bevel))
			varMap.set(`--bevel-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.duration))
			varMap.set(`--duration-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.ease))
			varMap.set(`--ease-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.signal))
			varMap.set(`--signal-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.font))
			varMap.set(`--font-${k}`, String(v));
		for (const [k, v] of Object.entries(tokens.animation))
			varMap.set(`--animation-${k}`, String(v));
		for (const [name, scale] of Object.entries(tokens.color)) {
			for (const [step, val] of Object.entries(scale)) {
				varMap.set(`--color-${name}-${step}`, String(val));
			}
		}

		function resolveVars(value: string): string {
			let resolved = value.replace(
				/var\((--[a-zA-Z0-9-]+)\)/g,
				(_full: string, varName: string) =>
					varMap.get(varName) ?? `var(${varName})`,
			);
			resolved = resolved.replace(
				/oklch\(from\s+oklch\(([^)]+)\)\s+l\s+c\s+h\s*\/\s*([0-9.]+)\)/g,
				(_full: string, components: string, alpha: string) =>
					`oklch(${components} / ${alpha})`,
			);
			return resolved;
		}

		lines.push("@theme {");

		lines.push("\t/* Surface materials */");
		for (const [key, val] of Object.entries(tokens.glass))
			lines.push(`\t--color-glass-${key}: ${val};`);
		for (const [key, val] of Object.entries(tokens.matte))
			lines.push(`\t--color-matte-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Color scales */");
		for (const [name, scale] of Object.entries(tokens.color))
			for (const [step, val] of Object.entries(scale))
				lines.push(`\t--color-${name}-${step}: ${val};`);
		lines.push("");

		lines.push("\t/* Text colors */");
		for (const [key, val] of Object.entries(tokens.text))
			lines.push(`\t--color-text-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Radius */");
		for (const [key, val] of Object.entries(tokens.radius))
			lines.push(`\t--radius-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Shadows */");
		for (const [key, val] of Object.entries(tokens.shadow))
			lines.push(`\t--shadow-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Glows */");
		for (const [key, val] of Object.entries(tokens.glow))
			lines.push(`\t--shadow-glow-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Bevels */");
		for (const [key, val] of Object.entries(tokens.bevel))
			lines.push(`\t--shadow-bevel-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Spacing */");
		for (const [key, val] of Object.entries(tokens.space))
			lines.push(`\t--spacing-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Text sizes */");
		for (const [key, val] of Object.entries(tokens.textSize))
			lines.push(`\t--font-size-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Blur */");
		for (const [key, val] of Object.entries(tokens.blur))
			lines.push(`\t--blur-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Duration */");
		for (const [key, val] of Object.entries(tokens.duration))
			lines.push(`\t--transition-duration-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Easing */");
		for (const [key, val] of Object.entries(tokens.ease))
			lines.push(`\t--transition-timing-function-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Signal colors */");
		for (const [key, val] of Object.entries(tokens.signal))
			lines.push(`\t--color-signal-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Fonts */");
		for (const [key, val] of Object.entries(tokens.font))
			lines.push(`\t--font-${key}: ${val};`);
		lines.push("");

		lines.push("\t/* Animation */");
		for (const [key, val] of Object.entries(tokens.animation))
			lines.push(`\t--animate-${key}: ${val};`);
		lines.push("");

		// Tier 2 semantic — resolved to literal values for @theme
		lines.push("\t/* Tier 2: Semantic */");
		const semanticSurfaces = semanticMod.semantic.surface;
		if (semanticSurfaces)
			for (const [key, val] of Object.entries(semanticSurfaces))
				lines.push(`\t--color-surface-${key}: ${resolveVars(val)};`);
		const semanticBorders = semanticMod.semantic.border;
		if (semanticBorders)
			for (const [key, val] of Object.entries(semanticBorders))
				lines.push(`\t--color-border-${key}: ${resolveVars(val)};`);
		const semanticDepths = semanticMod.semantic.depth;
		if (semanticDepths)
			for (const [key, val] of Object.entries(semanticDepths))
				lines.push(`\t--shadow-depth-${key}: ${resolveVars(val)};`);

		lines.push("}");
		return `${lines.join("\n")}\n`;
	},
});

StyleDictionary.registerFormat({
	name: "coldlight/types",
	format: () => {
		const lines: string[] = [
			"/**",
			" * @file types.ts",
			" * @package @devpulse/coldlight",
			" *",
			" * AUTO-GENERATED - DO NOT EDIT",
			" * Generated by ds-tokens-sd5.ts from tokens.ts",
			" */",
			"",
		];

		for (const [name, values] of Object.entries(tokens.enums)) {
			const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
			const formatted = JSON.stringify([...values]);
			lines.push(`export const ${pascalName}Tokens = ${formatted} as const;`);
			lines.push(
				`export type ${pascalName}Token = (typeof ${pascalName}Tokens)[number];`,
			);
			lines.push("");
		}

		lines.push("export const TokenArrays = {");
		for (const name of Object.keys(tokens.enums)) {
			const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
			lines.push(`\t${name}: ${pascalName}Tokens,`);
		}
		lines.push("} as const;");
		return `${lines.join("\n")}\n`;
	},
});

StyleDictionary.registerFormat({
	name: "coldlight/tailwind-preset",
	format: () => {
		const lines: string[] = [
			"/**",
			" * AUTO-GENERATED — DO NOT EDIT",
			" * Generated from tokens.ts via pnpm ds:tokens:build:sd5",
			" */",
			"",
			"export const dpPreset = {",
			"\ttheme: {",
			"\t\textend: {",
		];

		lines.push("\t\t\tcolors: {");
		for (const [name, scale] of Object.entries(tokens.color)) {
			lines.push(`\t\t\t\t"${name}": {`);
			for (const [step] of Object.entries(scale))
				lines.push(`\t\t\t\t\t${step}: "var(--color-${name}-${step})",`);
			lines.push("\t\t\t\t},");
		}
		lines.push("\t\t\t},");

		lines.push("\t\t\tspacing: {");
		for (const [key] of Object.entries(tokens.space))
			lines.push(`\t\t\t\t"${key}": "var(--space-${key})",`);
		lines.push("\t\t\t},");

		lines.push("\t\t\tborderRadius: {");
		for (const [key] of Object.entries(tokens.radius))
			lines.push(`\t\t\t\t"${key}": "var(--radius-${key})",`);
		lines.push("\t\t\t},");

		lines.push("\t\t\tboxShadow: {");
		for (const [key] of Object.entries(tokens.glow))
			lines.push(`\t\t\t\t"glow-${key}": "var(--glow-${key})",`);
		for (const [key] of Object.entries(tokens.shadow))
			lines.push(`\t\t\t\t"${key}": "var(--shadow-${key})",`);
		lines.push("\t\t\t},");

		lines.push("\t\t\tzIndex: {");
		for (const [key] of Object.entries(tokens.z))
			lines.push(`\t\t\t\t"${key}": "var(--z-${key})",`);
		lines.push("\t\t\t},");

		lines.push("\t\t},");
		lines.push("\t},");
		lines.push("};");
		return `${lines.join("\n")}\n`;
	},
});

// ---------------------------------------------------------------------------
// 5. Run SD5 pipeline
// ---------------------------------------------------------------------------
const sd = new StyleDictionary({
	source: [resolve(DESKTOP_ROOT, tokensConfig.dtcg.output)],
	platforms: {
		css: {
			buildPath: "",
			files: [{
				destination: resolve(DESKTOP_ROOT, tokensConfig.platforms.css.output),
				format: "coldlight/css",
			}],
		},
		ts: {
			buildPath: "",
			files: [{
				destination: resolve(DESKTOP_ROOT, tokensConfig.platforms.ts.output),
				format: "coldlight/types",
			}],
		},
		tailwind: {
			buildPath: "",
			files: [{
				destination: resolve(DESKTOP_ROOT, tokensConfig.platforms.tailwind.output),
				format: "coldlight/tailwind-preset",
			}],
		},
	},
});

await sd.buildAllPlatforms();

console.log(`[SD5] Pipeline configured via: coldlight.config.ts → tokens`);
console.log(`[SD5] Generated CSS:  ${tokensConfig.platforms.css.output}`);
console.log(`[SD5] Generated TS:   ${tokensConfig.platforms.ts.output}`);
console.log(`[SD5] Generated TW:   ${tokensConfig.platforms.tailwind.output}`);
console.log(`[SD5] Generated DTCG: ${tokensConfig.dtcg.output}`);
