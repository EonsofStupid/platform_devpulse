#!/usr/bin/env node
/**
 * @file collect-element-seed-defs.mjs
 * @package @devpulse/coldlight
 *
 * Emits the PER-KIND style layer from component `@defaults` doc-headers.
 *
 * Each component documents its default look in its doc-comment:
 *   @kind chat-topbar
 *   @defaultStyle chat-topbar-default
 *   @defaults {
 *     "background-color": "oklch(...)",
 *     "border-width": "0 0 0.0625rem 0",
 *     ...
 *   }
 *
 * We write `style.{defaultStyleId}.{axis}` into tokens/src/style-defaults.json.
 * SD5's `isComponent` filter (sd.config.mjs) routes any `path[0]="style"`
 * token into components.generated.css as `--style-{defaultStyleId}-{axis}`.
 * renderForge (render.ts) reads
 *   var(--style-{kind}-{preset}-{axis}, var(--preset-{resolved}-{axis}, …))
 * so a component rendering `preset:"default"` resolves its documented
 * @defaults instead of collapsing onto the shared preset layer.
 *
 * Values are emitted `$type:"string"` — PURE PASS-THROUGH. `@defaults` are
 * already final CSS values; the 76 multi-layer box-shadows and 4 four-value
 * border-width shorthands must survive verbatim, so no dimension/shadow
 * transform may run over them.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS_DIR = 'src/lib/design/components';
const OUTPUT = 'scripts/build/styledictionary/tokens/src/style-defaults.json';

/** Canonical axis names renderForge understands (must match render.ts). */
const CANONICAL_AXES = new Set([
	'background-color',
	'box-shadow',
	'border-color',
	'gradient',
	'background-image',
	'background-alpha',
	'border-width',
	'border-style',
	'border-radius',
	'color',
	'font-family',
	'font-size',
	'font-weight',
	'letter-spacing',
	'line-height',
	'backdrop-filter',
	'opacity',
	'animation',
	'transition-duration',
	'transition-timing-function',
]);

/** Recursively find component .svelte files (skips _*, .*, tests, stories). */
function findSvelteFiles(dir) {
	if (!existsSync(dir)) return [];
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...findSvelteFiles(full));
		} else if (
			entry.name.endsWith('.svelte') &&
			!entry.name.includes('.test.') &&
			!entry.name.includes('.stories.')
		) {
			out.push(full);
		}
	}
	return out;
}

/** Parse @kind, @defaultStyle and the brace-matched @defaults JSON from the first doc-comment. */
function parseComponent(filePath) {
	const content = readFileSync(filePath, 'utf-8');
	const comment = content.match(/<!--([\s\S]*?)-->/);
	if (!comment) return null;
	const block = comment[1];

	const kind = block.match(/@kind\s+(\S+)/)?.[1];
	if (!kind) return null;

	const defaultsIdx = block.indexOf('@defaults');
	if (defaultsIdx === -1) return null;
	const braceStart = block.indexOf('{', defaultsIdx);
	if (braceStart === -1) return null;

	// Brace-match the JSON body. @defaults values are flat literals
	// (oklch/rem strings, no nested objects), so depth counting is safe.
	let depth = 0;
	let end = -1;
	for (let i = braceStart; i < block.length; i++) {
		if (block[i] === '{') depth++;
		else if (block[i] === '}') {
			depth--;
			if (depth === 0) {
				end = i;
				break;
			}
		}
	}
	if (end === -1) return null;

	let defaults;
	try {
		defaults = JSON.parse(block.slice(braceStart, end + 1));
	} catch (e) {
		throw new Error(`${filePath}: @defaults is not valid JSON — ${e.message}`);
	}

	const defaultStyle = block.match(/@defaultStyle\s+(\S+)/)?.[1] ?? `${kind}-default`;
	return { kind, defaultStyle, defaults, filePath };
}

const files = findSvelteFiles(COMPONENTS_DIR);
const style = {};
const seenKinds = new Set();
let emitted = 0;

for (const file of files) {
	const parsed = parseComponent(file);
	if (!parsed) continue;
	// First (root) component per kind wins — mirrors scan-annotations.
	if (seenKinds.has(parsed.kind)) continue;
	seenKinds.add(parsed.kind);

	const group = {};
	for (const [axis, value] of Object.entries(parsed.defaults)) {
		if (!CANONICAL_AXES.has(axis)) {
			throw new Error(
				`${parsed.filePath}: @defaults axis "${axis}" is not a canonical renderForge axis`,
			);
		}
		group[axis] = { $value: String(value), $type: 'string' };
	}
	if (Object.keys(group).length === 0) continue;
	style[parsed.defaultStyle] = group;
	emitted++;
}

writeFileSync(OUTPUT, `${JSON.stringify({ style }, null, '\t')}\n`, 'utf-8');
console.log(
	`[collect-element-seed-defs] Emitted per-kind @defaults for ${emitted} kinds → ${OUTPUT}`,
);
