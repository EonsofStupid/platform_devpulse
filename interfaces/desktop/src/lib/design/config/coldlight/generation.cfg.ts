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
    manifestJsonPath: "src/lib/design/taxonomy/.generated/coldlight.manifest.json",
    importsPath: "src/lib/design/taxonomy/.generated/coldlight.imports.ts",
    cssPath: "src/lib/design/taxonomy/.generated/coldlight.gen.css",
  },
} as const;
