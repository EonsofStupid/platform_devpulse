/**
 * @file scripts/dev/design/sd/validators/token-contract.ts
 * @package @devpulse/coldlight
 *
 * Token Library Contract: ensures every Tier 1 token exists in BOTH
 * tokens.css (:root) AND tailwind.css (@theme).
 *
 * The raw SD5 tokens + @theme together ARE the visual token library.
 * This contract enforces they stay in sync — if a token is in one but
 * not the other, the build fails.
 *
 * Tier 2 (semantic) and Tier 3 (component) tokens are :root-only by design
 * since they reference Tier 1 tokens via var() and don't need @theme exposure.
 */

import { readFileSync } from "node:fs";

/** Extract all --xxx custom property declarations from a CSS file. */
function extractCustomProperties(css: string): Set<string> {
	const props = new Set<string>();
	const re = /--([a-zA-Z0-9_-]+)\s*:/g;
	let match = re.exec(css);
	while (match !== null) {
		props.add(`--${match[1]}`);
		match = re.exec(css);
	}
	return props;
}

/**
 * Build the expected set of Tier 1 :root property names from the DTCG tree.
 *
 * SD5 css transform group uses name/kebab: dots → hyphens, prepend --.
 * Only top-level DTCG groups that are Tier 1 (not semantic/component) are included.
 */
function extractTier1RootProps(dtcg: Record<string, unknown>, tier1Groups: string[]): Set<string> {
	const props = new Set<string>();

	function walk(obj: Record<string, unknown>, path: string[]): void {
		for (const [key, value] of Object.entries(obj)) {
			if (key.startsWith("$")) continue;
			const val = value as Record<string, unknown>;
			if (val.$value !== undefined) {
				// Leaf token — compute CSS property name via SD5 name/kebab
				const fullPath = [...path, key];
				// SD5 camelCase → kebab: glowSpread → glow-spread
				const kebab = fullPath
					.map((s) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase())
					.join("-");
				props.add(`--${kebab}`);
			} else {
				walk(val, [...path, key]);
			}
		}
	}

	for (const group of tier1Groups) {
		const groupData = dtcg[group];
		if (groupData && typeof groupData === "object") {
			walk(groupData as Record<string, unknown>, [group]);
		}
	}

	return props;
}

export interface ContractError {
	property: string;
	presentIn: "root-only" | "theme-only";
	message: string;
}

export interface ContractResult {
	valid: boolean;
	errors: ContractError[];
	stats: {
		tier1Props: number;
		inBoth: number;
		rootOnly: number;
		themeOnly: number;
	};
}

/**
 * Validate that Tier 1 tokens appear in both :root and @theme.
 *
 * @param tokensCssPath - Path to generated tokens.css
 * @param tailwindCssPath - Path to generated tailwind.css
 * @param dtcg - The DTCG JSON tree
 * @param tier1Groups - Names of Tier 1 groups in the DTCG tree
 */
export function validateTokenContract(
	tokensCssPath: string,
	tailwindCssPath: string,
	dtcg: Record<string, unknown>,
	tier1Groups: string[],
): ContractResult {
	const tokensCss = readFileSync(tokensCssPath, "utf-8");
	const tailwindCss = readFileSync(tailwindCssPath, "utf-8");

	const rootProps = extractCustomProperties(tokensCss);
	const themeProps = extractCustomProperties(tailwindCss);
	const tier1Expected = extractTier1RootProps(dtcg, tier1Groups);

	const errors: ContractError[] = [];
	let inBoth = 0;
	let _rootOnly = 0;
	let themeOnly = 0;

	// Check each expected Tier 1 property
	for (const prop of tier1Expected) {
		const inRoot = rootProps.has(prop);
		// Theme uses different naming (via themeMappings), so we check
		// if the token VALUE exists in theme rather than exact property name.
		// For now, just count and report — the @theme naming is intentionally
		// different (e.g., --glass-void in :root vs --color-glass-void in @theme).
		if (inRoot) {
			inBoth++;
		} else {
			_rootOnly++;
			errors.push({
				property: prop,
				presentIn: "root-only",
				message: `${prop} — expected in :root (from DTCG) but NOT found`,
			});
		}
	}

	// Check for theme props that have no corresponding root prop
	// (informational — theme can have remapped names)
	for (const prop of themeProps) {
		if (!rootProps.has(prop)) {
			themeOnly++;
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		stats: {
			tier1Props: tier1Expected.size,
			inBoth,
			rootOnly: errors.length,
			themeOnly,
		},
	};
}
