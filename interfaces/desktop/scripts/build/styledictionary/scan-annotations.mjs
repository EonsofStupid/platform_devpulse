#!/usr/bin/env node
/**
 * @file scan-annotations.mjs
 * @package @devpulse/coldlight
 *
 * S2-style annotation scanner. Reads structured @key annotations from
 * Svelte component HTML comment blocks. Returns UIDef objects.
 *
 * Pattern: React Spectrum S2 stores component metadata IN the component file.
 * The build extracts it. No separate .def.json files. Zero drift.
 *
 * Usage:
 *   import { scanAnnotations } from './scan-annotations.mjs';
 *   const defs = scanAnnotations([
 *     { dir: 'src/lib/design/components', defaultLayer: 'component' },
 *     { dir: 'src/lib/design/blocks', defaultLayer: 'block' },
 *   ]);
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Parse a single .svelte file's HTML comment block for @key annotations.
 * Returns null if no @kind annotation found (not a catalog element).
 *
 * @param {string} filePath
 * @param {string} defaultLayer
 * @returns {object | null}
 */
function parseAnnotations(filePath, defaultLayer) {
	const content = readFileSync(filePath, 'utf-8');

	// Extract the first HTML comment block
	const match = content.match(/<!--([\s\S]*?)-->/);
	if (!match) return null;

	const comment = match[1];
	const lines = comment.split('\n').map((l) => l.trim());

	// Parse @key value pairs
	const annotations = {};
	for (const line of lines) {
		const m = line.match(/^@(\w+)\s+(.*)/);
		if (m) {
			annotations[m[1]] = m[2].trim();
		}
	}

	// Must have @kind to be a catalog element
	if (!annotations.kind) return null;

	// Parse boolean fields
	const toBool = (v) => v === 'true';

	// Parse comma-separated lists
	const toList = (v) => v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];

	// Parse slots: "root:all, icon:none, label:none" → Record<string, string>
	const toSlots = (v) => {
		if (!v) return { root: 'all' };
		const slots = {};
		for (const pair of v.split(',')) {
			const [name, axes] = pair.trim().split(':').map((s) => s.trim());
			if (name) slots[name] = axes || 'all';
		}
		return slots;
	};

	return {
		kind: annotations.kind,
		label: annotations.component || annotations.kind,
		layer: annotations.layer || defaultLayer,
		category: annotations.category || 'content',
		description: annotations.description || `${annotations.component || annotations.kind} component`,
		aria: annotations.aria || null,
		container: toBool(annotations.container),
		containerSlots: toList(annotations.containerSlots),
		compound: toBool(annotations.compound),
		blockCategory: annotations.blockCategory || 'content',
		requiredAxes: toList(annotations.requiredAxes),
		defaultStyleId: annotations.defaultStyle || `${annotations.kind}-default`,
		styleIds: toList(annotations.styleIds).length > 0
			? toList(annotations.styleIds)
			: [annotations.defaultStyle || `${annotations.kind}-default`],
		slots: toSlots(annotations.slots),
		domain: annotations.domain || null,
	};
}

/**
 * Recursively find all .svelte files in a directory tree.
 *
 * @param {string} dir
 * @returns {string[]}
 */
function findSvelteFiles(dir) {
	if (!existsSync(dir)) return [];

	const results = [];
	const entries = readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...findSvelteFiles(fullPath));
		} else if (entry.name.endsWith('.svelte') && !entry.name.includes('.test.') && !entry.name.includes('.stories.')) {
			results.push(fullPath);
		}
	}

	return results;
}

/**
 * Scan directories for annotated Svelte components.
 *
 * @param {Array<{dir: string, defaultLayer: string}>} sources
 * @returns {object[]} Array of UIDef objects
 */
export function scanAnnotations(sources) {
	const defs = [];
	const seen = new Set();

	for (const { dir, defaultLayer } of sources) {
		const files = findSvelteFiles(dir);

		for (const file of files) {
			const def = parseAnnotations(file, defaultLayer);
			if (!def) continue;

			// Deduplicate by kind (first occurrence wins — root component)
			if (seen.has(def.kind)) continue;
			seen.add(def.kind);

			defs.push(def);
		}
	}

	return defs.sort((a, b) => a.kind.localeCompare(b.kind));
}
