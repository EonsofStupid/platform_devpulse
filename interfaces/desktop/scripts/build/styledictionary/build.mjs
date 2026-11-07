#!/usr/bin/env node
/**
 * @file build.mjs
 * @package @devpulse/coldlight
 *
 * Style Dictionary v5 build pipeline — ONE entry point.
 * Usage: node scripts/build/styledictionary/build.mjs
 *
 * Pipeline:
 *   1. Discover colocated component and feature DTCG JSON
 *   2. SD5 formatAllPlatforms() → in-memory CSS, @theme, types, manifest
 *   3. Validate output inventory, then check or write only changed artifacts
 *
 * Output boundary (no second token pipeline):
 * - packages/coldlight/styles/  — token custom properties (@layer tokens.*)
 * - packages/coldlight/theme/   — Tailwind @theme blocks
 * - packages/coldlight/types/   — generated .d.ts unions
 * - packages/coldlight/generated/token-manifest.json — VPB manifest
 * - domains/<domain>/ui/<name>/<name>.generated.{css,ts} — feature-local looks
 * - src/lib/sys/generated/feature-styles.css — app feature import barrel
 * Non-token CSS (generated/*.css outside SD5, svg glue) is authored separately
 * and imported from packages/coldlight/index.css — not emitted here.
 */

import { basename, dirname, relative, resolve, join } from 'node:path';
import { publishArtifacts } from './artifacts.mjs';
import { kindFamiliesArtifact } from './derive-kind-families.mjs';
import { presetCatalogArtifact } from './generate-preset-catalog.mjs';
import StyleDictionary from 'style-dictionary';
import { kindTypes } from './kind-css.mjs';
import config, { FEATURE_FILES, KIND_FILES, SURFACE_DEFAULT, SURFACE_FAMILIES } from './sd.config.mjs';
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

export * from "./accent.js";
export * from "./backdrop.js";
export * from "./blur.js";
export * from "./border.js";
export * from "./color.js";
export * from "./component.js";
export * from "./elevation.js";
export * from "./gradient.js";
export * from "./icon.js";
export * from "./interaction.js";
export * from "./motion.js";
export * from "./role.js";
export * from "./shadow.js";
export * from "./signal.js";
export * from "./spacing.js";
export * from "./surface.js";
export * from "./text.js";
export * from "./typography.js";
`;

// ─── Build ───────────────────────────────────────────────────────────

async function build() {
	const artifacts = [kindFamiliesArtifact(), presetCatalogArtifact()];
	const emit = (destination, output) => artifacts.push({ destination, output });
	const sd = new StyleDictionary(config);
	const platforms = await sd.formatAllPlatforms();
	for (const files of Object.values(platforms)) {
		for (const file of files) {
			if (file.destination && file.output !== undefined) artifacts.push(file);
		}
	}
	const featureBarrel = 'src/lib/sys/generated/feature-styles.css';
	const featureImports = FEATURE_FILES.map(({ kind, path, group, meta }) => {
		const name = basename(path, '.tokens.json');
		emit(`${dirname(path)}/${name}.generated.ts`, kindTypes(kind, group, meta));
		const css = `${dirname(path)}/${name}.generated.css`;
		return `@import "${relative(dirname(featureBarrel), css).replaceAll('\\', '/')}" layer(components);`;
	});
	emit(featureBarrel, ['/* AUTO-GENERATED — DO NOT EDIT. Feature-local UI styles. */', ...featureImports, ''].join('\n'));

	// Kinds (plan 0006 §0s): each kind file's typed unions beside it, and the
	// barrel importing every kind's generated CSS.
	for (const { kind, group, meta } of KIND_FILES) {
		emit(`${OUT}/components/${kind}/${kind}.generated.ts`, kindTypes(kind, group, meta));
	}
	const kindImports = KIND_FILES.map(({ kind }) => `@import "./${kind}.css";`);
	emit(
		`${OUT}/styles/components/kinds/index.css`,
		['/* AUTO-GENERATED — DO NOT EDIT. One file per colocated kind tokens file. */', ...kindImports, ''].join('\n'),
	);
	console.log(`[SD5] Kinds: ${KIND_FILES.map(({ kind }) => kind).join(', ') || '(none yet)'}`);

	// The family scope's typed families and roles, beside styleAttrs (plan 0006 0s.5).
	emit(`${OUT}/renderforge/generated/surfaces.ts`, surfaceTypes(SURFACE_FAMILIES, SURFACE_DEFAULT));
	console.log(`[SD5] Surface families: ${SURFACE_FAMILIES.map(({ family }) => family).join(', ')} (root: ${SURFACE_DEFAULT})`);

	emit(`${OUT}/styles/index.css`, INDEX_CSS);
	emit(`${OUT}/theme/index.css`, INDEX_THEME);
	emit(`${OUT}/types/index.d.ts`, INDEX_DTS);

	// The desktop imports its design tree. Publish the same token artifacts
	// there from the same build, while package consumers still use ColdLight.
	const packageRoot = resolve(OUT);
	const desktopDesign = 'src/lib/design';
	for (const artifact of [...artifacts]) {
		const rel = relative(packageRoot, resolve(artifact.destination)).replaceAll('\\', '/');
		if (/^(styles|theme|types)\//.test(rel) || /^svg\/presets\/.*\.css$/.test(rel)) {
			emit(join(desktopDesign, rel), artifact.output);
		}
	}

	for (const artifact of artifacts) {
		if (artifact.destination.endsWith('.d.ts')) artifact.output = artifact.output.trimEnd() + '\n';
	}
	const result = publishArtifacts(resolve('../..'), `${OUT}/generated/token-build-outputs.json`, artifacts, {
		check: process.argv.includes('--check'),
	});
	console.log(`[SD5] ${result.total} outputs verified; ${result.changed} changed.`);

}

build().catch((err) => {
	console.error('[SD5] Build failed:', err);
	process.exit(1);
});
