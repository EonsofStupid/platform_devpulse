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
	enums: Record<string, readonly (string | number)[]>;
}

// Dynamic import required — tokens.ts is outside scripts/ rootDir boundary.
// pathToFileURL handles Windows drive letter colon in absolute paths.
const tokens = (await import(pathToFileURL(resolve(TOKENS_DIR, "tokens.ts")).href)) as TokensModule;

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

	lines.push("}");
	lines.push("");

	// ---------------------------------------------------------------------------
	// Tailwind v4 @theme block — maps CSS vars to Tailwind utilities
	// ---------------------------------------------------------------------------
	lines.push("@theme {");

	// Surface materials → bg-glass-*, bg-matte-*
	lines.push("\t/* Surface materials */");
	for (const key of Object.keys(tokens.glass)) {
		lines.push(`\t--color-glass-${key}: var(--glass-${key});`);
	}
	for (const key of Object.keys(tokens.matte)) {
		lines.push(`\t--color-matte-${key}: var(--matte-${key});`);
	}
	lines.push("");

	// Color scales → bg-teal-500, text-purple-300, etc.
	lines.push("\t/* Color scales */");
	for (const [name, scale] of Object.entries(tokens.color)) {
		for (const step of Object.keys(scale)) {
			lines.push(`\t--color-${name}-${step}: var(--color-${name}-${step});`);
		}
	}
	lines.push("");

	// Text colors → text-primary, text-muted, etc.
	lines.push("\t/* Text colors */");
	for (const key of Object.keys(tokens.text)) {
		lines.push(`\t--color-text-${key}: var(--text-${key});`);
	}
	lines.push("");

	// Radius → rounded-lg, rounded-xl, etc.
	lines.push("\t/* Radius */");
	for (const key of Object.keys(tokens.radius)) {
		lines.push(`\t--radius-${key}: var(--radius-${key});`);
	}
	lines.push("");

	// Shadows → shadow-z1, shadow-z2, etc.
	lines.push("\t/* Shadows */");
	for (const key of Object.keys(tokens.shadow)) {
		lines.push(`\t--shadow-${key}: var(--shadow-${key});`);
	}
	lines.push("");

	// Glows → shadow-glow-teal, etc.
	lines.push("\t/* Glows */");
	for (const key of Object.keys(tokens.glow)) {
		lines.push(`\t--shadow-glow-${key}: var(--glow-${key});`);
	}
	lines.push("");

	// Bevels → shadow-bevel-subtle, etc.
	lines.push("\t/* Bevels */");
	for (const key of Object.keys(tokens.bevel)) {
		lines.push(`\t--shadow-bevel-${key}: var(--bevel-${key});`);
	}
	lines.push("");

	// Spacing → p-4, m-2, gap-3, etc.
	lines.push("\t/* Spacing */");
	for (const key of Object.keys(tokens.space)) {
		lines.push(`\t--spacing-${key}: var(--space-${key});`);
	}
	lines.push("");

	// Text sizes → text-sm, text-base, etc.
	lines.push("\t/* Text sizes */");
	for (const key of Object.keys(tokens.textSize)) {
		lines.push(`\t--font-size-${key}: var(--text-size-${key});`);
	}
	lines.push("");

	// Blur → blur-md, etc.
	lines.push("\t/* Blur */");
	for (const key of Object.keys(tokens.blur)) {
		lines.push(`\t--blur-${key}: var(--blur-${key});`);
	}
	lines.push("");

	// Duration → duration-fast, etc.
	lines.push("\t/* Duration */");
	for (const key of Object.keys(tokens.duration)) {
		lines.push(`\t--transition-duration-${key}: var(--duration-${key});`);
	}
	lines.push("");

	// Easing → ease-spring, etc.
	lines.push("\t/* Easing */");
	for (const key of Object.keys(tokens.ease)) {
		lines.push(`\t--transition-timing-function-${key}: var(--ease-${key});`);
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
