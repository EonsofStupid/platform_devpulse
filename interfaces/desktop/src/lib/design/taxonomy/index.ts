/**
 * @fileoverview Taxonomy - Block Kinds, Contracts, and Slots
 * @file src/lib/design/taxonomy/index.ts
 * @module @devpulse/design/taxonomy
 * @layer taxonomy
 *
 * @description
 * TIER 1: Defines WHAT BLOCKS EXIST and their constraints.
 * - kinds.ts: Block kind definitions (panel, shell, widget, chat)
 * - contracts.ts: Prop schemas for each kind (DsSurfaceProps base)
 * - slots.ts: Slot definitions and child constraints
 *
 * @since 1.0.0
 */

// ===========================================
// BLOCK KINDS
// ===========================================
export {
  blockKinds,
  blockKindKeys,
  shellKinds,
  surfaceKinds,
  widgetKinds,
  chatKinds,
  getKindDefinition,
  requiresGridLayout,
  getKindSlots,
  type BlockKind,
  type BlockKindDefinition,
  type LayoutMode,
} from "./kinds";

// ===========================================
// PROP CONTRACTS
// ===========================================
export {
  // Base contract
  DsSurfacePropsSchema,
  type DsSurfaceProps,

  // Config schemas
  DsColorConfigSchema,
  DsSurfaceConfigSchema,
  DsFrameConfigSchema,
  DsDepthConfigSchema,
  DsFxConfigSchema,
  DsMotionConfigSchema,

  // Kind-specific contracts
  PanelPropsSchema,
  ShellPropsSchema,
  ChatDockPropsSchema,
  WidgetPropsSchema,
  type PanelProps,
  type ShellProps,
  type ChatDockProps,
  type WidgetProps,

  // Contract registry
  kindContracts,
  getKindSchema,
  validateKindProps,
  getDefaultProps,
  type KindContract,
} from "./contracts";

// ===========================================
// SLOT DEFINITIONS
// ===========================================
export {
  DsSlotConfigSchema,
  type DsSlotConfig,
  panelSlots,
  shellSlots,
  threeColumnSlots,
  chatSlots,
  kindSlots,
  getKindSlots as getSlotConfig,
  isChildAllowed,
} from "./slots";

// ===========================================
// LEGACY CATEGORY DEFINITIONS
// ===========================================

/**
 * All valid design system categories.
 * @deprecated Use blockKinds for block-level taxonomy.
 */
export const DesignCategories = [
  "surface",   // Material types: glass, solid, matte
  "tone",      // Color temperature: cold, neutral, warm
  "glow",      // Glow effect: off, soft, hard
  "radius",    // Border radius ramp
  "accent",    // Accent color palette
  "space",     // Spacing ramp
  "blur",      // Blur intensity ramp
  "depth",     // Depth/shadow ramp
  "text",      // Text size ramp
  "motion",    // Animation presets
  "behavior",  // Interaction modules
] as const;

export type DesignCategory = typeof DesignCategories[number];

/**
 * @deprecated Use kindContracts for kind-level capabilities.
 */
export interface ComponentCapabilities {
  supportedSurfaces?: readonly string[];
  supportedTones?: readonly string[];
  supportedGlows?: readonly string[];
}
