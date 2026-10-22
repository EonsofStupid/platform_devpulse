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
 *
 * Output boundary (no second token pipeline):
 * - packages/coldlight/styles/  — token custom properties (@layer tokens.*)
 * - packages/coldlight/theme/   — Tailwind @theme blocks
 * - packages/coldlight/types/   — generated .d.ts unions
 * - packages/coldlight/generated/token-manifest.json — VPB manifest
 * Non-token CSS (generated/*.css outside SD5, svg glue) is authored separately
 * and imported from packages/coldlight/index.css — not emitted here.
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import StyleDictionary from 'style-dictionary';
import { kindTypes } from './kind-css.mjs';
import config, { KIND_FILES, SURFACE_DEFAULT, SURFACE_FAMILIES } from './sd.config.mjs';
import { surfaceTypes } from './surface-scopes.mjs';

const OUT = '../../packages/coldlight';

// ─── Barrel: CSS imports with layer order ────────────────────────────

/** `@import` lines for a platform's files, in the order the config lists them. */
const importsOf = (platform, dir) =>
	config.platforms[platform].files.map((file) => `@import "./${dir}/${file.destination}";`).join('\n');

// The imports come from the config's file lists, so a file the config emits
// is always imported (claude.css was emitted and never imported).
const INDEX_CSS = `/* AUTO-GENERATED — DO NOT EDIT */

/* ── Layer order declaration ─────────────────────────────── */
@layer tokens.primitives, tokens.semantic, tokens.components, tokens.scopes;

/* ── Primitives ──────────────────────────────────────────── */
${importsOf('css-primitives', 'primitives')}

/* ── Semantic ────────────────────────────────────────────── */
${importsOf('css-semantic', 'semantic')}

/* ── Components ──────────────────────────────────────────── */
@import "./components/components.generated.css";

/* ── Scopes ──────────────────────────────────────────────── */
${importsOf('css-scopes', 'scopes')}
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
@import "./icon.css";
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
export * from './icon.js';
`;

// ─── Build ───────────────────────────────────────────────────────────

async function build() {
	// Step 0: Scan element annotations → ui-catalog.json
	console.log('[SD5] Scanning element seed definitions...');
	execSync('node scripts/build/styledictionary/collect-element-seed-defs.mjs', {
		cwd: process.cwd(),
		stdio: 'inherit',
	});

	// Step 1: Collect colocated component tokens.ts → JSON for SD5
	console.log('[SD5] Collecting colocated component tokens...');
	execSync('npx tsx scripts/build/styledictionary/collect-component-tokens.ts', {
		cwd: process.cwd(),
		stdio: 'inherit',
	});

	// Step 2: Expand preset shorthand → 11-axis DTCG in component.json
	console.log('[SD5] Expanding preset styles...');
	execSync('node scripts/build/styledictionary/collect-preset-styles.mjs', {
		cwd: process.cwd(),
		stdio: 'inherit',
	});

	// Step 3: Derive kind → family mapping from enriched presets
	console.log('[SD5] Deriving kind families...');
	execSync('node scripts/build/styledictionary/derive-kind-families.mjs', {
		cwd: process.cwd(),
		stdio: 'inherit',
	});

	console.log('[SD5] Starting token build...');
	console.log('[SD5] Source: tokens/src/*.json (flat domain files + collected component tokens)');
	console.log('[SD5] Output: styles/ (tier-aware), theme/ (per-domain), types/ (per-domain)');

	const sd = new StyleDictionary(config);
	await sd.buildAllPlatforms();

	// The preset catalog, from the one preset source (plan 0006 0s.2)
	execSync('node scripts/build/styledictionary/generate-preset-catalog.mjs', {
		cwd: process.cwd(),
		stdio: 'inherit',
	});

	// Kinds (plan 0006 §0s): each kind file's typed unions beside it, and the
	// barrel importing every kind's generated CSS.
	for (const { kind, group, meta } of KIND_FILES) {
		writeFileSync(`${OUT}/components/${kind}/${kind}.generated.ts`, kindTypes(kind, group, meta));
	}
	mkdirSync(`${OUT}/styles/components/kinds`, { recursive: true });
	const kindImports = KIND_FILES.map(({ kind }) => `@import "./${kind}.css";`);
	writeFileSync(
		`${OUT}/styles/components/kinds/index.css`,
		['/* AUTO-GENERATED — DO NOT EDIT. One file per colocated kind tokens file. */', ...kindImports, ''].join('\n'),
	);
	console.log(`[SD5] Kinds: ${KIND_FILES.map(({ kind }) => kind).join(', ') || '(none yet)'}`);

	// The family scope's typed families and roles, beside styleAttrs (plan 0006 0s.5).
	writeFileSync(`${OUT}/renderforge/generated/surfaces.ts`, surfaceTypes(SURFACE_FAMILIES, SURFACE_DEFAULT));
	console.log(`[SD5] Surface families: ${SURFACE_FAMILIES.map(({ family }) => family).join(', ')} (root: ${SURFACE_DEFAULT})`);

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
