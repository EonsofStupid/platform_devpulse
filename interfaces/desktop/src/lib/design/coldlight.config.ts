/**
 * @file ColdLight Configuration Orchestrator
 * @package @devpulse/coldlight
 *
 * Assembles configuration from fragments.
 * This is the single import point for build tools, scanner, and registry.
 */

import type { ColdLightConfig } from "./config/coldlight/types.js";
import { IDENTITY } from "./config/coldlight/identity.cfg.js";
import { ROOTS } from "./config/coldlight/roots.cfg.js";
import { ADAPTERS } from "./config/coldlight/adapters.cfg.js";
import { GENERATION } from "./config/coldlight/generation.cfg.js";
import { ENFORCEMENT } from "./config/coldlight/enforcement.cfg.js";
import { ATTRIBUTES } from "./config/coldlight/attributes.cfg.js";

export const coldlightConfig = {
  identity: IDENTITY,
  roots: ROOTS,

  adapters: {
    enabled: Object.keys(ADAPTERS),
    defaultActive: "meltui",
    ariaStateProvider: "meltui",
  },

  generation: GENERATION,
  enforcement: ENFORCEMENT,
  attributes: ATTRIBUTES,
} as const satisfies ColdLightConfig;

export type { ColdLightConfig };
export default coldlightConfig;
