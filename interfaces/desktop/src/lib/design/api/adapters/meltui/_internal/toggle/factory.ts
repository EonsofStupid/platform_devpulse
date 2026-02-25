/**
 * @file api/adapters/meltui/_internal/toggle/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Toggle Factory — ONLY file that imports from `melt` for toggle.
 * Wraps melt v0.44 Toggle class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import { Toggle, type ToggleProps } from "melt/builders";

export type MeltToggleInstance = Toggle;
export type MeltToggleConfig = ToggleProps;

/**
 * Create a MeltUI Toggle instance.
 * This is the ONLY place `Toggle` from `melt/builders` is instantiated.
 */
export function createMeltToggle(config?: MeltToggleConfig): MeltToggleInstance {
	return new Toggle(config);
}
