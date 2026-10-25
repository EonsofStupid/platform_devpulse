/**
 * @file api/adapters/meltui/_internal/tooltip/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Tooltip Factory — ONLY file that imports from `melt` for tooltip.
 * Wraps melt v0.44 Tooltip class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import { Tooltip, type TooltipProps } from "melt/builders";

export type MeltTooltipInstance = Tooltip;
export type MeltTooltipConfig = TooltipProps;

/**
 * Create a MeltUI Tooltip instance.
 * This is the ONLY place `Tooltip` from `melt/builders` is instantiated.
 */
export function createMeltTooltip(config?: MeltTooltipConfig): MeltTooltipInstance {
	return new Tooltip(config);
}
