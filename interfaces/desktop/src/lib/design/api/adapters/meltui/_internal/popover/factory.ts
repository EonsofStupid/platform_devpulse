/**
 * @file api/adapters/meltui/_internal/popover/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Popover Factory — ONLY file that imports from `melt` for popover.
 * Wraps melt v0.44 Popover class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/popover/
 */

import { Popover, type PopoverProps } from "melt/builders";

export type MeltPopoverInstance = Popover;
export type MeltPopoverConfig = PopoverProps;

/**
 * Create a MeltUI Popover instance.
 * This is the ONLY place `Popover` from `melt/builders` is instantiated.
 */
export function createMeltPopover(config?: MeltPopoverConfig): MeltPopoverInstance {
	return new Popover(config);
}
