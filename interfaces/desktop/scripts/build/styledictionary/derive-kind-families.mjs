#!/usr/bin/env node
/**
 * @file derive-kind-families.mjs
 * @package @devpulse/coldlight
 *
 * Build step: derives the two family maps renderForge needs to know which
 * `data-cl-*` markers an element gets (render-base.css only applies an axis
 * under its family marker):
 *
 *   KIND_FAMILIES   — component kind → families, derived from the per-kind
 *                     `@defaults` layer (tokens/src/style-defaults.json,
 *                     written by collect-element-seed-defs.mjs). Ids are
 *                     "{kind}-default" / "{kind}-{variant}"; axes are
 *                     unioned across a kind's ids.
 *   PRESET_FAMILIES — FULL shared-preset id → families, derived from
 *                     tokens/src/style-presets.json. No id stripping: a
 *                     preset is not a kind. renderForge unions this with
 *                     the kind's families at resolve time, so a Card
 *                     carrying preset "glass-deep" gains `overlay` and its
 *                     backdrop-filter actually applies.
 *
 * Families are derived at build time, never hand-authored per component.
 *
 * Pipeline position: after collect-element-seed-defs, before SD5.
 * Output: src/lib/design/renderforge/generated/kind-families.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULTS_PATH = resolve(__dirname, "tokens/src/style-defaults.json");
const PRESETS_PATH = resolve(__dirname, "tokens/src/style-presets.json");
const OUTPUT_PATH = resolve(
	__dirname,
	"../../../src/lib/design/renderforge/generated/kind-families.ts",
);

/**
 * CSS variable → family mapping.
 * Must match var-to-family.ts — this is the build-time mirror.
 */
const VAR_TO_FAMILY = {
	// Surface
	"background-color": "surface",
	"box-shadow": "surface",
	"border-color": "surface",
	"gradient": "surface",
	"background-image": "surface",
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

/** Families active in one style/preset entry (inactive values don't grant a family). */
function familiesFromAxes(entry) {
	const fams = new Set();
	for (const axis of Object.keys(entry)) {
		if (axis.startsWith("$")) continue;
		const family = VAR_TO_FAMILY[axis];
		if (!family) continue;
		const val = entry[axis]?.$value;
		if (val && val !== "inherit" && val !== "none" && val !== "0" && val !== "transparent") {
			fams.add(family);
		}
	}
	return fams;
}

function loadGroup(path, keys, label) {
	const data = JSON.parse(readFileSync(path, "utf-8"));
	for (const key of keys) {
		if (data[key]) return data[key];
	}
	console.error(`[derive-kind-families] FATAL: ${label} has none of the keys: ${keys.join(", ")}`);
	console.error("  Keys found:", Object.keys(data).join(", "));
	process.exit(1);
}

// ── KIND_FAMILIES — from the per-kind @defaults layer ─────────────
const defaults = loadGroup(DEFAULTS_PATH, ["style"], "style-defaults.json");
/** @type {Map<string, Set<string>>} */
const kindFamilies = new Map();

for (const [styleId, entry] of Object.entries(defaults)) {
	if (styleId.startsWith("$")) continue;
	if (typeof entry !== "object" || entry === null) continue;

	// "{kind}-default" / "{kind}-{variant}" → kind
	const parts = styleId.split("-");
	parts.pop();
	const kind = parts.join("-");
	if (!kind) continue;

	const families = kindFamilies.get(kind) ?? new Set();
	for (const family of familiesFromAxes(entry)) {
		families.add(family);
	}
	kindFamilies.set(kind, families);
}

// Add interactive family to known interactive kinds
for (const kind of INTERACTIVE_KINDS) {
	if (kindFamilies.has(kind)) {
		kindFamilies.get(kind).add("interactive");
	}
}

// ── PRESET_FAMILIES — full shared-preset ids, no stripping ────────
const presets = loadGroup(PRESETS_PATH, ["style", "preset"], "style-presets.json");
/** @type {Map<string, Set<string>>} */
const presetFamilies = new Map();

for (const [presetId, entry] of Object.entries(presets)) {
	if (presetId.startsWith("$")) continue;
	if (typeof entry !== "object" || entry === null) continue;
	const families = familiesFromAxes(entry);
	if (families.size > 0) {
		presetFamilies.set(presetId, families);
	}
}

// ── Emit ──────────────────────────────────────────────────────────
function emitMap(name, map) {
	const lines = [`export const ${name}: Record<string, CssFamily[]> = {`];
	for (const key of [...map.keys()].sort()) {
		const fams = [...map.get(key)].sort().map((f) => `"${f}"`).join(", ");
		// Biome: unquoted keys for valid JS identifiers (no hyphens)
		const outKey = key.includes("-") ? `"${key}"` : key;
		lines.push(`\t${outKey}: [${fams}],`);
	}
	lines.push("};");
	return lines;
}

const out = [
	"/* AUTO-GENERATED by derive-kind-families.mjs — DO NOT EDIT */",
	"",
	`import type { CssFamily } from "../types.js";`,
	"",
	...emitMap("KIND_FAMILIES", kindFamilies),
	"",
	...emitMap("PRESET_FAMILIES", presetFamilies),
	"",
];

writeFileSync(OUTPUT_PATH, out.join("\n"));
console.log(
	`[derive-kind-families] ${kindFamilies.size} kinds + ${presetFamilies.size} presets → src/lib/design/renderforge/generated/kind-families.ts`,
);
