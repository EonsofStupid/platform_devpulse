/**
 * @file Blueprint Types
 * @description Composition defaults and slot wiring for ColdLight components.
 */

import type { DsSurfaceProps } from "$lib/design/recipes/types.js";

/** Blueprint: composition defaults for a component kind */
export interface BlueprintDefinition {
  id: string;
  kind: string;
  label: string;
  defaultRecipe: string;
  defaultProps: Partial<DsSurfaceProps>;
  slots?: Record<string, SlotWiring>;
}

/** Slot wiring metadata */
export interface SlotWiring {
  required: boolean;
}
