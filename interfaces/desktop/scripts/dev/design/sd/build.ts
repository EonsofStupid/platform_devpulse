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
 */

import StyleDictionary from "style-dictionary";
import { dtcgPath, tokensConfig, jitiEnums, desktopRoot } from "./preprocessors/ts-to-dtcg.js";
import { buildConfig } from "./config.js";

const config = buildConfig(dtcgPath, tokensConfig, jitiEnums, desktopRoot);
const sd = new StyleDictionary(config);

await sd.buildAllPlatforms();

console.log(`[SD5] CSS:   ${tokensConfig.platforms.css.output}`);
console.log(`[SD5] Theme: ${tokensConfig.platforms.theme.output}`);
console.log(`[SD5] Types: ${tokensConfig.platforms.types.output}`);
console.log(`[SD5] DTCG:  ${tokensConfig.dtcg.output}`);
