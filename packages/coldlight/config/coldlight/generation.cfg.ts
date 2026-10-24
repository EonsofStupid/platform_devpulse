/**
 * @file ColdLight Generation
 * @package @devpulse/coldlight
 *
 * Declares which categories the scanner/generator should process.
 * When enabled, the scanner validates parity and the generator
 * produces manifest entries for that category.
 */

export const GENERATION = {
	categories: {
		primitives: { enabled: true },
		components: { enabled: true },
		effects: { enabled: true },
		svg: { enabled: true },
		composites: { enabled: false },
	},
	outputs: {
		manifestJson: "src/lib/design/generated/coldlight.manifest.json",
		importsTs: "src/lib/design/.generated/imports.gen.ts",
	},
} as const;
