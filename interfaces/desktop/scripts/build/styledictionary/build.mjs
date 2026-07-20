#!/usr/bin/env node
/**
 * @file build.mjs
 * @package @devpulse/coldlight
 *
 * Style Dictionary v5 build pipeline — ONE entry point.
 * Usage: node scripts/build/styledictionary/build.mjs
 *
 * Pipeline:
 *   1. collect-element-seed-defs — per-kind @defaults → style-defaults.json
 *   2. derive-kind-families — KIND_FAMILIES + PRESET_FAMILIES → kind-families.ts
 *   3. SD5 buildAllPlatforms() → CSS, @theme, types, manifest
 *   4. Write barrel index files (CSS, theme, types)
 *
 * Output boundary (no second token pipeline):
 * - src/lib/design/styles/  — token custom properties (@layer tokens.*)
 * - src/lib/design/theme/   — Tailwind @theme blocks
 * - src/lib/design/types/   — generated .d.ts unions
 * - src/lib/design/manifest/token-manifest.json — VPB manifest (JSON, isolated from CSS)
 * Non-token CSS (generated/keyframes, glue/*, svg glue) is authored separately
 * and imported from src/lib/design/index.css — not emitted here.
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import StyleDictionary from 'style-dictionary';
import config from './sd.config.mjs';

const OUT = 'src/lib/design';

const HAS_DECL = /^\s*--[a-z0-9-]+\s*:/im;

/** .css files in `${OUT}/${dir}` that hold ≥1 custom-property decl, sorted. */
function cssFilesWithDecls(dir) {
	const abs = `${OUT}/${dir}`;
	return readdirSync(abs)
		.filter((f) => f.endsWith('.css') && f !== 'index.css')
		.filter((f) => HAS_DECL.test(readFileSync(`${abs}/${f}`, 'utf8')))
		.sort();
}

/**
 * Delete theme/*.css the F9 namespace guard emitted empty (skipped, non-namespace
 * domains). SD5 leaves stale empties on disk; without this they linger and the
 * derived barrel would re-import an unlayered collision.
 */
function pruneEmptyThemeFiles() {
	const abs = `${OUT}/theme`;
	const removed = [];
	for (const f of readdirSync(abs)) {
		if (!f.endsWith('.css') || f === 'index.css') continue;
		if (!HAS_DECL.test(readFileSync(`${abs}/${f}`, 'utf8'))) {
			unlinkSync(`${abs}/${f}`);
			removed.push(f);
		}
	}
	return removed;
}

/**
 * Barrels are DERIVED from what SD5 actually emitted — never hand-listed. A file
 * emitted but omitted from a hand-typed barrel is dead on arrival (the claude.css
 * bug); a file removed but left in the barrel is a broken import. Deriving makes
 * both impossible.
 */
function deriveIndexCss() {
	const tiers = ['primitives', 'semantic', 'components'];
	const blocks = tiers.map((tier) => {
		const imports = cssFilesWithDecls(`styles/${tier}`)
			.map((f) => `@import "./${tier}/${f}";`)
			.join('\n');
		return `/* ── ${tier} ──────────────────────────────────────── */\n${imports}`;
	});
	return (
		`/* AUTO-GENERATED — DO NOT EDIT (derived from emitted files) */\n\n` +
		`@layer tokens.primitives, tokens.semantic, tokens.components;\n\n` +
		`${blocks.join('\n\n')}\n`
	);
}

function deriveIndexTheme() {
	const imports = cssFilesWithDecls('theme')
		.map((f) => `@import "./${f}";`)
		.join('\n');
	return (
		`/* AUTO-GENERATED — DO NOT EDIT (derived from emitted files) */\n` +
		`/* Tailwind-namespace @theme domains only — F9 guard in sd.config.mjs */\n\n` +
		`${imports}\n`
	);
}

function deriveIndexDts() {
	const abs = `${OUT}/types`;
	const exports = readdirSync(abs)
		.filter((f) => f.endsWith('.d.ts') && f !== 'index.d.ts')
		.filter((f) => /export/.test(readFileSync(`${abs}/${f}`, 'utf8')))
		.sort()
		.map((f) => `export * from './${f.replace(/\.d\.ts$/, '.js')}';`)
		.join('\n');
	return `/* AUTO-GENERATED — DO NOT EDIT (derived from emitted files) */\n\n${exports}\n`;
}

// ─── Build ───────────────────────────────────────────────────────────

async function build() {
	// Step 0: Emit the PER-KIND style layer from component @defaults
	// doc-headers (tokens/src/style-defaults.json → --style-{kind}-{variant}-*).
	//
	// The shared --preset-* layer is HAND-MAINTAINED as one file per visual
	// family under tokens/src/presets/*.tokens.json (glass, neuro, chrome,
	// flat, retro, stark, chat, button, wizard). No generator writes it.
	console.log('[SD5] Collecting element @defaults (per-kind style layer)...');
	execSync('node scripts/build/styledictionary/collect-element-seed-defs.mjs', {
		cwd: process.cwd(),
		stdio: 'inherit',
	});

	// Step 1: Derive KIND_FAMILIES (from style-defaults.json) +
	// PRESET_FAMILIES (from style-presets.json, full preset ids).
	console.log('[SD5] Deriving kind + preset families...');
	execSync('node scripts/build/styledictionary/derive-kind-families.mjs', {
		cwd: process.cwd(),
		stdio: 'inherit',
	});

	console.log('[SD5] Starting token build...');
	console.log('[SD5] Source: tokens/src/*.json (flat domain files + collected component tokens)');
	console.log('[SD5] Output: styles/ (tier-aware), theme/ (per-domain), types/ (per-domain)');

	const sd = new StyleDictionary(config);
	await sd.buildAllPlatforms();

	// SD5 leaves empty files on disk for F9-skipped theme domains; drop them so
	// the derived barrel imports only what was actually emitted.
	const pruned = pruneEmptyThemeFiles();
	if (pruned.length) {
		console.log(`[SD5] Pruned ${pruned.length} empty theme file(s): ${pruned.join(', ')}`);
	}

	// Barrels are DERIVED from emitted files — never hand-listed (see helpers).
	writeFileSync(`${OUT}/styles/index.css`, deriveIndexCss());
	writeFileSync(`${OUT}/theme/index.css`, deriveIndexTheme());
	writeFileSync(`${OUT}/types/index.d.ts`, deriveIndexDts());

	// Format generated .d.ts files to pass biome checks
	try {
		execSync(`npx biome format --write ${OUT}/types/`, { stdio: 'pipe' });
	} catch {
		// Non-fatal — formatting is a convenience, not a build requirement
	}

	console.log('[SD5] Build complete.');
	console.log(`  Styles: ${OUT}/styles/index.css`);
	console.log(`  Theme:  ${OUT}/theme/index.css`);
	console.log(`  Types:  ${OUT}/types/index.d.ts`);
}

build().catch((err) => {
	console.error('[SD5] Build failed:', err);
	process.exit(1);
});
