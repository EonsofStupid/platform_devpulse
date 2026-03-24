#!/usr/bin/env node
/**
 * @file migrate-def-to-annotations.mjs
 * ONE-TIME migration script. Reads each {kind}.def.json, writes annotations
 * into the root .svelte file's HTML comment block. Run once, then delete this file.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const COMPONENTS_DIR = resolve('src/lib/design/components');

function migrate() {
	const kinds = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
		.map((d) => d.name)
		.sort();

	let migrated = 0;
	let skipped = 0;

	for (const kind of kinds) {
		const defPath = join(COMPONENTS_DIR, kind, `${kind}.def.json`);
		if (!existsSync(defPath)) {
			skipped++;
			continue;
		}

		const def = JSON.parse(readFileSync(defPath, 'utf-8'));

		// Find the root .svelte file (PascalCase of kind)
		const pascal = kind.split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('');
		const sveltePath = join(COMPONENTS_DIR, kind, `${pascal}.svelte`);

		if (!existsSync(sveltePath)) {
			console.warn(`  [skip] ${kind} — no ${pascal}.svelte found`);
			skipped++;
			continue;
		}

		const content = readFileSync(sveltePath, 'utf-8');

		// Build annotation block
		const annotations = [
			`\t@component ${def.label}`,
			`\t@kind ${def.kind}`,
			`\t@layer component`,
			`\t@category ${def.category}`,
			`\t@description ${def.description}`,
		];

		if (def.aria) {
			annotations.push(`\t@aria ${def.aria}`);
		}

		annotations.push(`\t@container ${def.container}`);

		if (def.containerSlots && def.containerSlots.length > 0) {
			annotations.push(`\t@containerSlots ${def.containerSlots.join(', ')}`);
		}

		annotations.push(`\t@compound ${def.compound}`);
		annotations.push(`\t@blockCategory ${def.blockCategory}`);
		annotations.push(`\t@defaultStyle ${def.defaultStyleId}`);

		if (def.styleIds && def.styleIds.length > 0) {
			annotations.push(`\t@styleIds ${def.styleIds.join(', ')}`);
		}

		if (def.requiredAxes && def.requiredAxes.length > 0) {
			annotations.push(`\t@requiredAxes ${def.requiredAxes.join(', ')}`);
		}

		if (def.slots) {
			const slotStr = Object.entries(def.slots)
				.map(([name, axes]) => `${name}:${typeof axes === 'string' ? axes : 'partial'}`)
				.join(', ');
			annotations.push(`\t@slots ${slotStr}`);
		}

		const annotationBlock = `<!--\n${annotations.join('\n')}\n-->`;

		// Replace existing comment block or prepend
		let updated;
		if (content.startsWith('<!--')) {
			// Replace first comment block
			updated = content.replace(/<!--[\s\S]*?-->/, annotationBlock);
		} else {
			// Prepend
			updated = annotationBlock + '\n' + content;
		}

		writeFileSync(sveltePath, updated);
		console.log(`  [migrated] ${kind} → ${pascal}.svelte`);
		migrated++;
	}

	console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped`);
}

migrate();
