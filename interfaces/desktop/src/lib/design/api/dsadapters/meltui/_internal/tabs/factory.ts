/**
 * @file api/adapters/meltui/_internal/tabs/factory.ts
 * @package @devpulse/coldlight
 *
 * MeltUI Tabs Factory — ONLY file that imports from `melt` for tabs.
 * Wraps melt v0.44 Tabs class (class-based builder API).
 *
 * ColdLight cloaks this entirely. Consumers NEVER import from melt or this file.
 * All access is via the transport layer (_transport/).
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import { Tabs, type TabsProps } from "melt/builders";

export type MeltTabsInstance<T extends string = string> = Tabs<T>;
export type MeltTabsConfig<T extends string = string> = TabsProps<T>;

/**
 * Create a MeltUI Tabs instance.
 * This is the ONLY place `Tabs` from `melt/builders` is instantiated.
 */
export function createMeltTabs<T extends string = string>(
	config: MeltTabsConfig<T>,
): MeltTabsInstance<T> {
	return new Tabs<T>(config);
}
