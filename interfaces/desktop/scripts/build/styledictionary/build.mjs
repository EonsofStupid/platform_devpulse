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
 * - src/lib/design/generated/token-manifest.json — VPB manifest
 * Non-token CSS (generated/*.css outside SD5, svg glue) is authored separately
 * and imported from src/lib/design/index.css — not emitted here.
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
@import "./primitives/color.css";
@import "./primitives/shadow.css";
@import "./primitives/bevel.css";
@import "./primitives/glow.css";
@import "./primitives/blur.css";
@import "./primitives/surface.css";
@import "./primitives/radius.css";
@import "./primitives/border-width.css";
@import "./primitives/spacing.css";
@import "./primitives/typography.css";
@import "./primitives/motion.css";
@import "./primitives/gradient.css";
@import "./primitives/layout.css";

/* ── Semantic ────────────────────────────────────────────── */
@import "./semantic/elevation.css";
@import "./semantic/surface.css";
@import "./semantic/border.css";
@import "./semantic/transition.css";
@import "./semantic/interaction.css";
@import "./semantic/overlay.css";
@import "./semantic/scrollbar.css";
@import "./semantic/backdrop.css";
@import "./semantic/text-styles.css";
@import "./semantic/text.css";
@import "./semantic/signal.css";
@import "./semantic/accent.css";
@import "./semantic/role.css";

/* ── Components ──────────────────────────────────────────── */
@import "./components/components.generated.css";
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
@import "./text.css";
@import "./signal.css";
@import "./accent.css";
@import "./role.css";
@import "./text-composed.css";
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
export * from './text.js';
export * from './signal.js';
export * from './accent.js';
export * from './role.js';
`;

// ─── Build ───────────────────────────────────────────────────────────

async function build() {
	// Step 0: Emit the PER-KIND style layer from component @defaults
	// doc-headers (tokens/src/style-defaults.json → --style-{kind}-{variant}-*).
	//
	// NOTE: generate-style-presets.ts (shared --preset-* layer) is deliberately
	// NOT run here. tokens/src/style-presets.json is a HAND-MAINTAINED superset —
	// the button-* presets have no visual/presets/*.ts source, so regenerating
	// from ALL_PRESETS would silently drop them. Run that script manually only
	// when editing presets that DO live under visual/presets/.
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

	writeFileSync(`${OUT}/styles/index.css`, INDEX_CSS);
	writeFileSync(`${OUT}/theme/index.css`, INDEX_THEME);
	writeFileSync(`${OUT}/types/index.d.ts`, INDEX_DTS);

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
