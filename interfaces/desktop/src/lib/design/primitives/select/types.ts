/**
 * @file primitives/select/types.ts
 * @layer primitives
 *
 * Type definitions for Select primitive.
 * Generic dropdown selection with single/multiple modes.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes, HTMLAttributes } from "svelte/elements";

// ============================================
// SELECT SLOTS
// ============================================

export const SelectSlots = [
  "root",
  "trigger",
  "portal",
  "content",
  "viewport",
  "item",
  "item-text",
  "item-group",
  "group-label",
  "separator",
  "scroll-up",
  "scroll-down",
  "arrow",
] as const;

export type SelectSlot = (typeof SelectSlots)[number];

// ============================================
// SELECT STATE
// ============================================

export type SelectState = "open" | "closed";

// ============================================
// SELECTION MODE
// ============================================

export type SelectType = "single" | "multiple";

// ============================================
// POSITIONING TYPES
// ============================================

/** Side of anchor to position content against */
export type SelectSide = "top" | "right" | "bottom" | "left";

/** Alignment relative to anchor */
export type SelectAlign = "start" | "center" | "end";

// ============================================
// ITEM TYPE FOR TYPEAHEAD
// ============================================

/** Item definition for typeahead lookup */
export interface SelectItem {
  /** Unique value for this item (bits-ui requires string) */
  value: string;
  /** Display label for typeahead and lookup */
  label: string;
  /** Whether this item is disabled */
  disabled?: boolean;
}

// ============================================
// ROOT PROPS
// ============================================

export interface SelectRootProps {
  /** Controlled open state (bindable) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Selected value (bindable) - string for single, string[] for multiple */
  value?: string | string[];
  /** Callback when value changes */
  onValueChange?: (value: string | string[]) => void;
  /** Selection mode */
  type?: SelectType;
  /** Items array for typeahead and label lookup */
  items?: SelectItem[];
  /** Disable the entire select */
  disabled?: boolean;
  /** Loop keyboard navigation */
  loop?: boolean;
  /** Form field name for native submission */
  name?: string;
  /** Form field required validation */
  required?: boolean;
  /** Children (Trigger, Portal) */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// TRIGGER PROPS
// ============================================

export interface SelectTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
  /** Button content */
  children?: Snippet;
  /** Disable the trigger */
  disabled?: boolean;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// PORTAL PROPS
// ============================================

export interface SelectPortalProps {
  /** Portal target selector or element (default: body) */
  to?: string | HTMLElement;
  /** Disable portal rendering */
  disabled?: boolean;
  /** Children (Content) */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// CONTENT PROPS
// ============================================

export interface SelectContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Snippet receives { open } for animations */
  children?: Snippet<[{ open: boolean }]> | Snippet;

  // Positioning
  /** Side of anchor to position against (default: "bottom") */
  side?: SelectSide;
  /** Distance from anchor in pixels (default: 4) */
  sideOffset?: number;
  /** Alignment relative to anchor (default: "start") */
  align?: SelectAlign;
  /** Offset from alignment in pixels */
  alignOffset?: number;
  /** Padding between arrow and content edges */
  arrowPadding?: number;

  // Collision handling
  /** Override side/align to avoid collisions (default: true) */
  avoidCollisions?: boolean;
  /** Padding around viewport for collision detection (default: 8) */
  collisionPadding?: number | Partial<Record<SelectSide, number>>;

  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// VIEWPORT PROPS
// ============================================

export interface SelectViewportProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Children (Items, Groups, Separators) */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// ITEM PROPS
// ============================================

export interface SelectItemProps {
  /** Item value (bits-ui requires string) */
  value: string;
  /** Disable this item */
  disabled?: boolean;
  /** Label for typeahead search (defaults to textContent) */
  label?: string;
  /** Additional CSS classes */
  class?: string;
  /** Snippet receives { selected, highlighted } for conditional rendering */
  children?: Snippet<[{ selected: boolean; highlighted: boolean }]> | Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// ITEM TEXT PROPS
// ============================================

export interface SelectItemTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children"> {
  /** Text content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// ITEM GROUP PROPS
// ============================================

export interface SelectItemGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Children (GroupLabel, Items) */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// GROUP LABEL PROPS
// ============================================

export interface SelectGroupLabelProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Label content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// SEPARATOR PROPS
// ============================================

export interface SelectSeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// SCROLL BUTTON PROPS
// ============================================

export interface SelectScrollUpProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Button content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

export interface SelectScrollDownProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Button content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// ARROW PROPS
// ============================================

export interface SelectArrowProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Reference to the arrow element (bindable) */
  ref?: HTMLElement | null;
  /** Arrow width in pixels (default: 8) */
  width?: number;
  /** Arrow height in pixels (default: 8) */
  height?: number;
  /** User-defined stable ID */
  "data-id"?: string;
}
