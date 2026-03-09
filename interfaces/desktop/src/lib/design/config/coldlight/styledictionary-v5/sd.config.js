/**
 * ColdLight — Style Dictionary v5 Configuration
 *
 * DTCG 1.0 compliant. OKLCH native. 3-tier token architecture.
 *
 * Run from interfaces/desktop/:
 *   npx style-dictionary build -c src/lib/design/config/coldlight/styledictionary-v5/sd.config.js
 */

// ─── Path Constants (relative to interfaces/desktop/) ───

const TOKENS_DIR = "src/lib/design/tokens/src";
const STYLE_DIR = "src/lib/design/style/";

// ─── Source file → output category mapping ───

const TIER1 = [
	{ src: "tier-1/color.json", out: "color" },
	{ src: "tier-1/surfaces.json", out: "surfaces" },
	{ src: "tier-1/effects.json", out: "effects" },
	{ src: "tier-1/spacing.json", out: "spacing" },
	{ src: "tier-1/layout.json", out: "layout" },
	{ src: "tier-1/motion.json", out: "motion" },
	{ src: "tier-1/typography.json", out: "typography" },
];

const TIER2 = [{ src: "tier-2/semantic.json", out: "semantic" }];

const TIER3 = [{ src: "tier-3/components.json", out: "composite" }];

const ALL_CATEGORIES = [...TIER1, ...TIER2, ...TIER3];

// ─── Helpers ───

function filterByFile(filename) {
	return (token) => token.filePath.includes(filename);
}

function toPascalCase(str) {
	return str
		.split(/[-_.]/)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join("");
}

// ─── DTCG Value Helpers ───

/** Convert a DTCG dimension object to CSS string */
function resolveDimension(val) {
	if (typeof val === "string") return val;
	if (typeof val === "object" && val !== null && "value" in val && "unit" in val) {
		return `${val.value}${val.unit}`;
	}
	return String(val);
}

/** Convert a DTCG duration object to CSS string */
function resolveDuration(val) {
	if (typeof val === "string") return val;
	if (typeof val === "object" && val !== null && "value" in val && "unit" in val) {
		return `${val.value}${val.unit}`;
	}
	return String(val);
}

/** Convert a DTCG color object to CSS string */
function resolveColor(val) {
	if (typeof val === "string") return val;
	if (typeof val === "object" && val !== null && "colorSpace" in val) {
		const [l, c, h] = val.components;
		if (val.alpha !== undefined && val.alpha !== 1) {
			return `oklch(${l} ${c} ${h} / ${val.alpha})`;
		}
		return `oklch(${l} ${c} ${h})`;
	}
	return String(val);
}

/** Convert a DTCG cubicBezier array to CSS string */
function resolveCubicBezier(val) {
	if (typeof val === "string") return val;
	if (Array.isArray(val) && val.length === 4) {
		return `cubic-bezier(${val.join(", ")})`;
	}
	return String(val);
}

/** Convert a single DTCG shadow object to CSS string */
function resolveShadowLayer(layer) {
	const ox = resolveDimension(layer.offsetX);
	const oy = resolveDimension(layer.offsetY);
	const blur = resolveDimension(layer.blur);
	const spread = resolveDimension(layer.spread);
	const color = resolveColor(layer.color);
	return `${ox} ${oy} ${blur} ${spread} ${color}`;
}

// ─── Custom Transforms ───

/** Convert DTCG dimension objects → CSS strings (replaces size/rem) */
const dimensionTransform = {
	name: "coldlight/dimension",
	type: "value",
	filter: (token) => token.$type === "dimension",
	transform: (token) => resolveDimension(token.$value),
};

/** Convert DTCG duration objects → CSS strings (replaces time/seconds) */
const durationTransform = {
	name: "coldlight/duration",
	type: "value",
	filter: (token) => token.$type === "duration",
	transform: (token) => resolveDuration(token.$value),
};

/** Convert DTCG shadow objects → CSS shorthand (replaces shadow/css/shorthand) */
const shadowTransform = {
	name: "coldlight/shadow",
	type: "value",
	filter: (token) => token.$type === "shadow",
	transform: (token) => {
		const val = token.$value;
		if (typeof val === "string") return val;

		const inset = token.$extensions?.["com.coldlight"]?.inset === true;
		const prefix = inset ? "inset " : "";

		// Single shadow
		if (!Array.isArray(val) && typeof val === "object" && "offsetX" in val) {
			return `${prefix}${resolveShadowLayer(val)}`;
		}

		// Multi-shadow array
		if (Array.isArray(val)) {
			return val.map((layer) => `${prefix}${resolveShadowLayer(layer)}`).join(", ");
		}

		return String(val);
	},
};

/** Convert DTCG transition composites → CSS shorthand */
const transitionTransform = {
	name: "coldlight/transition",
	type: "value",
	transitive: true,
	filter: (token) => token.$type === "transition",
	transform: (token) => {
		const val = token.$value;
		if (typeof val === "string") return val;
		if (typeof val === "object" && val !== null) {
			const duration = resolveDuration(val.duration);
			const timing = resolveCubicBezier(val.timingFunction);
			const delay = resolveDuration(val.delay);
			return `${duration} ${timing} ${delay}`;
		}
		return String(val);
	},
};

/** Pass animation string values through unchanged */
const animationTransform = {
	name: "coldlight/animation",
	type: "value",
	filter: (token) =>
		token.$extensions?.["com.coldlight"]?.type === "animation",
	transform: (token) => token.$value,
};

/** Override resolved value with CSS runtime expression */
const cssRuntimeTransform = {
	name: "coldlight/cssRuntime",
	type: "value",
	transitive: true,
	filter: (token) =>
		token.$extensions?.["com.coldlight"]?.cssRuntime === true,
	transform: (token) => {
		return token.$extensions["com.coldlight"].cssExpression ?? token.$value;
	},
};

// ─── Custom Formats ───

/** @theme block for Tailwind v4 — registers tokens as utility classes */
function themeFormat({ dictionary, options }) {
	const header =
		"/**\n * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT\n * @theme registrations — references var() from tokens.css\n */\n\n";
	const lines = dictionary.allTokens.map(
		(token) => `\t--${token.name}: var(--${token.name});`,
	);
	return `${header}@theme {\n${lines.join("\n")}\n}\n`;
}

/** Token CSS index file — imports all tier CSS files */
function tokensIndexFormat({ options }) {
	const tier1Imports = TIER1.map(
		(c) => `@import "./tokens/tier-1/${c.out}.css";`,
	);
	const tier2Imports = TIER2.map(
		(c) => `@import "./tokens/tier-2/${c.out}.css";`,
	);
	const tier3Imports = TIER3.map(
		(c) => `@import "./tokens/tier-3/${c.out}.css";`,
	);

	return [
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
		...tier1Imports,
		"",
		"/* ─── Tier 2: Semantic ─── */",
		...tier2Imports,
		"",
		"/* ─── Tier 3: Composite (Component) ─── */",
		...tier3Imports,
		"",
	].join("\n");
}

/** Tailwind integration index — imports tokens.css + all @theme files */
function tailwindIndexFormat({ options }) {
	const themeImports = ALL_CATEGORIES.map(
		(c) => `@import "./theme/${c.out}.css";`,
	);

	return [
		"/**",
		" * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT",
		" * Master Tailwind integration — tokens + @theme registrations.",
		" *",
		" * Import in app.css:",
		' *   @import "tailwindcss";',
		' *   @import "$lib/design/style/tailwind.css";',
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
		...themeImports,
		"",
	].join("\n");
}

/** TypeScript types — const arrays + type aliases per token group */
function typesFormat({ dictionary }) {
	// Group tokens by their parent path (everything except the leaf)
	const rawGroups = new Map();

	for (const token of dictionary.allTokens) {
		const parentPath = token.path.slice(0, -1);
		const leaf = token.path[token.path.length - 1];
		const key = parentPath.join(".");

		if (!rawGroups.has(key)) {
			rawGroups.set(key, { parentPath, items: new Set() });
		}
		rawGroups.get(key).items.add(leaf);
	}

	// Merge groups that share the same parent[0] and have identical item sets
	// This handles color.teal, color.purple, etc → single "Color" group
	const parentBuckets = new Map();
	for (const [key, group] of rawGroups) {
		if (group.parentPath.length >= 2) {
			const bucketKey = group.parentPath[0];
			if (!parentBuckets.has(bucketKey)) parentBuckets.set(bucketKey, []);
			parentBuckets.get(bucketKey).push({ key, group });
		}
	}

	const mergedGroups = new Map();
	const mergedKeys = new Set();

	for (const [bucketKey, entries] of parentBuckets) {
		if (entries.length <= 1) continue;

		// Check if all entries have the same item set
		const first = [...entries[0].group.items].sort().join(",");
		const allSame = entries.every(
			(e) => [...e.group.items].sort().join(",") === first,
		);

		if (allSame) {
			// Merge into single group named after the parent
			mergedGroups.set(bucketKey, {
				name: toPascalCase(bucketKey),
				items: [...entries[0].group.items],
			});
			for (const e of entries) mergedKeys.add(e.key);
		}
	}

	// Build final group list
	const groups = [];

	// Add merged groups
	for (const [, group] of mergedGroups) {
		groups.push(group);
	}

	// Add non-merged groups
	for (const [key, group] of rawGroups) {
		if (mergedKeys.has(key)) continue;

		// Use the last segment of the parent path as the group name
		const lastSegment = group.parentPath[group.parentPath.length - 1];
		groups.push({
			name: toPascalCase(lastSegment),
			items: [...group.items],
		});
	}

	// Determine tier boundaries for comments
	const tier1Groups = new Set();
	const tier2Groups = new Set();
	const tier3Groups = new Set();

	for (const token of dictionary.allTokens) {
		const groupName = resolveGroupName(token, mergedKeys, rawGroups);
		if (token.filePath.includes("tier-1/")) tier1Groups.add(groupName);
		else if (token.filePath.includes("tier-2/")) tier2Groups.add(groupName);
		else if (token.filePath.includes("tier-3/")) tier3Groups.add(groupName);
	}

	// Sort groups by tier, then alphabetically
	const tier1Sorted = groups
		.filter((g) => tier1Groups.has(g.name))
		.sort((a, b) => a.name.localeCompare(b.name));
	const tier2Sorted = groups
		.filter((g) => tier2Groups.has(g.name))
		.sort((a, b) => a.name.localeCompare(b.name));
	const tier3Sorted = groups
		.filter((g) => tier3Groups.has(g.name))
		.sort((a, b) => a.name.localeCompare(b.name));

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

	function emitGroup(group) {
		const items = JSON.stringify(group.items);
		lines.push(
			`export const ${group.name}Tokens = ${items} as const;`,
		);
		lines.push(
			`export type ${group.name}Token = (typeof ${group.name}Tokens)[number];`,
		);
		lines.push("");
	}

	if (tier1Sorted.length) {
		lines.push("// ─── Tier 1: Primitive ───");
		lines.push("");
		tier1Sorted.forEach(emitGroup);
	}

	if (tier2Sorted.length) {
		lines.push("// ─── Tier 2: Semantic ───");
		lines.push("");
		tier2Sorted.forEach(emitGroup);
	}

	if (tier3Sorted.length) {
		lines.push("// ─── Tier 3: Composite ───");
		lines.push("");
		tier3Sorted.forEach(emitGroup);
	}

	// Master lookup
	lines.push("// ─── Master lookup ───");
	lines.push("");
	lines.push("export const TokenArrays = {");
	const allSorted = [...tier1Sorted, ...tier2Sorted, ...tier3Sorted];
	for (const group of allSorted) {
		const camelKey =
			group.name.charAt(0).toLowerCase() + group.name.slice(1);
		lines.push(`\t${camelKey}: ${group.name}Tokens,`);
	}
	lines.push("} as const;");
	lines.push("");

	return lines.join("\n");
}

function resolveGroupName(token, mergedKeys, rawGroups) {
	const parentPath = token.path.slice(0, -1);
	const key = parentPath.join(".");

	if (mergedKeys.has(key)) {
		return toPascalCase(parentPath[0]);
	}

	const lastSegment = parentPath[parentPath.length - 1];
	return toPascalCase(lastSegment);
}

// ─── Config ───

/** Generate per-category CSS variable files for a tier */
function tierTokenFiles(tier, tierDir) {
	return tier.map((cat) => ({
		destination: `tokens/${tierDir}/${cat.out}.css`,
		format: "css/variables",
		filter: filterByFile(cat.src),
		options: {
			outputReferences: true,
			selector: ":root",
		},
	}));
}

/** Generate per-category @theme files */
function tierThemeFiles(categories) {
	return categories.map((cat) => ({
		destination: `theme/${cat.out}.css`,
		format: "coldlight/theme",
		filter: filterByFile(cat.src),
	}));
}

export default {
	source: [`${TOKENS_DIR}/**/*.json`],
	usesDtcg: true,
	expand: false,
	log: { verbosity: "verbose" },

	hooks: {
		transforms: {
			"coldlight/dimension": dimensionTransform,
			"coldlight/duration": durationTransform,
			"coldlight/shadow": shadowTransform,
			"coldlight/transition": transitionTransform,
			"coldlight/animation": animationTransform,
			"coldlight/cssRuntime": cssRuntimeTransform,
		},
		formats: {
			"coldlight/theme": themeFormat,
			"coldlight/tokens-index": tokensIndexFormat,
			"coldlight/tailwind-index": tailwindIndexFormat,
			"coldlight/types": typesFormat,
		},
	},

	platforms: {
		css: {
			transforms: [
				"attribute/cti",
				"name/kebab",
				"coldlight/animation",
				"coldlight/dimension",
				"coldlight/duration",
				"color/oklch",
				"fontFamily/css",
				"cubicBezier/css",
				"coldlight/shadow",
				"coldlight/transition",
				"coldlight/cssRuntime",
			],
			buildPath: STYLE_DIR,
			options: {
				outputReferences: true,
				showFileHeader: true,
			},
			files: [
				// ─── Tier 1: Primitive token CSS variables ───
				...tierTokenFiles(TIER1, "tier-1"),

				// ─── Tier 2: Semantic token CSS variables ───
				...tierTokenFiles(TIER2, "tier-2"),

				// ─── Tier 3: Composite token CSS variables ───
				...tierTokenFiles(TIER3, "tier-3"),

				// ─── @theme files for Tailwind v4 ───
				...tierThemeFiles(ALL_CATEGORIES),

				// ─── Index files ───
				{
					destination: "tokens.css",
					format: "coldlight/tokens-index",
				},
				{
					destination: "tailwind.css",
					format: "coldlight/tailwind-index",
				},
			],
		},

		cssLegacy: {
			transforms: [
				"attribute/cti",
				"name/kebab",
				"coldlight/animation",
				"coldlight/dimension",
				"coldlight/duration",
				"color/hex",
				"fontFamily/css",
				"cubicBezier/css",
				"coldlight/shadow",
				"coldlight/transition",
				"coldlight/cssRuntime",
			],
			buildPath: `${STYLE_DIR}legacy/`,
			options: {
				outputReferences: false,
				showFileHeader: true,
			},
			files: [
				{
					destination: "tokens.css",
					format: "css/variables",
					options: { selector: ":root" },
				},
			],
		},

		ts: {
			transforms: ["attribute/cti", "name/kebab"],
			buildPath: STYLE_DIR,
			files: [
				{
					destination: "types.ts",
					format: "coldlight/types",
				},
			],
		},
	},
};
