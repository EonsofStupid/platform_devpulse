/**
 * @file scripts/coldlight/generate-inventory.ts
 * @module @devpulse/scripts/coldlight/generate-inventory
 * @package @devpulse/scripts
 *
 * Auto-generates the ColdLight Master Inventory markdown from the platform scanner.
 * Replaces hand-maintained COLDLIGHT_MASTER_INVENTORY.md.
 *
 * Usage:
 *   pnpm coldlight:inventory           — Print to stdout
 *   pnpm coldlight:inventory --write   — Write to scripts/docs/.claude/COLDLIGHT_MASTER_INVENTORY.md
 *
 * @since 1.0.0
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { scanPlatform } from "../dev/platform-scanner.js";
import type {
	AdapterKindSummary,
	BlueprintSummary,
	ComponentKindSummary,
	DevPulseManifest,
	PrimitiveCategory,
	PrimitiveSummary,
	RecipeSummary,
} from "../dev/platform-scanner.types.js";

// =============================================================================
// CONSTANTS
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DESKTOP_ROOT = path.resolve(__dirname, "../..");
const PLATFORM_ROOT = path.resolve(DESKTOP_ROOT, "../..");
const OUTPUT_PATH = path.resolve(
	PLATFORM_ROOT,
	"scripts/docs/.claude/COLDLIGHT_MASTER_INVENTORY.md",
);

// =============================================================================
// HELPERS
// =============================================================================

function status(done: boolean): string {
	return done ? "DONE" : "—";
}

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

// =============================================================================
// SECTION GENERATORS
// =============================================================================

function generateHeader(): string {
	return `# ColdLight Master Inventory v2 — SSOT

> **Status**: ACTIVE — this file drives ALL sprint planning
> **Verified against**: melt@0.44.0 — source: next.melt-ui.com
> **Package**: \`npm i melt@0.44.0\`
> **Svelte 5**: runes-native. Zero stores. Class-based builders.
> **Last generated**: ${today()}
> **Generator**: \`pnpm coldlight:inventory\` (auto-generated — do NOT edit manually)

---

## CRITICAL RULES

1. \`melt\` imports NEVER leak past the adapter layer (\`_internal/\`)
2. ColdLight-owned = no adapter, ColdLight builds its own builder
3. Late-binding ARIA: melt handles its own behavior, ColdLight handles its own ARIA
4. \`data-kind\` / \`data-slot\` / \`data-state\` on EVERY primitive
5. \`mergeAttrs()\` when combining melt spreads with ColdLight attrs
6. No stores. No \`$\`. No \`createX()\`. No \`use:melt={}\`. Class builders only.
7. Controlled state: getter + \`onXChange\` callback
8. Schema-guarded absorption only — no migration from old code
9. Every primitive declares a VPB manifest (design-time introspection contract)
10. At build: tree-shake to project-specific subset. Dev: full library available.

---

## STATUS KEY

| Symbol | Meaning |
|--------|---------|
| DONE | Complete, committed, verified |
| — | Not yet implemented |

---
`;
}

function generateMeltBackedSection(
	primitives: readonly PrimitiveSummary[],
	meltAdapters: readonly AdapterKindSummary[],
): string {
	const meltPrims = primitives.filter((p) => p.category === "melt-backed");
	const adapterComplete = meltAdapters.filter((a) => a.isComplete).length;
	const svelteComplete = meltPrims.filter((p) => p.hasSvelte).length;

	let md = `## 1. MELT-BACKED PRIMITIVES (${meltPrims.length} stable via dsAdapter)

MeltUI is NEVER exposed publicly. ColdLight wraps via dsAdapter + mergeAttrs().

### 1a. _internal Transport Layer (factory + _transport)

| # | Primitive | _internal Status |
|---|-----------|-----------------|
`;

	meltPrims.forEach((p, i) => {
		// Check if adapter exists (use name without dashes for melt)
		const meltName = p.kind.replace(/-/g, "");
		const adapter = meltAdapters.find((a) => a.kind === meltName || a.kind === p.kind);
		const adapterStatus = adapter?.isComplete ? "DONE" : "—";
		md += `| ${i + 1} | ${p.kindPascal} | ${adapterStatus} |\n`;
	});

	md += `\n**_internal transport: ${adapterComplete}/${meltPrims.length} DONE**\n\n`;

	md += `### 1b. Primitive .svelte (structureless, transport-consuming)

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
`;

	meltPrims.forEach((p, i) => {
		md += `| ${i + 1} | ${p.kindPascal} | ${status(p.hasSvelte)} | ${status(p.hasTypes)} | ${status(p.hasContract)} |\n`;
	});

	md += `\n**Melt-backed .svelte: ${svelteComplete}/${meltPrims.length} DONE**\n\n---\n\n`;

	return md;
}

function generateCategorySection(
	sectionNum: number,
	title: string,
	subtitle: string,
	category: PrimitiveCategory,
	primitives: readonly PrimitiveSummary[],
): string {
	const prims = primitives.filter((p) => p.category === category);
	if (prims.length === 0) return "";

	const svelteComplete = prims.filter((p) => p.hasSvelte).length;

	let md = `## ${sectionNum}. ${title} (${prims.length})

${subtitle}

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
`;

	prims.forEach((p, i) => {
		md += `| ${i + 1} | ${p.kindPascal} | ${status(p.hasSvelte)} | ${status(p.hasTypes)} | ${status(p.hasContract)} |\n`;
	});

	md += `\n**${title.split(" — ")[0]} .svelte: ${svelteComplete}/${prims.length} DONE**\n\n---\n\n`;

	return md;
}

function generateActionsSection(manifest: DevPulseManifest): string {
	const actions = manifest.coldlight.actions;
	const actionFiles = actions.filter((a) => a.localPath.startsWith("use"));

	let md = `## 10. COLDLIGHT UTILITY ACTIONS (${actionFiles.length})

Reusable behavior. Svelte \`use:action\` pattern, runes-native.

| # | Action | Status |
|---|--------|--------|
`;

	actionFiles.forEach((a, i) => {
		const name = a.localPath.replace(/\.ts$/, "");
		md += `| ${i + 1} | ${name} | DONE |\n`;
	});

	md += `\n**Utility Actions: ${actionFiles.length}/${actionFiles.length} DONE**\n\n---\n\n`;

	return md;
}

function generateUtilsSection(manifest: DevPulseManifest): string {
	const utils = manifest.coldlight.utils;
	const utilFiles = utils.filter((u) => u.localPath !== "index.ts");

	let md = `## 11. COLDLIGHT UTILITY FUNCTIONS (${utilFiles.length})

Pure functions. No DOM, no Svelte dependency.

| # | Utility | Status |
|---|---------|--------|
`;

	utilFiles.forEach((u, i) => {
		const name = u.localPath.replace(/\.ts$/, "");
		md += `| ${i + 1} | ${name} | DONE |\n`;
	});

	md += `\n**Utility Functions: ${utilFiles.length}/${utilFiles.length} DONE**\n\n---\n\n`;

	return md;
}

function generateComponentsSection(components: readonly ComponentKindSummary[]): string {
	if (components.length === 0) return "";

	let md = `## 12. COMPONENT LAYER

Styled components: primitive + recipe + ARIA.

| # | Kind | .svelte | types.ts | contract.ts | recipe.ts |
|---|------|---------|----------|-------------|-----------|
`;

	components.forEach((c, i) => {
		md += `| ${i + 1} | ${c.kind} | ${status(c.hasSvelte)} | ${status(c.hasTypes)} | ${status(c.hasContract)} | ${status(c.hasRecipe)} |\n`;
	});

	md += `\n**Component Layer: ${components.filter((c) => c.hasSvelte).length}/${components.length} with .svelte**\n\n---\n\n`;

	return md;
}

function generateRecipesSection(recipes: readonly RecipeSummary[]): string {
	if (recipes.length === 0) return "";

	const components = recipes.filter((r) => r.group === "components");
	const layouts = recipes.filter((r) => r.group === "layouts");

	let md = `## 13. RECIPES

Styling patterns applied via class prop.

### Components (${components.length})

| # | Kind | Variants | index.ts | types.ts |
|---|------|----------|----------|----------|
`;

	components.forEach((r, i) => {
		md += `| ${i + 1} | ${r.kind} | ${r.variants.join(", ")} | ${status(r.hasIndex)} | ${status(r.hasTypes)} |\n`;
	});

	md += `\n### Layouts (${layouts.length})

| # | Kind | Variants | index.ts |
|---|------|----------|----------|
`;

	layouts.forEach((r, i) => {
		md += `| ${i + 1} | ${r.kind} | ${r.variants.join(", ")} | ${status(r.hasIndex)} |\n`;
	});

	md += `\n---\n\n`;

	return md;
}

function generateBlueprintsSection(blueprints: readonly BlueprintSummary[]): string {
	if (blueprints.length === 0) return "";

	let md = `## 14. BLUEPRINTS

| # | Kind | Variants | index.ts | types.ts |
|---|------|----------|----------|----------|
`;

	blueprints.forEach((b, i) => {
		md += `| ${i + 1} | ${b.kind} | ${b.variants.join(", ")} | ${status(b.hasIndex)} | ${status(b.hasTypes)} |\n`;
	});

	md += `\n---\n\n`;

	return md;
}

function generateAdaptersSection(manifest: DevPulseManifest): string {
	const melt = manifest.coldlight.adapters.meltui;
	const cl = manifest.coldlight.adapters.coldlight;

	let md = `## 15. ADAPTER LAYER

### MeltUI Adapters (${melt.length})

| # | Kind | factory | _transport | Complete |
|---|------|---------|------------|----------|
`;

	melt.forEach((a, i) => {
		md += `| ${i + 1} | ${a.kind} | ${status(a.hasFactory)} | ${status(a.hasTransport && a.hasTransportTypes && a.hasTransportFactory)} | ${status(a.isComplete)} |\n`;
	});

	md += `\n### ColdLight Adapters (${cl.length})

| # | Kind | builder | _transport | Complete |
|---|------|---------|------------|----------|
`;

	cl.forEach((a, i) => {
		md += `| ${i + 1} | ${a.kind} | ${status(a.hasFactory)} | ${status(a.hasTransport && a.hasTransportTypes && a.hasTransportFactory)} | ${status(a.isComplete)} |\n`;
	});

	md += `\n---\n\n`;

	return md;
}

function generateTotalsSection(manifest: DevPulseManifest): string {
	const cl = manifest.stats.coldlight;
	const prims = manifest.coldlight.primitives;

	const meltPrims = prims.filter((p) => p.category === "melt-backed");
	const interactivePrims = prims.filter((p) => p.category === "interactive");
	const layoutPrims = prims.filter((p) => p.category === "layout");
	const typoPrims = prims.filter((p) => p.category === "typography");
	const dataPrims = prims.filter((p) => p.category === "data-display");
	const feedbackPrims = prims.filter((p) => p.category === "feedback");
	const formPrims = prims.filter((p) => p.category === "form");
	const navPrims = prims.filter((p) => p.category === "navigation");
	const overlayPrims = prims.filter((p) => p.category === "overlay");

	const catRows = (label: string, prms: readonly PrimitiveSummary[]) => {
		const done = prms.filter((p) => p.hasSvelte).length;
		return `| ${label} .svelte | ${prms.length} | ${done} | ${prms.length - done} |`;
	};

	return `## TOTALS

| Category | Count | Done | Remaining |
|----------|-------|------|-----------|
| Melt _internal transport | ${meltPrims.length} | ${manifest.coldlight.adapters.meltui.filter((a) => a.isComplete).length} | ${meltPrims.length - manifest.coldlight.adapters.meltui.filter((a) => a.isComplete).length} |
${catRows("Melt-backed", meltPrims)}
${catRows("ColdLight interactive", interactivePrims)}
${catRows("Layout", layoutPrims)}
${catRows("Typography", typoPrims)}
${catRows("Data Display", dataPrims)}
${catRows("Feedback", feedbackPrims)}
${catRows("Form", formPrims)}
${catRows("Navigation", navPrims)}
${catRows("Overlay", overlayPrims)}
| Utility Actions | ${cl.actions} | ${cl.actions} | 0 |
| Utility Functions | ${cl.utils} | ${cl.utils} | 0 |
| Component Layer | ${cl.components} | ${manifest.coldlight.components.filter((c) => c.hasSvelte).length} | ${cl.components - manifest.coldlight.components.filter((c) => c.hasSvelte).length} |
| Recipes | ${cl.recipes} | ${cl.recipes} | 0 |
| Blueprints | ${cl.blueprints} | ${cl.blueprints} | 0 |
| **TOTAL PRIMITIVES** | **${cl.totalPrimitives}** | **${cl.primitivesWithSvelte}** | **${cl.totalPrimitives - cl.primitivesWithSvelte}** |

---

## HEADER COMPLIANCE

| Metric | Count |
|--------|-------|
| Total Files | ${manifest.headerCompliance.totalFiles} |
| OK | ${manifest.headerCompliance.ok} |
| Missing Header | ${manifest.headerCompliance.missing} |
| Incomplete Header | ${manifest.headerCompliance.wrong} |

Run \`pnpm headers:fix\` to patch missing tags and inject missing headers.

---

## PLATFORM-WIDE NAMESPACES

| Namespace | Files |
|-----------|-------|
| @devpulse/coldlight | ${manifest.coldlight.actions.length + manifest.coldlight.utils.length + manifest.coldlight.tokens.length + manifest.coldlight.config.length + manifest.coldlight.molecules.length} (non-primitive) |
| @devpulse/sys | ${manifest.sys.fileCount} |
${Object.entries(manifest.domains)
	.map(([d, ns]) => `| @devpulse/domains/${d} | ${ns.fileCount} |`)
	.join("\n")}
| @devpulse/routes | ${manifest.routes.fileCount} |
| @devpulse/tauri | ${manifest.tauri.fileCount} |
| @devpulse/engine | ${manifest.engine.fileCount} |
| @devpulse/maestro | ${manifest.maestro.fileCount} |
| @devpulse/scripts | ${manifest.scripts.fileCount} |

---

## SPRINT CARVING

Sprints are carved FROM this inventory. When a sprint completes, regenerate this file.

### Next Sprint: SPRINT-MELT-SVELTE
**Scope**: All ${meltPrims.length} melt-backed .svelte primitives
**Prerequisite**: _internal transport layer (DONE)
**Pattern**: Structureless primitives consuming transport, ColdLight ARIA per contract

### After That: SPRINT-COLDLIGHT-BUILDERS
**Scope**: ColdLight's own builder system for the ${interactivePrims.filter((p) => !p.hasSvelte).length} remaining interactive primitives
**Pattern**: React Aria-inspired, W3C APG-driven, dsAdapter interface

### After That: SPRINT-REMAINING-SVELTE
**Scope**: Remaining form + overlay primitives
**Includes**: ${[...formPrims, ...overlayPrims]
		.filter((p) => !p.hasSvelte)
		.map((p) => p.kindPascal)
		.join(", ")}
`;
}

// =============================================================================
// MAIN
// =============================================================================

function generateInventory(manifest: DevPulseManifest): string {
	const cl = manifest.coldlight;

	let md = generateHeader();

	// Section 1: Melt-backed
	md += generateMeltBackedSection(cl.primitives, cl.adapters.meltui);

	// Sections 2-9: Primitive categories
	md += generateCategorySection(
		2,
		"COLDLIGHT-OWNED PRIMITIVES — Interactive",
		"No adapter. ColdLight owns W3C APG, ARIA, keyboard, everything.",
		"interactive",
		cl.primitives,
	);
	md += generateCategorySection(
		3,
		"COLDLIGHT-OWNED PRIMITIVES — Layout",
		"Structural primitives. No ARIA complexity. Token-driven spacing/sizing.",
		"layout",
		cl.primitives,
	);
	md += generateCategorySection(
		4,
		"COLDLIGHT-OWNED PRIMITIVES — Typography",
		"Text rendering primitives. Token-driven scale/weight/leading.",
		"typography",
		cl.primitives,
	);
	md += generateCategorySection(
		5,
		"COLDLIGHT-OWNED PRIMITIVES — Data Display",
		"Data presentation primitives.",
		"data-display",
		cl.primitives,
	);
	md += generateCategorySection(
		6,
		"COLDLIGHT-OWNED PRIMITIVES — Feedback",
		"User feedback and loading indicators.",
		"feedback",
		cl.primitives,
	);
	md += generateCategorySection(
		7,
		"COLDLIGHT-OWNED PRIMITIVES — Form",
		"Form input primitives.",
		"form",
		cl.primitives,
	);
	md += generateCategorySection(
		8,
		"COLDLIGHT-OWNED PRIMITIVES — Navigation",
		"Navigation and wayfinding primitives.",
		"navigation",
		cl.primitives,
	);
	md += generateCategorySection(
		9,
		"COLDLIGHT-OWNED PRIMITIVES — Overlay",
		"Modal and overlay primitives.",
		"overlay",
		cl.primitives,
	);

	// Sections 10-11: Actions, Utils
	md += generateActionsSection(manifest);
	md += generateUtilsSection(manifest);

	// Section 12: Components
	md += generateComponentsSection(cl.components);

	// Section 13: Recipes
	md += generateRecipesSection(cl.recipes);

	// Section 14: Blueprints
	md += generateBlueprintsSection(cl.blueprints);

	// Section 15: Adapters
	md += generateAdaptersSection(manifest);

	// Totals + Platform
	md += generateTotalsSection(manifest);

	return md;
}

function main(): void {
	const args = process.argv.slice(2);
	const writeFlag = args.includes("--write");

	const { manifest } = scanPlatform();
	const md = generateInventory(manifest);

	if (writeFlag) {
		const outputDir = path.dirname(OUTPUT_PATH);
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}
		fs.writeFileSync(OUTPUT_PATH, md, "utf-8");
		console.log(`Inventory written to: ${OUTPUT_PATH}`);
	} else {
		console.log(md);
	}
}

main();
