/**
 * @file MeltUI Tabs Factory
 * @description Wraps MeltUI's createTabs builder.
 *
 * This is the ONLY file that imports @melt-ui/svelte for tabs.
 * Everything else goes through ColdLight's public adapter surface.
 *
 * CRITICAL: MeltUI's tabs trigger and content are FUNCTIONS:
 * - trigger(value: string | { value: string; disabled?: boolean }) → returns store
 * - content(tabValue: string) → returns store
 * - root and list are direct stores
 */

import { createTabs, type CreateTabsProps } from "@melt-ui/svelte";

/** MeltUI tabs instance type (opaque to consumers) */
export type MeltTabsInstance = ReturnType<typeof createTabs>;

/** Props accepted by the MeltUI tabs builder */
export type MeltTabsConfig = CreateTabsProps;

/**
 * Create a MeltUI tabs instance.
 * This is the single entry point - primitives never call createTabs directly.
 */
export function createMeltTabs(config?: MeltTabsConfig): MeltTabsInstance {
  return createTabs(config);
}
