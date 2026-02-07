/**
 * @file ColdLight Generation
 * @package @devpulse/coldlight
 */

export const GENERATION = {
	categories: {
		primitives: { enabled: true },
		semantics: { enabled: false },
		composites: { enabled: false },
	},
	outputs: {
		manifestJson: "src/lib/design/taxonomy/.generated/coldlight.manifest.json",
		importsTs: "src/lib/design/taxonomy/.generated/imports.gen.ts",
	},
} as const;
