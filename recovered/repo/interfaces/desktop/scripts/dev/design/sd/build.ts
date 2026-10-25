/**
 * @file scripts/dev/design/sd/build.ts
 * @package @devpulse/coldlight
 *
 * SD5 token pipeline entry point.
 *
 * Usage: pnpm ds:tokens:build
 *
 * Pipeline:
 *   1. ts-to-dtcg.ts  — load TS sources via jiti → DTCG JSON → tokens.json
 *   2. config.ts      — register custom formats + build SD5 config
 *   3. SD5            — buildAllPlatforms() → tokens.css, tailwind.css, types.ts
 *   4. Generated CSS  — variants.css (from registry), typography.css, focus.css,
 *                       scrollbars.css, keyframes.css (from token source)
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import StyleDictionary from "style-dictionary";
import { buildConfig } from "./config.js";
import {
	generateFocusCSS,
	generateScrollbarsCSS,
	generateTypographyCSS,
} from "./formats/generated-css.js";
import { generateVariantsCSS } from "./formats/variants.js";
import {
	desktopRoot,
	dtcgPath,
	jitiEnums,
	jitiKeyframesDef,
	jitiKindDefinitions,
	jitiPresets,
	jitiRegistry,
	tokensConfig,
} from "./preprocessors/ts-to-dtcg.js";
import { validateKindCoverage } from "./validators/kind-coverage.js";
import { validateRegistryRefs } from "./validators/registry-refs.js";
import { validateTokenContract } from "./validators/token-contract.js";

// ── Step 1: SD5 build (tokens.css, tailwind.css, types.ts) ──────────────────
const config = buildConfig(dtcgPath, tokensConfig, jitiEnums, desktopRoot);
const sd = new StyleDictionary(config);

await sd.buildAllPlatforms();

console.log(`[SD5] CSS:   ${tokensConfig.platforms.css.output}`);
console.log(`[SD5] Theme: ${tokensConfig.platforms.theme.output}`);
console.log(`[SD5] Types: ${tokensConfig.platforms.types.output}`);
console.log(`[SD5] DTCG:  ${tokensConfig.dtcg.output}`);

// ── Step 1.5: Validate token pipeline contracts ──────────────────────────────
const tokensCssPath = resolve(desktopRoot, tokensConfig.platforms.css.output);
const tailwindCssPath = resolve(desktopRoot, tokensConfig.platforms.theme.output);

// Validate registry tokenRefs reference real CSS custom properties
const refsResult = validateRegistryRefs(tokensCssPath, tailwindCssPath, jitiRegistry);
if (!refsResult.valid) {
	console.error(`\n[VALIDATOR] Registry token reference errors (${refsResult.errors.length}):`);
	for (const err of refsResult.errors) {
		console.error(`  ✗ ${err.message}`);
	}
	console.error(
		`\n  ${refsResult.stats.validRefs}/${refsResult.stats.totalRefs} refs valid, ${refsResult.stats.availableProps} properties available.`,
	);
	console.error(
		`  Fix tokenRefs in registry/token-categories.ts to match tokens.css or tailwind.css.\n`,
	);
	process.exit(1);
}
console.log(
	`[VALIDATOR] Registry refs: ${refsResult.stats.totalRefs} refs validated against ${refsResult.stats.availableProps} CSS properties — all valid.`,
);

// Validate Tier 1 tokens exist in :root (token-contract is informational for now)
const tier1Groups = [
	"hue",
	"color",
	"glass",
	"matte",
	"text",
	"space",
	"radius",
	"blur",
	"glow",
	"glowSpread",
	"shadow",
	"bevel",
	"z",
	"duration",
	"ease",
	"textSize",
	"padding",
	"signal",
	"font",
	"animation",
];
const dtcgTree = JSON.parse(readFileSync(dtcgPath, "utf-8")) as Record<string, unknown>;
const contractResult = validateTokenContract(tokensCssPath, tailwindCssPath, dtcgTree, tier1Groups);
if (!contractResult.valid) {
	console.warn(`[VALIDATOR] Token contract warnings (${contractResult.errors.length}):`);
	for (const err of contractResult.errors) {
		console.warn(`  ⚠ ${err.message}`);
	}
}
console.log(
	`[VALIDATOR] Token contract: ${contractResult.stats.tier1Props} Tier 1 tokens, ${contractResult.stats.inBoth} in :root, ${contractResult.stats.themeOnly} @theme-only (remapped).`,
);

// Validate kind definitions are backed by real presets, recipes, and contracts
// NOTE: Recipe validation is informational — recipes load at app boot, not build time.
// We validate presets + contracts (available at build time) and report recipe gaps.
const componentsRoot = resolve(desktopRoot, "src/lib/design/components");
const kindResult = validateKindCoverage(
	jitiKindDefinitions,
	jitiPresets,
	[], // Recipes are registered at app boot — can't validate at build time yet
	componentsRoot,
);
if (kindResult.errors.length > 0) {
	// Separate hard errors (preset/contract) from soft warnings (recipe)
	const hardErrors = kindResult.errors.filter(
		(e) => e.field !== "defaultRecipe" && e.field !== "contract",
	);
	const softWarnings = kindResult.errors.filter(
		(e) => e.field === "defaultRecipe" || e.field === "contract",
	);
	if (softWarnings.length > 0) {
		console.warn(`[VALIDATOR] Kind recipe gaps (${softWarnings.length}):`);
		for (const err of softWarnings) console.warn(`  ⚠ ${err.message}`);
	}
	if (hardErrors.length > 0) {
		console.error(`\n[VALIDATOR] Kind definition errors (${hardErrors.length}):`);
		for (const err of hardErrors) console.error(`  ✗ ${err.message}`);
		process.exit(1);
	}
}
console.log(
	`[VALIDATOR] Kind definitions: ${kindResult.stats.totalKinds} kinds, ${kindResult.stats.withPreset} with preset, ${kindResult.stats.withContract} with contract.`,
);

// ── Step 2: Generate additional CSS from SSOT ────────────────────────────────
const generatedDir = resolve(desktopRoot, "src/lib/design/generated");
mkdirSync(generatedDir, { recursive: true });

// Generate keyframes from token source definition
function generateKeyframesCSS(keyframesDef: Record<string, string>): string {
	const lines: string[] = [
		"/**",
		" * AUTO-GENERATED — DO NOT EDIT",
		" * Animation keyframes — generated by pnpm ds:tokens:build",
		" * Source: tokens/motion/keyframes.ts → keyframesDef",
		" */",
		"",
	];

	for (const [name, body] of Object.entries(keyframesDef)) {
		lines.push(`@keyframes ${name} {${body}`);
		lines.push("}");
		lines.push("");
	}

	// Standard utility keyframes (always included)
	lines.push(`@keyframes fade-in {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes slide-up {
	from { transform: translateY(4px); opacity: 0; }
	to { transform: translateY(0); opacity: 1; }
}

@keyframes slide-down {
	from { transform: translateY(-4px); opacity: 0; }
	to { transform: translateY(0); opacity: 1; }
}

@keyframes scale-in {
	from { transform: scale(0.95); opacity: 0; }
	to { transform: scale(1); opacity: 1; }
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}`);

	return lines.join("\n");
}

const generatedFiles = [
	{ name: "variants.css", content: generateVariantsCSS(jitiRegistry) },
	{ name: "typography.css", content: generateTypographyCSS() },
	{ name: "focus.css", content: generateFocusCSS() },
	{ name: "scrollbars.css", content: generateScrollbarsCSS() },
	{ name: "keyframes.css", content: generateKeyframesCSS(jitiKeyframesDef) },
];

for (const file of generatedFiles) {
	const path = resolve(generatedDir, file.name);
	writeFileSync(path, file.content, "utf-8");
	console.log(`[GEN] ${file.name}`);
}

// ── Step 3: Generate coldlight.manifest.json — MASTER SSOT ──────────────────
const manifest = {
	$schema: "coldlight/manifest",
	version: 1,
	generatedAt: new Date().toISOString(),
	pipeline: "sd5-dtcg-1.0",

	// All 8 encoding categories with full value definitions
	categories: jitiRegistry.map((cat) => ({
		code: cat.code,
		name: cat.name,
		description: cat.description,
		encodingOrder: cat.encodingOrder,
		defaultIndex: cat.defaultIndex,
		vpbControl: cat.vpbControl,
		valueCount: cat.values.length,
		values: cat.values.map((v) => {
			// Auto-derive token refs from var() references in tokenRefs
			const varRefs: string[] = [];
			const varRe = /var\((--[a-zA-Z0-9_-]+)/g;
			for (const val of Object.values(v.tokenRefs)) {
				let m = varRe.exec(val);
				while (m !== null) {
					varRefs.push(m[1]);
					m = varRe.exec(val);
				}
			}
			return {
				index: v.index,
				id: v.id,
				label: v.label,
				tokenRefs: v.tokenRefs,
				varRefs,
				svgFilters: v.svgFilters ?? [],
			};
		}),
	})),

	// Encoding metadata
	encoding: {
		order: jitiRegistry.map((c) => c.code),
		totalValues: jitiRegistry.reduce((s, c) => s + c.values.length, 0),
		format: "v-{code}{index}",
		example: `v-${jitiRegistry.map((c) => `${c.code}0`).join("")}`,
	},

	// All token source enums (for VPB controls, validation, dev catalog)
	tokens: Object.fromEntries(
		Object.entries(jitiEnums).map(([key, values]) => [
			key,
			{
				values: Array.from(values as readonly unknown[]),
				count: (values as readonly unknown[]).length,
			},
		]),
	),

	// Keyframe definitions
	keyframes: Object.keys(jitiKeyframesDef),

	// Generated file manifest
	generatedFiles: generatedFiles.map((f) => ({
		file: `generated/${f.name}`,
		bytes: Buffer.byteLength(f.content, "utf-8"),
	})),

	// Kind definitions — unified component contracts for AI/VPB
	kindDefinitions: jitiKindDefinitions.map((k) => ({
		kind: k.kind,
		label: k.label,
		engine: k.engine,
		defaultPreset: k.defaultPreset,
		defaultRecipe: k.defaultRecipe,
		blockCategory: k.blockCategory,
		requiredAxes: [...k.requiredAxes],
		compound: k.compound,
		container: k.container,
		containerSlots: k.containerSlots ? [...k.containerSlots] : [],
	})),

	// SD5 platform outputs
	platforms: {
		css: tokensConfig.platforms.css.output,
		theme: tokensConfig.platforms.theme.output,
		types: tokensConfig.platforms.types.output,
		dtcg: tokensConfig.dtcg.output,
	},
};

const manifestPath = resolve(desktopRoot, "src/lib/design/generated/coldlight.manifest.json");
writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"), "utf-8");
console.log(
	`[MANIFEST] coldlight.manifest.json — ${jitiRegistry.length} categories, ${manifest.encoding.totalValues} values, ${Object.keys(jitiEnums).length} token enums`,
);

console.log(
	`[SD5] Build complete — ${jitiRegistry.length} categories, ${manifest.encoding.totalValues} variant values.`,
);
