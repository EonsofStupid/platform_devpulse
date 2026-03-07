/**
 * @file scripts/dev/design/sd/preprocessors/ts-to-dtcg.ts
 * @package @devpulse/coldlight
 *
 * Loads ColdLight TS token sources via jiti.
 * Converts to DTCG 1.0 JSON structure.
 * Writes tokens.json to tokensConfig.dtcg.output.
 *
 * Also loads TOKEN_CATEGORY_REGISTRY for the variants generator
 * and keyframesDef for the keyframes generator.
 *
 * Tier 2 (semantic) and Tier 3 (component) tokens go to DTCG root
 * WITHOUT their wrapper keys — semantic categories (surface, border, depth,
 * transition) and component kinds (button, panel, etc.) become top-level
 * DTCG groups. SD5 name/kebab then produces --surface-primary, --button-bg, etc.
 *
 * Exports: { dtcgPath, tokensConfig, jitiEnums, jitiRegistry, jitiKeyframesDef, desktopRoot }
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const __dirname = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(__dirname, "../../../../../");

const jiti = createJiti(import.meta.url, { moduleCache: false });

// ─── Load tokens pipeline config ─────────────────────────────────────────────
const tokensMod = await jiti.import(
	resolve(desktopRoot, "src/lib/design/config/coldlight/tokens.cfg.ts"),
) as { TOKENS: Record<string, unknown> };

const tokensConfig = tokensMod.TOKENS as {
	sdVersion: number;
	sources: { globals: string; semantic: string; components: string };
	dtcg: { output: string; formatVersion: string };
	platforms: {
		css: { enabled: boolean; output: string };
		theme: { enabled: boolean; output: string };
		types: { enabled: boolean; output: string };
	};
	themeMappings: Record<string, { namespace: string; prefix: string | null }>;
};

// ─── Load Tier 1 SSOT (barrel file re-exports from organized sources) ────────
const tokensMod2 = await jiti.import(resolve(desktopRoot, tokensConfig.sources.globals)) as {
	hue: Record<string, string>;
	color: Record<string, Record<string, string>>;
	glass: Record<string, string>;
	matte: Record<string, string>;
	text: Record<string, string>;
	space: Record<string, string>;
	radius: Record<string, string>;
	blur: Record<string, string>;
	glow: Record<string, string>;
	glowSpread: Record<string, string>;
	shadow: Record<string, string>;
	bevel: Record<string, string>;
	z: Record<string, string>;
	duration: Record<string, string>;
	ease: Record<string, string>;
	textSize: Record<string, string>;
	padding: Record<string, string>;
	signal: Record<string, string>;
	font: Record<string, string>;
	animation: Record<string, string>;
	keyframesDef: Record<string, string>;
	enums: Record<string, readonly (string | number)[]>;
	// Composite tokens (SD5 auto-expands these)
	textStyle: Record<string, Record<string, string | number>>;
	borderStyle: Record<string, Record<string, string>>;
	transitionStyle: Record<string, Record<string, string>>;
};

const semMod = await jiti.import(resolve(desktopRoot, tokensConfig.sources.semantic)) as {
	semantic: Record<string, Record<string, string>>;
};

const compMod = await jiti.import(resolve(desktopRoot, tokensConfig.sources.components)) as {
	components: Record<string, Record<string, string>>;
};

// ─── Load SSOT Registry ──────────────────────────────────────────────────────
const registryMod = await jiti.import(
	resolve(desktopRoot, "src/lib/design/registry/token-categories.ts"),
) as {
	TOKEN_CATEGORY_REGISTRY: Array<{
		code: string;
		name: string;
		description: string;
		values: Array<{
			index: number;
			id: string;
			label: string;
			tokenRefs: Record<string, string>;
			svgFilters?: string[];
		}>;
		defaultIndex: number;
		encodingOrder: number;
		vpbControl: string;
	}>;
};

const jitiRegistry = registryMod.TOKEN_CATEGORY_REGISTRY;

// ─── DTCG helpers ─────────────────────────────────────────────────────────────

function toGroup(
	obj: Record<string, string>,
	type: string,
): Record<string, { $type: string; $value: string }> {
	const group: Record<string, { $type: string; $value: string }> = {};
	for (const [key, value] of Object.entries(obj)) {
		group[key] = { $type: type, $value: value };
	}
	return group;
}

function toNestedGroup(
	obj: Record<string, Record<string, string>>,
	type: string,
): Record<string, Record<string, { $type: string; $value: string }>> {
	const group: Record<string, Record<string, { $type: string; $value: string }>> = {};
	for (const [key, subObj] of Object.entries(obj)) {
		group[key] = toGroup(subObj, type);
	}
	return group;
}

/**
 * Converts a record of composite objects into DTCG composite token groups.
 * SD5 with `expand: true` will auto-expand each composite into individual tokens.
 * e.g. textStyle.display-lg → --textStyle-display-lg-fontSize, --textStyle-display-lg-fontFamily, etc.
 */
function toCompositeGroup(
	obj: Record<string, Record<string, string | number>>,
	type: string,
): Record<string, { $type: string; $value: Record<string, string | number> }> {
	const group: Record<string, { $type: string; $value: Record<string, string | number> }> = {};
	for (const [key, value] of Object.entries(obj)) {
		group[key] = { $type: type, $value: value };
	}
	return group;
}

// ─── Build DTCG ───────────────────────────────────────────────────────────────
const dtcg: Record<string, unknown> = {
	$schema: "https://design-tokens.github.io/community-group/format/",
	$description: "ColdLight Design System — DTCG 1.0. AUTO-GENERATED.",

	// ── Tier 1: Global tokens ─────────────────────────────────────────────────
	hue:        toGroup(tokensMod2.hue,        "number"),
	color:      toNestedGroup(tokensMod2.color, "color"),
	glass:      toGroup(tokensMod2.glass,      "color"),
	matte:      toGroup(tokensMod2.matte,      "color"),
	text:       toGroup(tokensMod2.text,       "color"),
	space:      toGroup(tokensMod2.space,      "dimension"),
	radius:     toGroup(tokensMod2.radius,     "dimension"),
	blur:       toGroup(tokensMod2.blur,       "dimension"),
	glow:       toGroup(tokensMod2.glow,       "shadow"),
	glowSpread: toGroup(tokensMod2.glowSpread, "dimension"),
	shadow:     toGroup(tokensMod2.shadow,     "shadow"),
	bevel:      toGroup(tokensMod2.bevel,      "shadow"),
	z:          toGroup(tokensMod2.z,          "number"),
	duration:   toGroup(tokensMod2.duration,   "duration"),
	ease:       toGroup(tokensMod2.ease,       "cubicBezier"),
	textSize:   toGroup(tokensMod2.textSize,   "dimension"),
	padding:    toGroup(tokensMod2.padding,    "other"),
	signal:     toGroup(tokensMod2.signal,     "color"),
	font:       toGroup(tokensMod2.font,       "fontFamily"),
	animation:  toGroup(tokensMod2.animation,  "other"),

	// ── Tier 1: Composite tokens (SD5 auto-expands) ──────────────────────────
	textStyle:       toCompositeGroup(tokensMod2.textStyle,       "typography"),
	borderStyle:     toCompositeGroup(tokensMod2.borderStyle,     "border"),
	transitionStyle: toCompositeGroup(tokensMod2.transitionStyle, "transition"),

	// ── Tier 2: Semantic — spread to root ─────────────────────────────────────
	...Object.fromEntries(
		Object.entries(semMod.semantic).map(([category, entries]) => [
			category,
			toGroup(entries, "other"),
		]),
	),

	// ── Tier 3: Component — spread to root ────────────────────────────────────
	...Object.fromEntries(
		Object.entries(compMod.components).map(([kind, entries]) => [
			kind,
			toGroup(entries, "other"),
		]),
	),
};

// ─── Write tokens.json ────────────────────────────────────────────────────────
const dtcgPath = resolve(desktopRoot, tokensConfig.dtcg.output);
writeFileSync(dtcgPath, `${JSON.stringify(dtcg, null, "\t")}\n`, "utf-8");

const jitiEnums = tokensMod2.enums;
const jitiKeyframesDef = tokensMod2.keyframesDef;

// ─── Load Kind Definitions + Presets ─────────────────────────────────────────
const kindDefMod = await jiti.import(
	resolve(desktopRoot, "src/lib/design/registry/kind-definitions.ts"),
) as {
	getAllKindDefinitions: () => Array<{
		kind: string;
		label: string;
		engine: string;
		defaultPreset: string;
		defaultRecipe: string;
		blockCategory: string;
		requiredAxes: readonly string[];
		compound: boolean;
		container: boolean;
		containerSlots?: readonly string[];
	}>;
};

const presetsMod = await jiti.import(
	resolve(desktopRoot, "src/lib/design/registry/presets.ts"),
) as {
	getAllPresets: () => Array<{
		id: string;
		kind: string;
		values: Record<string, string>;
	}>;
};

const jitiKindDefinitions = kindDefMod.getAllKindDefinitions();
const jitiPresets = presetsMod.getAllPresets();

export { dtcgPath, tokensConfig, jitiEnums, jitiRegistry, jitiKeyframesDef, jitiKindDefinitions, jitiPresets, desktopRoot };
