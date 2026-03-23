#!/usr/bin/env node
/**
 * @file build.mjs
 * @package @devpulse/coldlight
 *
 * Style Dictionary v5 build pipeline — ONE entry point.
 * Usage: node scripts/build/styledictionary/build.mjs
 *
 * Pipeline:
 *   1. Collect colocated component tokens.ts → DTCG JSON
 *   2. SD5 buildAllPlatforms() → CSS, @theme, types, manifest
 *   3. Write barrel index files (CSS, theme, types)
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import StyleDictionary from 'style-dictionary';
import config from './sd.config.mjs';

const OUT = 'src/lib/design';

// ─── Barrel: CSS imports with layer order ────────────────────────────

const INDEX_CSS = `/* AUTO-GENERATED — DO NOT EDIT */

/* ── Layer order declaration ─────────────────────────────── */
@layer tokens.primitives, tokens.semantic, tokens.components;

/* ── Primitives ──────────────────────────────────────────── */
@import "../styles/primitives/color.css";
@import "../styles/primitives/shadow.css";
@import "../styles/primitives/bevel.css";
@import "../styles/primitives/glow.css";
@import "../styles/primitives/blur.css";
@import "../styles/primitives/surface.css";
@import "../styles/primitives/radius.css";
@import "../styles/primitives/spacing.css";
@import "../styles/primitives/typography.css";
@import "../styles/primitives/motion.css";
@import "../styles/primitives/gradient.css";

/* ── Semantic ────────────────────────────────────────────── */
@import "../styles/semantic/elevation.css";
@import "../styles/semantic/surface.css";
@import "../styles/semantic/border.css";
@import "../styles/semantic/transition.css";
@import "../styles/semantic/interaction.css";
@import "../styles/semantic/overlay.css";
@import "../styles/semantic/scrollbar.css";
@import "../styles/semantic/backdrop.css";
@import "../styles/semantic/text-styles.css";

/* ── Components ──────────────────────────────────────────── */
@import "../styles/components/component.css";
`;

// ─── Barrel: Theme imports (per-domain composable) ───────────────────

const INDEX_THEME = `/* AUTO-GENERATED — DO NOT EDIT */
/* Per-domain @theme files — import individually for composable presets */

/* ── Primitives ──────────────────────────────────────────── */
@import "./color.css";
@import "./shadow.css";
@import "./bevel.css";
@import "./glow.css";
@import "./blur.css";
@import "./surface.css";
@import "./radius.css";
@import "./spacing.css";
@import "./typography.css";
@import "./motion.css";
@import "./gradient.css";

/* ── Semantic ────────────────────────────────────────────── */
@import "./elevation.css";
@import "./text-style.css";
@import "./transition.css";
@import "./border.css";
@import "./interaction.css";
@import "./overlay.css";
@import "./scrollbar.css";
@import "./backdrop.css";
`;

// ─── Barrel: TypeScript re-exports ───────────────────────────────────

const INDEX_DTS = `/* AUTO-GENERATED — DO NOT EDIT */

export * from './color.js';
export * from './shadow.js';
export * from './blur.js';
export * from './surface.js';
export * from './spacing.js';
export * from './typography.js';
export * from './motion.js';
export * from './elevation.js';
export * from './border.js';
export * from './interaction.js';
export * from './backdrop.js';
export * from './component.js';
export * from './gradient.js';
`;

// ─── Build ───────────────────────────────────────────────────────────

async function build() {
	// Step 0: Collect component definitions → component-map.ts + registry.json
	console.log('[SD5] Collecting component definitions...');
	execSync('node scripts/build/styledictionary/collect-component-defs.mjs', {
		cwd: process.cwd(),
		stdio: 'inherit',
	});

	// Step 1: Collect colocated component tokens.ts → JSON for SD5
	console.log('[SD5] Collecting colocated component tokens...');
	execSync('npx tsx scripts/build/styledictionary/collect-component-tokens.ts', {
		cwd: process.cwd(),
		stdio: 'inherit',
	});

	console.log('[SD5] Starting token build...');
	console.log('[SD5] Source: tokens/src/*.json (flat domain files + collected component tokens)');
	console.log('[SD5] Output: styles/ (tier-aware), theme/ (per-domain), types/ (per-domain)');

	const sd = new StyleDictionary(config);
	await sd.buildAllPlatforms();

	writeFileSync(`${OUT}/styles/index.css`, INDEX_CSS);
	writeFileSync(`${OUT}/theme/index.css`, INDEX_THEME);
	writeFileSync(`${OUT}/types/index.d.ts`, INDEX_DTS);

	console.log('[SD5] Build complete.');
	console.log(`  Styles: ${OUT}/styles/index.css`);
	console.log(`  Theme:  ${OUT}/theme/index.css`);
	console.log(`  Types:  ${OUT}/types/index.d.ts`);
}

build().catch((err) => {
	console.error('[SD5] Build failed:', err);
	process.exit(1);
});
