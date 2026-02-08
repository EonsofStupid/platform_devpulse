/**
 * @file ds-tokens-build.ts
 * Token generation script — reads tokens.ts and generates:
 * - tokens.css (CSS custom properties)
 * - types.ts (TypeScript types + runtime arrays)
 * - tailwind.preset.ts (Tailwind theme mapping)
 *
 * Usage: pnpm ds:tokens:build
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = resolve(__dirname, "../../../src/lib/design/tokens");

/**
 * Shape of the tokens module.
 * Typed here because dynamic import crosses the scripts/ rootDir boundary.
 * Must match the named exports in src/lib/design/tokens/tokens.ts.
 */
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

// Dynamic import required — tokens.ts is outside scripts/ rootDir boundary.
// pathToFileURL handles Windows drive letter colon in absolute paths.
const tokens = (await import(pathToFileURL(resolve(TOKENS_DIR, "tokens.ts")).href)) as TokensModule;
const semanticMod = (await import(
	pathToFileURL(resolve(TOKENS_DIR, "semantic.ts")).href
)) as SemanticModule;
const componentsMod = (await import(
	pathToFileURL(resolve(TOKENS_DIR, "components.ts")).href
)) as ComponentsModule;

// ---------------------------------------------------------------------------
// Generate tokens.css
// ---------------------------------------------------------------------------
function generateCss(): string {
	const lines: string[] = [
		"/**",
		" * AUTO-GENERATED — DO NOT EDIT",
		" * Generated from tokens.ts via pnpm ds:tokens:build",
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
				// Nested object (color scales)
				for (const [subKey, subValue] of Object.entries(value as Record<string, string>)) {
					lines.push(`\t--${prefix}-${key}-${subKey}: ${subValue};`);
				}
			} else {
				lines.push(`\t--${prefix}-${key}: ${value};`);
			}
		}
		lines.push("");
	}

	addSection("Hues", "hue", tokens.hue);
	addSection("Colors", "color", tokens.color);
	addSection("Glass", "glass", tokens.glass);
	addSection("Matte", "matte", tokens.matte);
	addSection("Text", "text", tokens.text);
	addSection("Spacing", "space", tokens.space);
	addSection("Radius", "radius", tokens.radius);
	addSection("Blur", "blur", tokens.blur);
	addSection("Glow", "glow", tokens.glow);
	addSection("Shadow", "shadow", tokens.shadow);
	addSection("Bevel", "bevel", tokens.bevel);
	addSection("Z-Index", "z", tokens.z);
	addSection("Duration", "duration", tokens.duration);
	addSection("Easing", "ease", tokens.ease);
	addSection("Text Size", "text-size", tokens.textSize);
	addSection("Padding", "padding", tokens.padding);
	addSection("Signal", "signal", tokens.signal);
	addSection("Font", "font", tokens.font);
	addSection("Animation", "animation", tokens.animation);

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

	// ---------------------------------------------------------------------------
	// Tailwind v4 @theme block — raw values required (resolved at build time)
	// ---------------------------------------------------------------------------

	// Build var→value map so semantic tokens can resolve references
	const varMap = new Map<string, string>();
	for (const [k, v] of Object.entries(tokens.glass)) varMap.set(`--glass-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.matte)) varMap.set(`--matte-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.text)) varMap.set(`--text-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.shadow)) varMap.set(`--shadow-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.space)) varMap.set(`--space-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.radius)) varMap.set(`--radius-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.blur)) varMap.set(`--blur-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.glow)) varMap.set(`--glow-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.bevel)) varMap.set(`--bevel-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.duration)) varMap.set(`--duration-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.ease)) varMap.set(`--ease-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.signal)) varMap.set(`--signal-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.font)) varMap.set(`--font-${k}`, String(v));
	for (const [k, v] of Object.entries(tokens.animation)) varMap.set(`--animation-${k}`, String(v));
	for (const [name, scale] of Object.entries(tokens.color)) {
		for (const [step, val] of Object.entries(scale)) {
			varMap.set(`--color-${name}-${step}`, String(val));
		}
	}

	function resolveVars(value: string): string {
		let resolved = value.replace(
			/var\((--[a-zA-Z0-9-]+)\)/g,
			(_full: string, varName: string) => varMap.get(varName) ?? `var(${varName})`,
		);
		// Simplify oklch(from oklch(L C H) l c h / A) → oklch(L C H / A)
		resolved = resolved.replace(
			/oklch\(from\s+oklch\(([^)]+)\)\s+l\s+c\s+h\s*\/\s*([0-9.]+)\)/g,
			(_full: string, components: string, alpha: string) => `oklch(${components} / ${alpha})`,
		);
		return resolved;
	}

	lines.push("@theme {");

	// Surface materials → bg-glass-*, bg-matte-*
	lines.push("\t/* Surface materials */");
	for (const [key, val] of Object.entries(tokens.glass)) {
		lines.push(`\t--color-glass-${key}: ${val};`);
	}
	for (const [key, val] of Object.entries(tokens.matte)) {
		lines.push(`\t--color-matte-${key}: ${val};`);
	}
	lines.push("");

	// Color scales → bg-teal-500, text-purple-300, etc.
	lines.push("\t/* Color scales */");
	for (const [name, scale] of Object.entries(tokens.color)) {
		for (const [step, val] of Object.entries(scale)) {
			lines.push(`\t--color-${name}-${step}: ${val};`);
		}
	}
	lines.push("");

	// Text colors → text-primary, text-muted, etc.
	lines.push("\t/* Text colors */");
	for (const [key, val] of Object.entries(tokens.text)) {
		lines.push(`\t--color-text-${key}: ${val};`);
	}
	lines.push("");

	// Radius → rounded-lg, rounded-xl, etc.
	lines.push("\t/* Radius */");
	for (const [key, val] of Object.entries(tokens.radius)) {
		lines.push(`\t--radius-${key}: ${val};`);
	}
	lines.push("");

	// Shadows → shadow-z1, shadow-z2, etc.
	lines.push("\t/* Shadows */");
	for (const [key, val] of Object.entries(tokens.shadow)) {
		lines.push(`\t--shadow-${key}: ${val};`);
	}
	lines.push("");

	// Glows → shadow-glow-teal, etc.
	lines.push("\t/* Glows */");
	for (const [key, val] of Object.entries(tokens.glow)) {
		lines.push(`\t--shadow-glow-${key}: ${val};`);
	}
	lines.push("");

	// Bevels → shadow-bevel-subtle, etc.
	lines.push("\t/* Bevels */");
	for (const [key, val] of Object.entries(tokens.bevel)) {
		lines.push(`\t--shadow-bevel-${key}: ${val};`);
	}
	lines.push("");

	// Spacing → p-4, m-2, gap-3, etc.
	lines.push("\t/* Spacing */");
	for (const [key, val] of Object.entries(tokens.space)) {
		lines.push(`\t--spacing-${key}: ${val};`);
	}
	lines.push("");

	// Text sizes → text-sm, text-base, etc.
	lines.push("\t/* Text sizes */");
	for (const [key, val] of Object.entries(tokens.textSize)) {
		lines.push(`\t--font-size-${key}: ${val};`);
	}
	lines.push("");

	// Blur → blur-md, etc.
	lines.push("\t/* Blur */");
	for (const [key, val] of Object.entries(tokens.blur)) {
		lines.push(`\t--blur-${key}: ${val};`);
	}
	lines.push("");

	// Duration → duration-fast, etc.
	lines.push("\t/* Duration */");
	for (const [key, val] of Object.entries(tokens.duration)) {
		lines.push(`\t--transition-duration-${key}: ${val};`);
	}
	lines.push("");

	// Easing → ease-spring, etc.
	lines.push("\t/* Easing */");
	for (const [key, val] of Object.entries(tokens.ease)) {
		lines.push(`\t--transition-timing-function-${key}: ${val};`);
	}
	lines.push("");

	// Signal colors → text-signal-success, bg-signal-error, etc.
	lines.push("\t/* Signal colors */");
	for (const [key, val] of Object.entries(tokens.signal)) {
		lines.push(`\t--color-signal-${key}: ${val};`);
	}
	lines.push("");

	// Fonts → font-sans, font-mono
	lines.push("\t/* Fonts */");
	for (const [key, val] of Object.entries(tokens.font)) {
		lines.push(`\t--font-${key}: ${val};`);
	}
	lines.push("");

	// Animation → animate-pulse-glow
	lines.push("\t/* Animation */");
	for (const [key, val] of Object.entries(tokens.animation)) {
		lines.push(`\t--animate-${key}: ${val};`);
	}
	lines.push("");

	// Tier 2 semantic — resolved to actual values for @theme
	lines.push("\t/* Tier 2: Semantic */");
	const semanticSurfaces = semanticMod.semantic.surface;
	if (semanticSurfaces) {
		for (const [key, val] of Object.entries(semanticSurfaces)) {
			lines.push(`\t--color-surface-${key}: ${resolveVars(val)};`);
		}
	}
	const semanticBorders = semanticMod.semantic.border;
	if (semanticBorders) {
		for (const [key, val] of Object.entries(semanticBorders)) {
			lines.push(`\t--color-border-${key}: ${resolveVars(val)};`);
		}
	}
	const semanticDepths = semanticMod.semantic.depth;
	if (semanticDepths) {
		for (const [key, val] of Object.entries(semanticDepths)) {
			lines.push(`\t--shadow-depth-${key}: ${resolveVars(val)};`);
		}
	}

	lines.push("}");

	return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// Generate types.ts
// ---------------------------------------------------------------------------
function generateTypes(): string {
	const lines: string[] = [
		"/**",
		" * @file types.ts",
		" * @package @devpulse/coldlight",
		" *",
		" * AUTO-GENERATED - DO NOT EDIT",
		" * Generated by ds-tokens-build.ts from tokens.ts",
		" */",
		"",
	];

	for (const [name, values] of Object.entries(tokens.enums)) {
		const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
		const formatted = JSON.stringify([...values]);
		lines.push(`export const ${pascalName}Tokens = ${formatted} as const;`);
		lines.push(`export type ${pascalName}Token = (typeof ${pascalName}Tokens)[number];`);
		lines.push("");
	}

	// TokenArrays aggregate
	lines.push("export const TokenArrays = {");
	for (const name of Object.keys(tokens.enums)) {
		const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
		lines.push(`\t${name}: ${pascalName}Tokens,`);
	}
	lines.push("} as const;");

	return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// Generate tailwind.preset.ts
// ---------------------------------------------------------------------------
function generateTailwindPreset(): string {
	const lines: string[] = [
		"/**",
		" * AUTO-GENERATED — DO NOT EDIT",
		" * Generated from tokens.ts via pnpm ds:tokens:build",
		" */",
		"",
		"export const dpPreset = {",
		"\ttheme: {",
		"\t\textend: {",
	];

	// Colors
	lines.push("\t\t\tcolors: {");
	for (const [name, scale] of Object.entries(tokens.color)) {
		lines.push(`\t\t\t\t"${name}": {`);
		for (const [step, _value] of Object.entries(scale)) {
			lines.push(`\t\t\t\t\t${step}: "var(--color-${name}-${step})",`);
		}
		lines.push("\t\t\t\t},");
	}
	lines.push("\t\t\t},");

	// Spacing
	lines.push("\t\t\tspacing: {");
	for (const [key, _value] of Object.entries(tokens.space)) {
		lines.push(`\t\t\t\t"${key}": "var(--space-${key})",`);
	}
	lines.push("\t\t\t},");

	// Border radius
	lines.push("\t\t\tborderRadius: {");
	for (const [key, _value] of Object.entries(tokens.radius)) {
		lines.push(`\t\t\t\t"${key}": "var(--radius-${key})",`);
	}
	lines.push("\t\t\t},");

	// Box shadow (glow + shadow + bevel)
	lines.push("\t\t\tboxShadow: {");
	for (const [key] of Object.entries(tokens.glow)) {
		lines.push(`\t\t\t\t"glow-${key}": "var(--glow-${key})",`);
	}
	for (const [key] of Object.entries(tokens.shadow)) {
		lines.push(`\t\t\t\t"${key}": "var(--shadow-${key})",`);
	}
	lines.push("\t\t\t},");

	// Z-index
	lines.push("\t\t\tzIndex: {");
	for (const [key] of Object.entries(tokens.z)) {
		lines.push(`\t\t\t\t"${key}": "var(--z-${key})",`);
	}
	lines.push("\t\t\t},");

	lines.push("\t\t},");
	lines.push("\t},");
	lines.push("};");

	return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------
const css = generateCss();
const types = generateTypes();
const preset = generateTailwindPreset();

writeFileSync(resolve(TOKENS_DIR, "tokens.css"), css, "utf-8");
writeFileSync(resolve(TOKENS_DIR, "types.ts"), types, "utf-8");
writeFileSync(resolve(TOKENS_DIR, "tailwind.preset.ts"), preset, "utf-8");

console.log("Generated tokens.css");
console.log("Generated types.ts");
console.log("Generated tailwind.preset.ts");
