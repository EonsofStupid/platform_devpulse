/**
 * @file ColdLight Configuration Orchestrator
 * @package @devpulse/coldlight
 *
 * Assembles configuration from fragments.
 * This is the single import point for build tools, scanner, and registry.
 */

import { ADAPTERS } from "./config/coldlight/adapters.cfg.js";
import { ATTRIBUTES } from "./config/coldlight/attributes.cfg.js";
import { ENFORCEMENT } from "./config/coldlight/enforcement.cfg.js";
import { GENERATION } from "./config/coldlight/generation.cfg.js";
import { IDENTITY } from "./config/coldlight/identity.cfg.js";
import { ROOTS } from "./config/coldlight/roots.cfg.js";
import { TOKENS } from "./config/coldlight/tokens.cfg.js";
import type { ColdLightConfig } from "./config/coldlight/types.js";

export const coldlightConfig = {
	identity: IDENTITY,
	roots: ROOTS,
	adapters: ADAPTERS,
	generation: GENERATION,
	enforcement: ENFORCEMENT,
	attributes: ATTRIBUTES,
	tokens: TOKENS,
} as const satisfies ColdLightConfig;

export type { ColdLightConfig };
export default coldlightConfig;
