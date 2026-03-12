#!/usr/bin/env npx tsx
/**
 * @file build.ts
 * @package @devpulse/coldlight
 *
 * Runs the Style Dictionary v5 build pipeline.
 * Usage: npx tsx scripts/build/styledictionary/build.ts
 */

import { writeFileSync } from 'node:fs';
import StyleDictionary from 'style-dictionary';
import config from './sd.config.js';

const BUILD = 'tokens/build';

/** Layer-ordered barrel import for CSS */
const INDEX_CSS = `/* AUTO-GENERATED — DO NOT EDIT */

/* ── Layer order declaration ─────────────────────────────── */
@layer tokens.primitives, tokens.semantic, tokens.components;

/* ── Primitives ──────────────────────────────────────────── */
@import "./css/primitives/color.css";
@import "./css/primitives/shadow.css";
@import "./css/primitives/bevel.css";
@import "./css/primitives/glow.css";
@import "./css/primitives/blur.css";
@import "./css/primitives/surface.css";
@import "./css/primitives/radius.css";
@import "./css/primitives/spacing.css";
@import "./css/primitives/typography.css";
@import "./css/primitives/motion.css";

/* ── Semantic ────────────────────────────────────────────── */
@import "./css/semantic/elevation.css";
@import "./css/semantic/surfaces.css";
@import "./css/semantic/borders.css";
@import "./css/semantic/transitions.css";
@import "./css/semantic/interaction.css";
@import "./css/semantic/overlay.css";
@import "./css/semantic/scrollbar.css";
@import "./css/semantic/backdrop.css";
@import "./css/semantic/text-styles.css";

/* ── Components ──────────────────────────────────────────── */
@import "./css/components/components.css";
`;

/** Barrel re-export for TypeScript types */
const INDEX_DTS = `/* AUTO-GENERATED — DO NOT EDIT */

export * from './color.js';
export * from './shadow.js';
export * from './blur.js';
export * from './surface.js';
export * from './spacing.js';
export * from './typography.js';
export * from './motion.js';
export * from './elevation.js';
export * from './borders.js';
export * from './interaction.js';
export * from './backdrop.js';
export * from './components.js';
`;

async function build() {
	console.log('[SD5] Starting token build...');
	const sd = new StyleDictionary(config);
	await sd.buildAllPlatforms();

	// Write barrel files
	writeFileSync(`${BUILD}/index.css`, INDEX_CSS);
	writeFileSync(`${BUILD}/types/index.d.ts`, INDEX_DTS);

	console.log('[SD5] Build complete.');
	console.log(`  CSS:   ${BUILD}/index.css (imports ${BUILD}/css/*)`);
	console.log(`  TW:    ${BUILD}/tailwind.css`);
	console.log(`  Types: ${BUILD}/types/index.d.ts`);
}

build().catch((err) => {
	console.error('[SD5] Build failed:', err);
	process.exit(1);
});
