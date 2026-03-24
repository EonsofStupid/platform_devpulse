#!/usr/bin/env node
/**
 * @file collect-element-seed-defs.mjs
 * @package @devpulse/coldlight
 *
 * S2-style annotation extraction. Scans .svelte files for @key annotations.
 * Generates ui-catalog.json — the SINGLE source of truth for VPB and runtime.
 * No .def.json files. No catalog.ts. JSON is the SSOT.
 *
 * Run before SD5 build: included in build.mjs pipeline.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { scanAnnotations } from './scan-annotations.mjs';

const OUTPUT_CATALOG = resolve('src/lib/design/generated/ui-catalog.json');
const CSS_OUTPUT = resolve('src/lib/design/styles/components/component.css');

// Sources to scan — order matters (components first, then blocks, layouts)
const SOURCES = [
	{ dir: resolve('src/lib/design/components'), defaultLayer: 'component' },
	{ dir: resolve('src/lib/design/blocks'), defaultLayer: 'block' },
	{ dir: resolve('src/lib/layouts'), defaultLayer: 'layout' },
];

/**
 * Extract resolved preset values from compiled component.css.
 * Reads --style-{kind}-{intent}-{axis} vars and groups them by styleId.
 */
function extractResolvedPresets() {
	if (!existsSync(CSS_OUTPUT)) return {};

	const css = readFileSync(CSS_OUTPUT, 'utf-8');
	const presets = {};

	const pattern = /--style-([a-z][a-z0-9-]*?)-(background-color|background-blur|animation|transition|color|border-radius|opacity|shadow-\d+-color|shadow-\d+-offset-x|shadow-\d+-offset-y|shadow-\d+-blur|shadow-\d+-spread|shadow-color|shadow-offset-x|shadow-offset-y|shadow-blur|shadow-spread|border-color|border-width|border-style|typography-font-family|typography-font-size|typography-font-weight|typography-letter-spacing|typography-line-height|gradient):\s*(.+?);/g;

	let m;
	while ((m = pattern.exec(css)) !== null) {
		const styleId = m[1];
		const axis = m[2];
		const value = m[3].trim();
		if (!presets[styleId]) presets[styleId] = {};
		presets[styleId][axis] = value;
	}

	return presets;
}

function collect() {
	console.log('[elements] Scanning annotations...');
	const defs = scanAnnotations(SOURCES);

	if (defs.length === 0) {
		console.error('\n  [ERROR] No annotated .svelte files found');
		process.exit(1);
	}

	for (const def of defs) {
		console.log(`  [def] ${def.kind}: ${def.layer}/${def.category} — ${def.label}`);
	}

	const byLayer = {};
	for (const def of defs) {
		byLayer[def.layer] = (byLayer[def.layer] || 0) + 1;
	}

	// Extract resolved preset values from compiled CSS (if available)
	const resolvedPresets = extractResolvedPresets();

	// Attach resolved values to each def
	const defsWithPresets = defs.map((def) => {
		const presets = {};
		for (const styleId of def.styleIds) {
			if (resolvedPresets[styleId]) {
				presets[styleId] = resolvedPresets[styleId];
			}
		}
		return { ...def, presets: Object.keys(presets).length > 0 ? presets : undefined };
	});

	// Generate ui-catalog.json — the ONLY output
	const catalog = {
		$schema: 'coldlight/ui-catalog',
		generatedAt: new Date().toISOString(),
		total: defs.length,
		byLayer,
		byCategory: {
			structural: defs.filter((d) => d.category === 'structural').length,
			content: defs.filter((d) => d.category === 'content').length,
			interactive: defs.filter((d) => d.category === 'interactive').length,
			composite: defs.filter((d) => d.category === 'composite').length,
			feedback: defs.filter((d) => d.category === 'feedback').length,
			navigation: defs.filter((d) => d.category === 'navigation').length,
		},
		containers: defs.filter((d) => d.container).map((d) => d.kind),
		elements: defsWithPresets,
	};

	writeFileSync(OUTPUT_CATALOG, JSON.stringify(catalog, null, '\t'));

	const layerStr = Object.entries(byLayer).map(([k, v]) => `${v} ${k}s`).join(', ');
	console.log(`\n[elements] ui-catalog.json — ${defs.length} elements (${layerStr})`);
	console.log(`[elements] ${catalog.containers.length} containers`);
	if (Object.keys(resolvedPresets).length > 0) {
		console.log(`[elements] Resolved preset values: ${Object.keys(resolvedPresets).length} style IDs`);
	}
}

collect();
