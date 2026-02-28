/**
 * @file scripts/dev/design/sd/build.ts
 * @package @devpulse/coldlight
 *
 * SD5 token pipeline entry point.
 *
 * Usage: node scripts/dev/design/sd/build.ts
 *
 * Pipeline:
 *   1. ts-to-dtcg.ts  — load TS token sources via jiti → DTCG JSON → tokens.json
 *   2. config.ts      — register custom formats + build SD5 config
 *   3. SD5            — buildAllPlatforms() → tokens.css, tailwind.css, types.ts
 *   4. Generated CSS  — variants.css, typography.css, focus.css, scrollbars.css, keyframes.css
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import StyleDictionary from "style-dictionary";
import { dtcgPath, tokensConfig, jitiEnums, jitiVariantKeys, desktopRoot } from "./preprocessors/ts-to-dtcg.js";
import { buildConfig } from "./config.js";
import { generateVariantsCSS } from "./formats/variants.js";
import {
	generateTypographyCSS,
	generateFocusCSS,
	generateScrollbarsCSS,
	generateKeyframesCSS,
} from "./formats/generated-css.js";

// ── Step 1: SD5 build (tokens.css, tailwind.css, types.ts) ──────────────────
const config = buildConfig(dtcgPath, tokensConfig, jitiEnums, desktopRoot);
const sd = new StyleDictionary(config);

await sd.buildAllPlatforms();

console.log(`[SD5] CSS:   ${tokensConfig.platforms.css.output}`);
console.log(`[SD5] Theme: ${tokensConfig.platforms.theme.output}`);
console.log(`[SD5] Types: ${tokensConfig.platforms.types.output}`);
console.log(`[SD5] DTCG:  ${tokensConfig.dtcg.output}`);

// ── Step 2: Generate additional CSS from token SSOT ──────────────────────────
const generatedDir = resolve(desktopRoot, "src/lib/design/generated");
mkdirSync(generatedDir, { recursive: true });

const generatedFiles = [
	{ name: "variants.css", content: generateVariantsCSS(jitiVariantKeys) },
	{ name: "typography.css", content: generateTypographyCSS() },
	{ name: "focus.css", content: generateFocusCSS() },
	{ name: "scrollbars.css", content: generateScrollbarsCSS() },
	{ name: "keyframes.css", content: generateKeyframesCSS() },
];

for (const file of generatedFiles) {
	const path = resolve(generatedDir, file.name);
	writeFileSync(path, file.content, "utf-8");
	console.log(`[GEN] ${file.name}`);
}

console.log("[SD5] Build complete — all CSS generated from token SSOT.");
