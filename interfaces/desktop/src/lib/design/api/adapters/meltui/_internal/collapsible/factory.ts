/**
 * @file api/adapters/meltui/_internal/collapsible/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Collapsible Factory — ONLY file that imports from `melt` for collapsible.
 * Wraps melt v0.44 Collapsible class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 */

import { Collapsible, type CollapsibleProps } from "melt/builders";

export type MeltCollapsibleInstance = Collapsible;
export type MeltCollapsibleConfig = CollapsibleProps;

/**
 * Create a MeltUI Collapsible instance.
 * This is the ONLY place `Collapsible` from `melt/builders` is instantiated.
 */
export function createMeltCollapsible(config?: MeltCollapsibleConfig): MeltCollapsibleInstance {
	return new Collapsible(config);
}
