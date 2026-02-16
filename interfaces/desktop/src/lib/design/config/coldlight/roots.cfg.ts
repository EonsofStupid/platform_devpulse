/**
 * @file ColdLight Roots
 * @package @devpulse/coldlight
 *
 * All paths are repo-relative. Build tools resolve from project root.
 * Every folder listed here MUST exist. Scanner validates.
 */

export const ROOTS = {
	designRoot: "src/lib/design",
	taxonomyRoot: "src/lib/design/taxonomy",
	apiRoot: "src/lib/design/api",
	primitivesRoot: "src/lib/design/primitives",
	componentsRoot: "src/lib/design/components",
	generatedRoot: "src/lib/design/taxonomy/.generated",
} as const;
