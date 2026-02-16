/**
 * @file ColdLight Configuration Orchestrator
 * @package @devpulse/coldlight
 *
 * THE single import point for ALL build tools, scanner, generator, and registry.
 * Assembles configuration from fragments. Every path, adapter, generation flag,
 * testing requirement, and enforcement rule is declared here.
 *
 * Config is the owner's instrument of control.
 * Code serves the config. Config serves the owner.
 */

import { ADAPTERS } from "./config/coldlight/adapters.cfg.js";
import { ATTRIBUTES } from "./config/coldlight/attributes.cfg.js";
import { COMPONENTS } from "./config/coldlight/components.cfg.js";
import { ENFORCEMENT } from "./config/coldlight/enforcement.cfg.js";
import { GENERATION } from "./config/coldlight/generation.cfg.js";
import { IDENTITY } from "./config/coldlight/identity.cfg.js";
import { ROOTS } from "./config/coldlight/roots.cfg.js";
import { TESTING } from "./config/coldlight/testing.cfg.js";
import { TOKENS } from "./config/coldlight/tokens.cfg.js";
import type { ColdLightConfig } from "./config/coldlight/types.js";

export const coldlightConfig = {
	identity: IDENTITY,
	roots: ROOTS,
	adapters: ADAPTERS,
	generation: GENERATION,
	enforcement: ENFORCEMENT,
	attributes: ATTRIBUTES,
	testing: TESTING,
	components: COMPONENTS,
	tokens: TOKENS,
} as const satisfies ColdLightConfig;

export type { ColdLightConfig };
export default coldlightConfig;
