/**
 * @file ColdLight Roots
 * @package @devpulse/coldlight
 *
 * All paths are repo-relative. Build tools resolve from project root.
 * Every folder listed here MUST exist. Scanner validates.
 */

export const ROOTS = {
	designRoot: "src/lib/design",
	apiRoot: "src/lib/design/api",
	primitivesRoot: "src/lib/design/primitives",
	componentsRoot: "src/lib/design/components",
	generatedRoot: "src/lib/design/.generated",
} as const;
