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
	"transition-timing-function": { "$value": "ease-out", "$type": "string" },
	"gradient": { "$value": "none", "$type": "string" },
	"font-family": { "$value": "inherit", "$type": "string" },
	"font-size": { "$value": "inherit", "$type": "string" },
	"font-weight": { "$value": "inherit", "$type": "string" },
	"letter-spacing": { "$value": "0", "$type": "dimension" },
	"line-height": { "$value": "inherit", "$type": "string" },
};

const raw = readFileSync(PRESETS_PATH, "utf-8");
const data = JSON.parse(raw);
const style = data.style;

let enriched = 0;
let alreadyComplete = 0;

for (const [presetName, preset] of Object.entries(style)) {
	if (presetName.startsWith("$")) continue;
	if (typeof preset !== "object" || preset === null) continue;

	let added = 0;
	for (const [axis, defaultValue] of Object.entries(AXIS_DEFAULTS)) {
		if (!(axis in preset)) {
			preset[axis] = JSON.parse(JSON.stringify(defaultValue));
			added++;
		}
	}

	if (added > 0) {
		enriched++;
	} else {
		alreadyComplete++;
	}
}

writeFileSync(PRESETS_PATH, JSON.stringify(data, null, "\t") + "\n");
console.log(`[enrich-presets] ${enriched} presets enriched, ${alreadyComplete} already complete. Total: ${Object.keys(style).length}`);
