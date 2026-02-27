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
	/** ColdLight-owned builders (headless ARIA+behavior, replaces melt for ColdLight-owned kinds) */
	buildersRoot: "src/lib/design/builders",
	/** Recipe definitions — styling patterns per component kind */
	recipesRoot: "src/lib/design/recipes",
	/** Effect definitions — composable visual building blocks */
	effectsRoot: "src/lib/design/effects",
	/** SVG filter library + parametric blanks — premium tier neumorphism */
	svgRoot: "src/lib/design/svg",
	generatedRoot: "src/lib/design/.generated",
} as const;
