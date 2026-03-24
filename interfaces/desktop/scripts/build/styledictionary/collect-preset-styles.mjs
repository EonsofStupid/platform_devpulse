#!/usr/bin/env node
/**
 * @file collect-preset-styles.mjs
 * @package @devpulse/coldlight
 *
 * Reads presets/{kind}.json (6-axis shorthand) and writes
 * expanded 11-axis DTCG entries into component.json under the "style" group.
 *
 * Preset shorthand → 11-axis DTCG mapping:
 *   surface    → backgroundColor ($type: color)
 *   depth      → shadow ($type: shadow)
 *   frame      → border ($type: border)
 *   transition → transition ($type: transition)
 *   + defaults for backgroundBlur, animation, typography, gradient, color, borderRadius, opacity
 *
 * Run BEFORE sd.config.mjs. Called by build.mjs.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PRESETS_DIR = join(import.meta.dirname, 'tokens/src/presets');
const COMPONENT_JSON = join(import.meta.dirname, 'tokens/src/component.json');

/** Surface token → blur mapping (higher glass = more blur) */
const SURFACE_BLUR_MAP = {
	'{surface.overlay}': '{blur.lg}',
	'{surface.raised}': '{blur.md}',
	'{surface.base}': '0px',
	'{surface.inset}': '0px',
	'{surface.subtle}': '0px',
	'{surface.frosted}': '{blur.lg}',
	'{surface.chrome}': '0px',
	'{glass.void}': '0px',
	'{glass.deep}': '{blur.lg}',
	'{glass.smoke}': '{blur.md}',
	'{glass.frost}': '{blur.lg}',
	'{glass.teal}': '{blur.lg}',
	'{glass.purple}': '{blur.lg}',
};

/** Surface token → text color mapping */
const SURFACE_COLOR_MAP = {
	'{surface.overlay}': '#ffffff',
	'{surface.raised}': '{color.neutral.100}',
	'{surface.base}': '{color.neutral.100}',
	'{surface.inset}': '{color.neutral.300}',
	'{surface.subtle}': '{color.neutral.300}',
	'{glass.void}': '{color.neutral.300}',
	'{glass.deep}': '#ffffff',
	'{glass.smoke}': '{color.neutral.100}',
};

/** Surface token → border radius mapping */
const SURFACE_RADIUS_MAP = {
	'{surface.overlay}': '{radius.lg}',
	'{surface.raised}': '{radius.lg}',
	'{surface.base}': '{radius.md}',
	'{surface.inset}': '{radius.md}',
	'{surface.subtle}': '{radius.md}',
	'{glass.void}': '{radius.md}',
};

/**
 * Expand a 6-axis preset shorthand into an 11-axis DTCG style entry.
 *
 * @param {string} description
 * @param {object} shorthand  { surface, depth, bevel, glow, frame, transition }
 * @returns {object} 11-axis DTCG style entry
 */
function expandPreset(description, shorthand) {
	const surface = shorthand.surface ?? '{glass.void}';
	const depth = shorthand.depth ?? '{shadow.z0}';
	const frame = shorthand.frame ?? '{borderPreset.default}';
	const transition = shorthand.transition ?? '{transition.all-fast}';

	return {
		$description: description,
		backgroundColor: {
			$type: 'color',
			$value: surface,
		},
		backgroundBlur: {
			$type: 'dimension',
			$value: SURFACE_BLUR_MAP[surface] ?? '0px',
		},
		shadow: {
			$type: 'shadow',
			$value: depth,
		},
		border: {
			$type: 'border',
			$value: frame,
		},
		animation: {
			$type: 'duration',
			$value: '0ms',
		},
		transition: {
			$type: 'transition',
			$value: transition,
		},
		typography: {
			$type: 'typography',
			$value: {
				fontFamily: '{font.sans}',
				fontSize: '14px',
				fontWeight: 400,
				letterSpacing: '0em',
				lineHeight: 1.5,
			},
		},
		gradient: {
			$type: 'gradient',
			$value: [],
		},
		color: {
			$type: 'color',
			$value: SURFACE_COLOR_MAP[surface] ?? '{color.neutral.100}',
		},
		borderRadius: {
			$type: 'dimension',
			$value: SURFACE_RADIUS_MAP[surface] ?? '{radius.lg}',
		},
		opacity: {
			$type: 'number',
			$value: 1,
		},
	};
}

// ─── Main ───────────────────────────────────────────────────────────────

const presetFiles = readdirSync(PRESETS_DIR)
	.filter((f) => f.endsWith('.json'))
	.sort();

console.log(`[presets] Reading ${presetFiles.length} preset files...`);

/** @type {Record<string, object>} */
const styleEntries = {};
let count = 0;

for (const file of presetFiles) {
	const raw = readFileSync(join(PRESETS_DIR, file), 'utf-8');
	const data = JSON.parse(raw);

	// Structure: { preset: { [kind]: { [intent]: { $value: {...}, $description: "..." } } } }
	const presetGroup = data.preset;
	if (!presetGroup) {
		console.warn(`  [skip] ${file} — no "preset" group`);
		continue;
	}

	for (const [key, variants] of Object.entries(presetGroup)) {
		if (key.startsWith('$')) continue; // skip $description

		for (const [intent, entry] of Object.entries(variants)) {
			if (intent.startsWith('$')) continue;

			const styleId = `${key}-${intent}`;
			const shorthand = entry.$value;
			const desc = entry.$description ?? `${key} ${intent}`;

			if (!shorthand || typeof shorthand !== 'object') {
				console.warn(`  [skip] ${styleId} — no $value object`);
				continue;
			}

			// Skip if already manually defined (don't overwrite hand-tuned entries)
			if (styleEntries[styleId]) continue;

			styleEntries[styleId] = expandPreset(desc, shorthand);
			count++;
		}
	}
}

// Read existing component.json
const componentJson = JSON.parse(readFileSync(COMPONENT_JSON, 'utf-8'));

// Merge: keep existing hand-tuned style entries, add new ones from presets
const existingStyle = componentJson.style ?? { $description: 'Style presets — 11-axis DTCG entries compiled from preset shorthand' };
for (const [id, entry] of Object.entries(styleEntries)) {
	if (!existingStyle[id]) {
		existingStyle[id] = entry;
	}
}
componentJson.style = existingStyle;

writeFileSync(COMPONENT_JSON, JSON.stringify(componentJson, null, '\t') + '\n');
console.log(`[presets] Wrote ${count} style entries to component.json`);
console.log(`[presets] Total style entries: ${Object.keys(existingStyle).filter((k) => !k.startsWith('$')).length}`);
