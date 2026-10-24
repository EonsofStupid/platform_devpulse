#!/usr/bin/env node
/**
 * @file derive-kind-families.mjs
 * @package @devpulse/coldlight
 *
 * Build step: reads enriched presets, maps --cl-* vars through VAR_TO_FAMILY,
 * outputs KIND_FAMILIES — a kind → CssFamily[] mapping.
 *
 * Per MACRO-LAW.md Law 5 — families are derived at build time, never hand-authored per component.
 *
 * Pipeline position: after enrich-presets, before SD5.
 * Output: packages/coldlight/renderforge/generated/kind-families.ts
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRESETS_PATH = resolve(__dirname, "tokens/src/style-presets.json");
const COMPONENTS_DIR = resolve(__dirname, "../../../../../packages/coldlight/components");
const OUTPUT_PATH = resolve(__dirname, "../../../../../packages/coldlight/renderforge/generated/kind-families.ts");

/**
 * Families fixed by a component's declared category (`export const CATEGORY`
 * in `components/<kind>/schema.ts`). A declaration wins over families
 * inferred from preset names. Typography components carry ONLY the text
 * family — text never takes a surface or frame (Material 3 keeps type roles
 * separate from surface roles).
 */
const CATEGORY_FAMILIES = {
	typography: ["text"],
};

/**
 * CSS variable → family mapping.
 * Must match var-to-family.ts — this is the build-time mirror.
 */
const VAR_TO_FAMILY = {
	// Surface
	"background-color": "surface",
	"box-shadow": "surface",
	"border-color": "surface",
	// Text
	"color": "text",
	"font-family": "text",
	"font-size": "text",
	"font-weight": "text",
	"letter-spacing": "text",
	"line-height": "text",
	// Frame
	"border-radius": "frame",
	"border-width": "frame",
	"border-style": "frame",
	// Overlay
	"backdrop-filter": "overlay",
	// Interactive — derived from kind characteristics, not preset vars
	// (buttons, toggles, inputs are interactive; separators, skeletons are not)
};

/**
 * Kinds that are inherently interactive — get data-cl-interactive.
 * This is a known set, not derived from presets.
 */
const INTERACTIVE_KINDS = new Set([
	"accordion", "button", "calendar", "checkbox", "collapsible",
	"color-area", "color-field", "color-slider", "color-swatch", "color-swatch-picker",
	"color-wheel", "combobox", "contextual-help", "date-field", "date-picker",
	"date-range-field", "date-range-picker", "link-preview", "menubar",
	"nav", "navigation-menu", "pagination", "pin-input", "popover",
	"radio-group", "range-calendar", "scroll-area", "select", "sheet",
	"slider", "steps", "switch", "tabs", "text-field", "textarea",
	"toggle", "toggle-group", "toolbar", "tooltip",
]);

const raw = readFileSync(PRESETS_PATH, "utf-8");
const data = JSON.parse(raw);
// style-presets.json uses "preset" as the top-level key (was "style" in earlier format)
const style = data.style ?? data.preset;

if (!style) {
	console.error("[derive-kind-families] FATAL: style-presets.json has no 'style' or 'preset' key");
	console.error("  Keys found:", Object.keys(data).join(", "));
	process.exit(1);
}

/** Map of kind → Set<family> */
const kindFamilies = new Map();

for (const [presetName, preset] of Object.entries(style)) {
	if (presetName.startsWith("$")) continue;
	if (typeof preset !== "object" || preset === null) continue;

	// Extract kind: "button-glass" → "button", "chat-sidebar-default" → "chat-sidebar"
	const parts = presetName.split("-");
	parts.pop(); // remove variant
	const kind = parts.join("-");

	if (!kindFamilies.has(kind)) {
		kindFamilies.set(kind, new Set());
	}

	const families = kindFamilies.get(kind);

	// Walk preset axes, map to families
	for (const axis of Object.keys(preset)) {
		if (axis.startsWith("$")) continue;
		const family = VAR_TO_FAMILY[axis];
		if (family) {
			// Only add if the value is not "inherit" / "none" / "0" (i.e., it's active)
			const val = preset[axis]?.$value;
			if (val && val !== "inherit" && val !== "none" && val !== "0" && val !== "transparent") {
				families.add(family);
			}
		}
	}
}

// Declared categories override preset inference.
for (const entry of readdirSync(COMPONENTS_DIR, { withFileTypes: true })) {
	if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
	const schemaPath = join(COMPONENTS_DIR, entry.name, "schema.ts");
	if (!existsSync(schemaPath)) continue;
	const match = readFileSync(schemaPath, "utf-8").match(/export const CATEGORY\s*=\s*"([^"]+)"/);
	const declared = match && CATEGORY_FAMILIES[match[1]];
	if (declared) kindFamilies.set(entry.name, new Set(declared));
}

// Add interactive family to known interactive kinds
for (const kind of INTERACTIVE_KINDS) {
	if (kindFamilies.has(kind)) {
		kindFamilies.get(kind).add("interactive");
	}
}

// Sort families for consistent output
const sorted = {};
const allKinds = [...kindFamilies.keys()].sort();
for (const kind of allKinds) {
	sorted[kind] = [...kindFamilies.get(kind)].sort();
}

// Generate TypeScript output
const lines = [
	"/* AUTO-GENERATED by derive-kind-families.mjs — DO NOT EDIT */",
	"",
	`import type { CssFamily } from "../types.js";`,
	"",
	"export const KIND_FAMILIES: Record<string, CssFamily[]> = {",
];

for (const [kind, families] of Object.entries(sorted)) {
	const fams = families.map((f) => `"${f}"`).join(", ");
	// Biome: unquoted keys for valid JS identifiers (no hyphens)
	const key = kind.includes("-") ? `"${kind}"` : kind;
	lines.push(`\t${key}: [${fams}],`);
}

lines.push("};");
lines.push("");

writeFileSync(OUTPUT_PATH, lines.join("\n"));
console.log(`[derive-kind-families] ${allKinds.length} kinds → ${relative(process.cwd(), OUTPUT_PATH)}`);
