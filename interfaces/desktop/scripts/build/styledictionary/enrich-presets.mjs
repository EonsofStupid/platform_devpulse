#!/usr/bin/env node
/**
 * @file enrich-presets.mjs
 * @description Ensures every preset in style-presets.json declares ALL visual axes.
 *
 * A strict design system never leaves an axis undefined. Every preset must
 * explicitly declare every property, even if the value is "inherit" or "none".
 * This ensures the token manifest is complete — AI tools and the VPB can read
 * every visual state without guessing.
 *
 * Idempotent — safe to run multiple times. Only adds missing properties.
 *
 * Usage: node scripts/build/styledictionary/enrich-presets.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRESETS_PATH = resolve(__dirname, "tokens/src/style-presets.json");

/**
 * Complete axis defaults — applied to any preset missing these properties.
 * Values are design-system-wide defaults, not per-component.
 */
const AXIS_DEFAULTS = {
	"animation": { "$value": "none", "$type": "string" },
	"transition-duration": { "$value": "150ms", "$type": "duration" },
	"transition-timing-function": { "$value": "ease-out", "$type": "cubicBezier" },
	"gradient": { "$value": "none", "$type": "gradient" },
	"font-family": { "$value": "{font.sans}", "$type": "fontFamily" },
	"font-size": { "$value": "inherit", "$type": "dimension" },
	"font-weight": { "$value": "400", "$type": "fontWeight" },
	"letter-spacing": { "$value": "0", "$type": "dimension" },
	"line-height": { "$value": "1.5", "$type": "number" },
};

/**
 * Kind → font-family override map.
 * Keys that appear here get a different font stack than the default {font.sans}.
 * "inherit" means the kind has no text content (separators, skeletons, etc.).
 */
const KIND_FONT_MAP = {
	// Display font (Orbitron) — stats, headings
	"heading": "{font.display}",
	"stat": "{font.display}",

	// Mono font (JetBrains Mono) — code, keyboard, pin inputs
	"code": "{font.mono}",
	"kbd": "{font.mono}",
	"pin-input": "{font.mono}",

	// No text content — keep inherit
	"separator": "inherit",
	"skeleton": "inherit",
	"spinner": "inherit",
	"loading-overlay": "inherit",
	"dynamic-background": "inherit",
	"color-area": "inherit",
	"color-slider": "inherit",
	"color-swatch": "inherit",
	"color-swatch-picker": "inherit",
	"color-wheel": "inherit",
	"scroll-area": "inherit",
	"slider": "inherit",
	"range-calendar": "inherit",
	"progress": "inherit",
	"file-upload": "inherit",
};

/**
 * Kind → font-weight override map.
 */
const KIND_WEIGHT_MAP = {
	"heading": "600",
	"stat": "700",
	"badge": "500",
	"label": "500",
	"status-dot": "500",
	"kbd": "500",
	"button": "500",
	"tabs": "500",
	"toggle": "500",
	"nav": "500",
	"steps": "500",
};

const raw = readFileSync(PRESETS_PATH, "utf-8");
const data = JSON.parse(raw);
const style = data.style;

let enriched = 0;
let alreadyComplete = 0;

for (const [presetName, preset] of Object.entries(style)) {
	if (presetName.startsWith("$")) continue;
	if (typeof preset !== "object" || preset === null) continue;

	// Extract kind from preset name: "button-glass" → "button", "chat-sidebar-default" → "chat-sidebar"
	const parts = presetName.split("-");
	parts.pop(); // remove variant
	const kind = parts.join("-");

	let added = 0;
	let typeFixed = 0;
	for (const [axis, defaultValue] of Object.entries(AXIS_DEFAULTS)) {
		if (!(axis in preset)) {
			preset[axis] = JSON.parse(JSON.stringify(defaultValue));
			added++;
		} else if (preset[axis].$type !== defaultValue.$type) {
			// Fix incorrect $type on existing property
			preset[axis].$type = defaultValue.$type;
			typeFixed++;
		}
	}

	// ── Typography pass: always force correct values ──
	// Kinds explicitly mapped get their specific font
	if (kind in KIND_FONT_MAP) {
		const fontVal = KIND_FONT_MAP[kind];
		preset["font-family"].$value = fontVal;
		// No-text kinds: force all typography to inherit
		if (fontVal === "inherit") {
			preset["font-size"].$value = "inherit";
			preset["font-weight"].$value = "inherit";
			preset["line-height"].$value = "inherit";
		} else {
			// Text kinds with specific font: give real defaults if still "inherit"
			if (preset["line-height"].$value === "inherit") preset["line-height"].$value = "1.3";
			if (preset["font-weight"].$value === "inherit") preset["font-weight"].$value = "400";
		}
	} else {
		// Everything else: default to {font.sans} if still "inherit"
		if (preset["font-family"].$value === "inherit") {
			preset["font-family"].$value = "{font.sans}";
		}
		// Apply default line-height if still "inherit"
		if (preset["line-height"].$value === "inherit") {
			preset["line-height"].$value = "1.5";
		}
		// Apply default font-weight if still "inherit"
		if (preset["font-weight"].$value === "inherit") {
			preset["font-weight"].$value = "400";
		}
	}

	// Apply kind-specific font-weight overrides (takes precedence over default)
	if (kind in KIND_WEIGHT_MAP) {
		preset["font-weight"].$value = KIND_WEIGHT_MAP[kind];
	}

	if (added > 0 || typeFixed > 0) {
		enriched++;
	} else {
		alreadyComplete++;
	}
}

writeFileSync(PRESETS_PATH, JSON.stringify(data, null, "\t") + "\n");
console.log(`[enrich-presets] ${enriched} presets enriched, ${alreadyComplete} already complete. Total: ${Object.keys(style).length}`);
