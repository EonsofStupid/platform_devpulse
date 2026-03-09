/**
 * @file sd.config.js — Style Dictionary v5 Configuration
 * @package @devpulse/coldlight
 * @author Jesse Hall
 *
 * ColdLight Design System — SD5 native config.
 * THIS IS THE SOLE TOKEN PIPELINE CONFIGURATION.
 *
 * Source:  src/lib/design/tokens/src/**\/*.json  (DTCG 1.0 authored)
 * Output:  src/lib/design/style/                 (generated — never hand-edit)
 *
 * Architecture:
 *   tokens.css   ← master @import for all :root custom properties (organized by tier)
 *   theme/*.css  ← @theme registrations referencing var() from tokens.css
 *   tailwind.css ← master import: tokens.css + all theme files
 *   types.ts     ← TypeScript unions + readonly arrays
 *
 * @example app.css usage:
 *   @import "tailwindcss";
 *   @import "$lib/design/style/tailwind.css";
 *
 * Run: pnpm ds:tokens:build
 * CLI: style-dictionary build --config sd.config.js
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DECLARATIVE TOKEN SPLITS — THIS IS THE ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════════
//
// Every DTCG group MUST be listed here. If a group is missing, its tokens
// won't appear in ANY output. If a group is miscategorized, the split file
// will be wrong. The config IS the contract. Add a new group → add it here.
//
// Format: { outputFilename: [dtcgGroupName, ...] }

const TIER_1_SPLITS = {
	color:      ["hue", "color", "text", "signal"],
	surfaces:   ["glass", "matte"],
	effects:    ["shadow", "bevel", "glow", "glowSpread", "blur"],
	spacing:    ["space", "padding"],
	layout:     ["radius", "z"],
	motion:     ["duration", "ease", "animation"],
	typography: ["font", "textSize"],
};

const TIER_2_SPLITS = {
	semantic: [
		"surface", "border", "interaction", "overlay",
		"depth", "transition", "backdrop", "scrollbar",
	],
};

const TIER_3_SPLITS = {
	composite: [
		// Interactive
		"button", "checkbox", "switch", "toggle", "slider", "progress",
		// Form
		"input", "select", "combobox", "radio-group",
		// Data display
		"badge", "card", "avatar", "table", "skeleton", "kbd",
		// Feedback
		"alert", "toast",
		// Containers
		"panel", "dialog", "tabs", "accordion", "menu", "app-shell",
		// Misc
		"spinner",
	],
};

// ═══════════════════════════════════════════════════════════════════════════════
// THEME NAMESPACE MAPPINGS — DTCG group → Tailwind v4 @theme namespace
// ═══════════════════════════════════════════════════════════════════════════════
//
// These determine which Tailwind utility classes get generated from tokens.
//
// Example: group "glass" → namespace "color", prefix "glass"
//   → @theme { --color-glass-void: var(--glass-void); }
//   → Tailwind generates: bg-glass-void, text-glass-void, border-glass-void
//
// Groups WITHOUT a mapping here are still in tokens.css (:root vars) but
// do NOT generate Tailwind utility classes.

const themeMappings = {
	// ─── Tier 1: Global tokens ──────────────────────────────────────────────
	// hue: intentionally excluded (raw angle values, not Tailwind utilities)
	color:      { namespace: "color",                      prefix: null      },
	text:       { namespace: "color",                      prefix: "text"    },
	signal:     { namespace: "color",                      prefix: "signal"  },
	glass:      { namespace: "color",                      prefix: "glass"   },
	matte:      { namespace: "color",                      prefix: "matte"   },
	shadow:     { namespace: "shadow",                     prefix: null      },
	bevel:      { namespace: "shadow",                     prefix: "bevel"   },
	glow:       { namespace: "shadow",                     prefix: "glow"    },
	glowSpread: { namespace: "glow-spread",                prefix: null      },
	blur:       { namespace: "blur",                       prefix: null      },
	radius:     { namespace: "radius",                     prefix: null      },
	// z: intentionally excluded (z-index values used via CSS var() directly)
	space:      { namespace: "spacing",                    prefix: null      },
	// padding: intentionally excluded (multi-value shorthand, no TW utility)
	duration:   { namespace: "transition-duration",        prefix: null      },
	ease:       { namespace: "transition-timing-function", prefix: null      },
	animation:  { namespace: "animate",                    prefix: null      },
	font:       { namespace: "font",                       prefix: null      },
	textSize:   { namespace: "font-size",                  prefix: null      },

	// ─── Tier 2: Semantic tokens ────────────────────────────────────────────
	surface:     { namespace: "color",      prefix: "surface"     },
	border:      { namespace: "color",      prefix: "border"      },
	interaction: { namespace: "color",      prefix: "interaction" },
	overlay:     { namespace: "color",      prefix: "overlay"     },
	depth:       { namespace: "shadow",     prefix: "depth"       },
	transition:  { namespace: "transition", prefix: null          },
	backdrop:    { namespace: "color",      prefix: "backdrop"    },
	scrollbar:   { namespace: "color",      prefix: "scrollbar"   },
};

// Tier 3: Component tokens use $type-based namespace resolution
const COMPONENT_TYPE_TO_NAMESPACE = {
	color:  "color",
	shadow: "shadow",
};

// ═══════════════════════════════════════════════════════════════════════════════
// OUTPUT PATH
// ═══════════════════════════════════════════════════════════════════════════════

const stylePath = "src/lib/design/style/";

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Create a filter function that matches tokens by top-level DTCG group. */
function groupFilter(groups) {
	const set = new Set(groups);
	return (token) => set.has(token.path[0]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM FORMATS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * coldlight/theme-section
 *
 * Outputs @theme { --tw-namespace-key: var(--token-name); }
 * for tier-1 and tier-2 tokens. Tokens are pre-filtered by SD5.
 */
function themeSectionFormat({ dictionary }) {
	const lines = [
		"/**",
		" * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT",
		" * @theme registrations — references var() from tokens.css",
		" */",
		"",
		"@theme {",
	];

	for (const token of dictionary.allTokens) {
		const group = token.path[0];
		const mapping = themeMappings[group];
		if (!mapping) continue;

		const suffix = token.path.slice(1).join("-");
		const twKey = mapping.prefix
			? `--${mapping.namespace}-${mapping.prefix}-${suffix}`
			: `--${mapping.namespace}-${suffix}`;

		lines.push(`\t${twKey}: var(--${token.name});`);
	}

	lines.push("}");
	lines.push("");
	return lines.join("\n");
}

/**
 * coldlight/composite-theme
 *
 * Outputs @theme for tier-3 component tokens.
 * Uses DTCG $type to determine Tailwind namespace:
 *   color  → --color-button-bg: var(--button-bg);   → bg-button-bg
 *   shadow → --shadow-card-depth: var(--card-depth); → shadow-card-depth
 */
function compositeThemeFormat({ dictionary }) {
	const lines = [
		"/**",
		" * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT",
		" * @theme registrations — tier-3 component tokens",
		" */",
		"",
		"@theme {",
	];

	for (const token of dictionary.allTokens) {
		const type = token.$type ?? token.type ?? "color";
		const namespace = COMPONENT_TYPE_TO_NAMESPACE[type] ?? "color";
		lines.push(`\t--${namespace}-${token.name}: var(--${token.name});`);
	}

	lines.push("}");
	lines.push("");
	return lines.join("\n");
}

/**
 * coldlight/master-tokens
 *
 * Outputs @import statements for all token tier files.
 * This is the single entry point for all :root custom properties.
 */
function masterTokensFormat() {
	const lines = [
		"/**",
		" * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT",
		" * Master token import — all :root custom properties organized by tier.",
		" *",
		" * Tier 1: Primitive — raw design values (colors, spacing, effects, etc.)",
		" * Tier 2: Semantic  — intent-based aliases (surface, border, depth, etc.)",
		" * Tier 3: Composite — per-component overrides (button, dialog, tabs, etc.)",
		" */",
		"",
		"/* ─── Tier 1: Primitive (Global) ─── */",
	];

	for (const file of Object.keys(TIER_1_SPLITS)) {
		lines.push(`@import "./tokens/tier-1/${file}.css";`);
	}

	lines.push("");
	lines.push("/* ─── Tier 2: Semantic ─── */");
	for (const file of Object.keys(TIER_2_SPLITS)) {
		lines.push(`@import "./tokens/tier-2/${file}.css";`);
	}

	lines.push("");
	lines.push("/* ─── Tier 3: Composite (Component) ─── */");
	for (const file of Object.keys(TIER_3_SPLITS)) {
		lines.push(`@import "./tokens/tier-3/${file}.css";`);
	}

	lines.push("");
	return lines.join("\n");
}

/**
 * coldlight/master-tailwind
 *
 * Outputs @import for tokens.css + all theme files.
 * This is what app.css imports for the full Tailwind integration.
 *
 * @example
 *   // In app.css:
 *   @import "tailwindcss";
 *   @import "$lib/design/style/tailwind.css";
 */
function masterTailwindFormat() {
	const themeFiles = [
		...Object.keys(TIER_1_SPLITS),
		...Object.keys(TIER_2_SPLITS),
		"composite",
	];

	const lines = [
		"/**",
		" * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT",
		" * Master Tailwind integration — tokens + @theme registrations.",
		" *",
		" * Import in app.css:",
		" *   @import \"tailwindcss\";",
		" *   @import \"$lib/design/style/tailwind.css\";",
		" *",
		" * This gives you:",
		" *   1. All ColdLight token custom properties in :root",
		" *   2. All tokens registered as Tailwind utility classes via @theme",
		" *   3. Full Tailwind utility class generation for VPB composability",
		" */",
		"",
		"/* Canonical token values (all :root custom properties) */",
		'@import "./tokens.css";',
		"",
		"/* @theme registrations (var() references → Tailwind utility generation) */",
	];

	for (const file of themeFiles) {
		lines.push(`@import "./theme/${file}.css";`);
	}

	lines.push("");
	return lines.join("\n");
}

/**
 * coldlight/types
 *
 * TypeScript readonly arrays + union types per DTCG group.
 * Organized by tier for import clarity.
 */
function typesFormat({ dictionary }) {
	const lines = [
		"/**",
		" * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT",
		" * TypeScript token types + readonly arrays",
		" *",
		" * Organized by tier:",
		" *   Tier 1: Primitive (global values)",
		" *   Tier 2: Semantic (intent-based aliases)",
		" *   Tier 3: Composite (per-component overrides)",
		" */",
		"",
	];

	// Group tokens by their top-level DTCG group
	const groups = new Map();
	for (const token of dictionary.allTokens) {
		const group = token.path[0];
		if (!groups.has(group)) groups.set(group, []);
		groups.get(group).push(token);
	}

	// Determine which tier each group belongs to
	const tier1Groups = new Set(Object.values(TIER_1_SPLITS).flat());
	const tier2Groups = new Set(Object.values(TIER_2_SPLITS).flat());
	const tier3Groups = new Set(Object.values(TIER_3_SPLITS).flat());

	function emitGroup(group, tokens) {
		const pascal = group.charAt(0).toUpperCase() + group.slice(1);
		const values = tokens.map((t) => t.path[t.path.length - 1]);
		const unique = [...new Set(values)];

		lines.push(`export const ${pascal}Tokens = ${JSON.stringify(unique)} as const;`);
		lines.push(`export type ${pascal}Token = (typeof ${pascal}Tokens)[number];`);
		lines.push("");
	}

	// Tier 1
	lines.push("// ─── Tier 1: Primitive ───");
	lines.push("");
	for (const [group, tokens] of groups) {
		if (tier1Groups.has(group)) emitGroup(group, tokens);
	}

	// Tier 2
	lines.push("// ─── Tier 2: Semantic ───");
	lines.push("");
	for (const [group, tokens] of groups) {
		if (tier2Groups.has(group)) emitGroup(group, tokens);
	}

	// Tier 3
	lines.push("// ─── Tier 3: Composite ───");
	lines.push("");
	for (const [group, tokens] of groups) {
		if (tier3Groups.has(group)) emitGroup(group, tokens);
	}

	// Master lookup
	lines.push("// ─── Master lookup ───");
	lines.push("");
	lines.push("export const TokenArrays = {");
	for (const group of groups.keys()) {
		const pascal = group.charAt(0).toUpperCase() + group.slice(1);
		lines.push(`\t${group}: ${pascal}Tokens,`);
	}
	lines.push("} as const;");
	lines.push("");

	return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD FILE GENERATORS — derived from declarative splits above
// ═══════════════════════════════════════════════════════════════════════════════

/** Generate token :root file entries for a tier. */
function buildTokenFiles(splits, tierDir) {
	return Object.entries(splits).map(([filename, groups]) => ({
		destination: `${tierDir}/${filename}.css`,
		format: "css/variables",
		filter: groupFilter(groups),
		options: { selector: ":root", outputReferences: true },
	}));
}

/** Generate @theme file entries for tier-1 and tier-2. */
function buildThemeFiles(splits) {
	return Object.entries(splits).map(([filename, groups]) => ({
		destination: `${filename}.css`,
		format: "coldlight/theme-section",
		filter: groupFilter(groups),
	}));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SD5 CONFIG EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default {
	source: ["src/lib/design/tokens/src/**/*.json"],
	usesDtcg: true,
	expand: true,

	hooks: {
		formats: {
			"coldlight/theme-section":   themeSectionFormat,
			"coldlight/composite-theme": compositeThemeFormat,
			"coldlight/master-tokens":   masterTokensFormat,
			"coldlight/master-tailwind": masterTailwindFormat,
			"coldlight/types":           typesFormat,
		},
	},

	platforms: {
		// ─── Platform 1: Canonical :root token files (split by tier + section) ──
		tokens: {
			transformGroup: "css",
			buildPath: `${stylePath}tokens/`,
			files: [
				...buildTokenFiles(TIER_1_SPLITS, "tier-1"),
				...buildTokenFiles(TIER_2_SPLITS, "tier-2"),
				...buildTokenFiles(TIER_3_SPLITS, "tier-3"),
			],
		},

		// ─── Platform 2: @theme registrations (var() refs → Tailwind utilities) ─
		theme: {
			transformGroup: "css",
			buildPath: `${stylePath}theme/`,
			files: [
				...buildThemeFiles(TIER_1_SPLITS),
				...buildThemeFiles(TIER_2_SPLITS),
				// Tier 3 uses composite format ($type-aware namespace resolution)
				{
					destination: "composite.css",
					format: "coldlight/composite-theme",
					filter: groupFilter(TIER_3_SPLITS.composite),
				},
			],
		},

		// ─── Platform 3: Master import files ────────────────────────────────────
		master: {
			transformGroup: "css",
			buildPath: stylePath,
			files: [
				{
					destination: "tokens.css",
					format: "coldlight/master-tokens",
				},
				{
					destination: "tailwind.css",
					format: "coldlight/master-tailwind",
				},
			],
		},

		// ─── Platform 4: TypeScript types ───────────────────────────────────────
		types: {
			transformGroup: "css",
			buildPath: stylePath,
			files: [
				{
					destination: "types.ts",
					format: "coldlight/types",
				},
			],
		},
	},
};
