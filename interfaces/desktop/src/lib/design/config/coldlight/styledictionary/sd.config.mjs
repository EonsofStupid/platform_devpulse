/**
 * ColdLight — Style Dictionary v5 Configuration
 *
 * DTCG 1.0 compliant. OKLCH native.
 * Self-describing domain folders. Each domain owns primitive/semantic/composite.
 * Auto-classification preprocessor detects tier from token structure.
 *
 * Source: tokens/src/{domain}/{primitive|semantic|composite}.json
 * Output: style/{domain}/{tokens.css|theme.css|types.ts}
 *
 * Run from interfaces/desktop/:
 *   npx style-dictionary build -c src/lib/design/config/coldlight/styledictionary/sd.config.mjs
 */

// ─── Path Constants (relative to interfaces/desktop/) ───

const TOKENS_DIR = "src/lib/design/tokens/src";
const STYLE_DIR = "src/lib/design/style/";

// ─── Domain Registry ───
// Each domain is a self-describing folder under tokens/src/.
// SD5 reads all .json files within. Output mirrors the domain name.

const DOMAINS = [
	"color",
	"surface",
	"shadow",
	"bevel",
	"glow",
	"blur",
	"border",
	"radius",
	"spacing",
	"motion",
	"typography",
	"interaction",
	"overlay",
	"backdrop",
	"scrollbar",
	"components",
];

// ─── Component Kinds (for composite auto-detection) ───

const COMPONENT_KINDS = new Set([
	"accordion", "alert", "app-shell", "avatar", "badge", "button",
	"card", "checkbox", "combobox", "dialog", "input", "kbd", "menu",
	"panel", "progress", "radio-group", "select", "skeleton", "slider",
	"spinner", "switch", "table", "tabs", "toast", "toggle",
]);

// ─── Helpers ───

function filterByDomain(domain) {
	return (token) => token.filePath.includes(`/${domain}/`);
}

function toPascalCase(str) {
	return str
		.split(/[-_.]/)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join("");
}

/** Detect if a DTCG $value is a reference (e.g. "{surface.primary}") */
function isReference(val) {
	if (typeof val === "string") return /^\{.+\}$/.test(val);
	if (typeof val === "object" && val !== null) {
		return Object.values(val).some((v) => isReference(v));
	}
	return false;
}

// ─── DTCG Value Helpers ───

function resolveDimension(val) {
	if (typeof val === "string") return val;
	if (typeof val === "object" && val !== null && "value" in val && "unit" in val) {
		return `${val.value}${val.unit}`;
	}
	return String(val);
}

function resolveDuration(val) {
	if (typeof val === "string") return val;
	if (typeof val === "object" && val !== null && "value" in val && "unit" in val) {
		return `${val.value}${val.unit}`;
	}
	return String(val);
}

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

function resolveCubicBezier(val) {
	if (typeof val === "string") return val;
	if (Array.isArray(val) && val.length === 4) {
		return `cubic-bezier(${val.join(", ")})`;
	}
	return String(val);
}

function resolveShadowLayer(layer) {
	const ox = resolveDimension(layer.offsetX);
	const oy = resolveDimension(layer.offsetY);
	const blur = resolveDimension(layer.blur);
	const spread = resolveDimension(layer.spread);
	const color = resolveColor(layer.color);
	return `${ox} ${oy} ${blur} ${spread} ${color}`;
}

// ─── Auto-Classification Preprocessor ───
// Walks the merged token tree. Each leaf token has .filePath set by SD5 combineJSON.
// Classification is determined SOLELY by source filename:
//   primitive.json → "primitive"
//   semantic.json  → "semantic"
//   composite.json → "composite"

function tierFromPath(filePath) {
	if (!filePath) return "primitive";
	if (filePath.includes("/primitive.json") || filePath.includes("\\primitive.json")) return "primitive";
	if (filePath.includes("/semantic.json") || filePath.includes("\\semantic.json")) return "semantic";
	if (filePath.includes("/composite.json") || filePath.includes("\\composite.json")) return "composite";
	return "primitive";
}

function classifyPreprocessor(dictionary) {
	function walk(obj) {
		if (obj === null || typeof obj !== "object") return;

		for (const [key, node] of Object.entries(obj)) {
			if (key.startsWith("$")) continue;
			if (typeof node !== "object" || node === null) continue;

			if ("$value" in node) {
				// SD5 sets .filePath on each leaf during combineJSON (before preprocessors)
				const tier = tierFromPath(node.filePath);
				if (!node.$extensions) node.$extensions = {};
				if (!node.$extensions["com.coldlight"]) node.$extensions["com.coldlight"] = {};
				node.$extensions["com.coldlight"].tier = tier;
			} else {
				walk(node);
			}
		}
	}

	walk(dictionary);
	return dictionary;
}

// ─── Custom Transforms ───

const dimensionTransform = {
	name: "coldlight/dimension",
	type: "value",
	filter: (token) => token.$type === "dimension",
	transform: (token) => resolveDimension(token.$value),
};

const durationTransform = {
	name: "coldlight/duration",
	type: "value",
	filter: (token) => token.$type === "duration",
	transform: (token) => resolveDuration(token.$value),
};

const shadowTransform = {
	name: "coldlight/shadow",
	type: "value",
	filter: (token) => token.$type === "shadow",
	transform: (token) => {
		const val = token.$value;
		if (typeof val === "string") return val;

		const inset = token.$extensions?.["com.coldlight"]?.inset === true;
		const prefix = inset ? "inset " : "";

		if (!Array.isArray(val) && typeof val === "object" && "offsetX" in val) {
			return `${prefix}${resolveShadowLayer(val)}`;
		}

		if (Array.isArray(val)) {
			return val.map((layer) => `${prefix}${resolveShadowLayer(layer)}`).join(", ");
		}

		return String(val);
	},
};

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

const animationTransform = {
	name: "coldlight/animation",
	type: "value",
	filter: (token) =>
		token.$extensions?.["com.coldlight"]?.type === "animation",
	transform: (token) => token.$value,
};

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

/** Per-domain @theme block for Tailwind v4 */
function themeFormat({ dictionary }) {
	const header =
		"/**\n * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT\n * @theme registrations — references var() from tokens.css\n */\n\n";
	const lines = dictionary.allTokens.map(
		(token) => `\t--${token.name}: var(--${token.name});`,
	);
	return `${header}@theme {\n${lines.join("\n")}\n}\n`;
}

/** Master tokens.css — imports all domain token files */
function tokensIndexFormat() {
	const imports = DOMAINS.map(
		(d) => `@import "./${d}/tokens.css";`,
	);

	return [
		"/**",
		" * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT",
		" * Master token import — all :root custom properties organized by domain.",
		" */",
		"",
		...imports,
		"",
	].join("\n");
}

/** Master tailwind.css — imports tokens.css + all domain @theme files */
function tailwindIndexFormat() {
	const themeImports = DOMAINS.map(
		(d) => `@import "./${d}/theme.css";`,
	);

	return [
		"/**",
		" * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT",
		" * Master Tailwind integration — tokens + @theme registrations.",
		" *",
		" * Import in app.css:",
		' *   @import "tailwindcss";',
		' *   @import "$lib/design/style/tailwind.css";',
		" */",
		"",
		'@import "./tokens.css";',
		"",
		...themeImports,
		"",
	].join("\n");
}

/** Per-domain TypeScript types — grouped by auto-classified tier */
function domainTypesFormat({ dictionary, options }) {
	const domain = options.domain || "unknown";

	// Group tokens by tier (primitive/semantic/composite) then by parent path
	const tiers = { primitive: new Map(), semantic: new Map(), composite: new Map() };

	for (const token of dictionary.allTokens) {
		const tier = token.$extensions?.["com.coldlight"]?.tier || "primitive";
		const parentPath = token.path.slice(0, -1);
		const leaf = token.path[token.path.length - 1];
		const key = parentPath.join(".");

		const bucket = tiers[tier] || tiers.primitive;
		if (!bucket.has(key)) {
			bucket.set(key, { parentPath, items: new Set() });
		}
		bucket.get(key).items.add(leaf);
	}

	const lines = [
		"/**",
		" * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT",
		` * Domain: ${domain}`,
		" */",
		"",
	];

	for (const [tierName, groups] of Object.entries(tiers)) {
		if (groups.size === 0) continue;

		lines.push(`// ─── ${tierName.charAt(0).toUpperCase() + tierName.slice(1)} ───`);
		lines.push("");

		// Merge groups with identical item sets (e.g. color.teal + color.purple → Color)
		const parentBuckets = new Map();
		for (const [key, group] of groups) {
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
			const first = [...entries[0].group.items].sort().join(",");
			const allSame = entries.every(
				(e) => [...e.group.items].sort().join(",") === first,
			);
			if (allSame) {
				mergedGroups.set(bucketKey, {
					name: toPascalCase(bucketKey),
					items: [...entries[0].group.items],
				});
				for (const e of entries) mergedKeys.add(e.key);
			}
		}

		const finalGroups = [];
		for (const [, group] of mergedGroups) {
			finalGroups.push(group);
		}
		for (const [key, group] of groups) {
			if (mergedKeys.has(key)) continue;
			const lastSegment = group.parentPath[group.parentPath.length - 1];
			finalGroups.push({
				name: toPascalCase(lastSegment),
				items: [...group.items],
			});
		}

		finalGroups.sort((a, b) => a.name.localeCompare(b.name));

		for (const group of finalGroups) {
			const items = JSON.stringify(group.items);
			lines.push(`export const ${group.name}Tokens = ${items} as const;`);
			lines.push(`export type ${group.name}Token = (typeof ${group.name}Tokens)[number];`);
			lines.push("");
		}
	}

	return lines.join("\n");
}

/** Master types.ts — re-exports all domain types */
function masterTypesFormat() {
	const exports = DOMAINS.map(
		(d) => `export * from "./${d}/types.js";`,
	);

	return [
		"/**",
		" * AUTO-GENERATED by Style Dictionary v5 — DO NOT EDIT",
		" * Master type re-exports — all domain token types.",
		" */",
		"",
		...exports,
		"",
	].join("\n");
}

// ─── Shared Transform List ───

const CSS_TRANSFORMS = [
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
];

// ─── Build Per-Domain File Entries ───

function domainTokenFiles() {
	return DOMAINS.map((d) => ({
		destination: `${d}/tokens.css`,
		format: "css/variables",
		filter: filterByDomain(d),
		options: {
			outputReferences: true,
			selector: ":root",
		},
	}));
}

function domainThemeFiles() {
	return DOMAINS.map((d) => ({
		destination: `${d}/theme.css`,
		format: "coldlight/theme",
		filter: filterByDomain(d),
	}));
}

function domainTypeFiles() {
	return DOMAINS.map((d) => ({
		destination: `${d}/types.ts`,
		format: "coldlight/domain-types",
		filter: filterByDomain(d),
		options: { domain: d },
	}));
}

// ─── Config Export ───

export default {
	source: [`${TOKENS_DIR}/**/*.json`],
	usesDtcg: true,
	expand: false,
	log: { verbosity: "verbose" },

	hooks: {
		preprocessors: {
			"coldlight/classify": classifyPreprocessor,
		},
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
			"coldlight/domain-types": domainTypesFormat,
			"coldlight/master-types": masterTypesFormat,
		},
	},

	preprocessors: ["coldlight/classify"],

	platforms: {
		css: {
			transforms: CSS_TRANSFORMS,
			buildPath: STYLE_DIR,
			options: {
				outputReferences: true,
				showFileHeader: true,
			},
			files: [
				...domainTokenFiles(),
				...domainThemeFiles(),
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

		ts: {
			transforms: ["attribute/cti", "name/kebab"],
			buildPath: STYLE_DIR,
			files: [
				...domainTypeFiles(),
				{
					destination: "types.ts",
					format: "coldlight/master-types",
				},
			],
		},
	},
};
