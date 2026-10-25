/**
 * @file design/api/adapters/meltui/_internal/index.ts
 * @layer internal
 *
 * Internal adapter barrel export.
 * Provides getMeltInternal() to get runtime mapping for any primitive.
 */

import type { ColdLightPrimitiveKind } from '$lib/design/taxonomy/api/adapter/coldlight/index.js';
import type { MeltUIInternalAdapter } from './types.js';

// Import all internal adapters
import { meltButtonInternal } from './button.internal.js';
import { meltTabsInternal } from './tabs.internal.js';
import { meltInputInternal } from './input.internal.js';
import { meltAccordionInternal } from './accordion.internal.js';
import { meltDialogInternal } from './dialog.internal.js';
import { meltTooltipInternal } from './tooltip.internal.js';
import { meltSelectInternal } from './select.internal.js';
import { meltCheckboxInternal } from './checkbox.internal.js';
import { meltSwitchInternal } from './switch.internal.js';
import { meltPopoverInternal } from './popover.internal.js';

// Adapter lookup table
const table: Partial<Record<ColdLightPrimitiveKind, MeltUIInternalAdapter<ColdLightPrimitiveKind>>> = {
  button: meltButtonInternal,
  tabs: meltTabsInternal,
  input: meltInputInternal,
  accordion: meltAccordionInternal,
  dialog: meltDialogInternal,
  tooltip: meltTooltipInternal,
  select: meltSelectInternal,
  checkbox: meltCheckboxInternal,
  switch: meltSwitchInternal,
  popover: meltPopoverInternal,
};

/**
 * Get internal adapter for a primitive kind.
 * Throws if adapter not yet implemented.
 */
export function getMeltInternal<K extends ColdLightPrimitiveKind>(
  kind: K
): MeltUIInternalAdapter<K> {
  const impl = table[kind];
  if (!impl) {
    throw new Error(`[meltui/_internal] missing adapter for kind: ${kind}`);
  }
  return impl as MeltUIInternalAdapter<K>;
}

/**
 * Check if an internal adapter exists for a primitive kind.
 */
export function hasMeltInternal(kind: ColdLightPrimitiveKind): boolean {
  return kind in table;
}

/**
 * Get all implemented primitive kinds.
 */
export function getImplementedKinds(): ColdLightPrimitiveKind[] {
  return Object.keys(table) as ColdLightPrimitiveKind[];
}

// Re-export types
export type { MeltUIInternalAdapter, ColdLightRuntimeParts } from './types.js';
