/**
 * @file scripts/dev/design/sd/validators/registry-refs.ts
 * @package @devpulse/coldlight
 *
 * Post-build validator: ensures every var(--xxx) reference in
 * TOKEN_CATEGORY_REGISTRY tokenRefs resolves to a real CSS custom property
 * defined in tokens.css (:root) or tailwind.css (@theme).
 *
 * Run AFTER SD5 buildAllPlatforms(). Fails fast with clear error if any
 * reference is broken.
 */

import { readFileSync } from "node:fs";

interface CategoryValue {
	index: number;
	id: string;
	label: string;
	tokenRefs: Record<string, string>;
	svgFilters?: string[];
}

interface CategoryDefinition {
	code: string;
	name: string;
	values: CategoryValue[];
}

/** Extract all --xxx custom property declarations from a CSS file. */
function extractCustomProperties(css: string): Set<string> {
	const props = new Set<string>();
	// Match --property-name declarations (before the colon)
	const re = /--([a-zA-Z0-9_-]+)\s*:/g;
	let match = re.exec(css);
	while (match !== null) {
		props.add(`--${match[1]}`);
		match = re.exec(css);
	}
	return props;
}

/** Extract all var(--xxx) references from a string. */
function extractVarRefs(value: string): string[] {
	const refs: string[] = [];
	const re = /var\((--[a-zA-Z0-9_-]+)/g;
	let match = re.exec(value);
	while (match !== null) {
		refs.push(match[1]);
		match = re.exec(value);
	}
	return refs;
}

export interface ValidationError {
	category: string;
	valueId: string;
	valueIndex: number;
	property: string;
	reference: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
	stats: {
		totalRefs: number;
		validRefs: number;
		brokenRefs: number;
		availableProps: number;
	};
}

/**
 * Validate every var() reference in the registry against built CSS outputs.
 *
 * @param tokensCssPath - Path to generated tokens.css (:root block)
 * @param tailwindCssPath - Path to generated tailwind.css (@theme block)
 * @param registry - TOKEN_CATEGORY_REGISTRY loaded via jiti
 */
export function validateRegistryRefs(
	tokensCssPath: string,
	tailwindCssPath: string,
	registry: CategoryDefinition[],
): ValidationResult {
	const tokensCss = readFileSync(tokensCssPath, "utf-8");
	const tailwindCss = readFileSync(tailwindCssPath, "utf-8");

	// Build union of all available custom properties
	const rootProps = extractCustomProperties(tokensCss);
	const themeProps = extractCustomProperties(tailwindCss);
	const allProps = new Set([...rootProps, ...themeProps]);

	const errors: ValidationError[] = [];
	let totalRefs = 0;
	let validRefs = 0;

	for (const cat of registry) {
		for (const value of cat.values) {
			for (const [prop, cssValue] of Object.entries(value.tokenRefs)) {
				const refs = extractVarRefs(cssValue);
				for (const ref of refs) {
					totalRefs++;
					if (allProps.has(ref)) {
						validRefs++;
					} else {
						errors.push({
							category: cat.code,
							valueId: value.id,
							valueIndex: value.index,
							property: prop,
							reference: ref,
							message: `${cat.code}${value.index} (${value.id}): "${prop}" references ${ref} — NOT FOUND in tokens.css or tailwind.css`,
						});
					}
				}
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		stats: {
			totalRefs,
			validRefs,
			brokenRefs: errors.length,
			availableProps: allProps.size,
		},
	};
}
