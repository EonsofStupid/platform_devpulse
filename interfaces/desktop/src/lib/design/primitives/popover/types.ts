/**
 * @file primitives/popover/types.ts
 * @layer primitives
 *
 * Type definitions for Popover primitive.
 * Non-modal floating content positioned relative to trigger.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes, HTMLAttributes } from "svelte/elements";

// ============================================
// POPOVER SLOTS
// ============================================

export const PopoverSlots = [
  "root",
  "trigger",
  "portal",
  "overlay",
  "content",
  "close",
  "arrow",
] as const;

export type PopoverSlot = (typeof PopoverSlots)[number];

// ============================================
// POPOVER STATE
// ============================================

export type PopoverState = "open" | "closed";

// ============================================
// POSITIONING TYPES
// ============================================

/** Side of anchor to position content against */
export type PopoverSide = "top" | "right" | "bottom" | "left";

/** Alignment relative to anchor */
export type PopoverAlign = "start" | "center" | "end";

// ============================================
// ROOT PROPS
// ============================================

export interface PopoverRootProps {
  /** Controlled open state (bindable) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Children (Trigger, Portal) */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// TRIGGER PROPS
// ============================================

export interface PopoverTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
  /** Button content */
  children?: Snippet;
  /** Open popover on hover (default: false) */
  openOnHover?: boolean;
  /** Delay before opening on hover in ms (default: 700) */
  openDelay?: number;
  /** Delay before closing after hover ends in ms (default: 300) */
  closeDelay?: number;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// PORTAL PROPS
// ============================================

export interface PopoverPortalProps {
  /** Portal target selector or element (default: body) */
  to?: string | HTMLElement;
  /** Disable portal rendering */
  disabled?: boolean;
  /** Children (Overlay, Content) */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// OVERLAY PROPS
// ============================================

export interface PopoverOverlayProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Snippet receives { open } for animations */
  children?: Snippet<[{ open: boolean }]>;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// CONTENT PROPS
// ============================================

export interface PopoverContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Snippet receives { open } for animations */
  children?: Snippet<[{ open: boolean }]> | Snippet;

  // Positioning
  /** Side of anchor to position against (default: "bottom") */
  side?: PopoverSide;
  /** Distance from anchor in pixels (default: 0) */
  sideOffset?: number;
  /** Alignment relative to anchor (default: "center") */
  align?: PopoverAlign;
  /** Offset from alignment in pixels */
  alignOffset?: number;
  /** Padding between arrow and content edges */
  arrowPadding?: number;

  // Collision handling
  /** Override side/align to avoid collisions (default: true) */
  avoidCollisions?: boolean;
  /** Padding around viewport for collision detection (default: 8) */
  collisionPadding?: number | Partial<Record<PopoverSide, number>>;
  /** Sticky behavior: "partial" or "always" */
  sticky?: "partial" | "always";
  /** Hide when detached from anchor */
  hideWhenDetached?: boolean;

  // Behavior
  /** Close on escape key (default: true) */
  closeOnEscape?: boolean;
  /** Close on click outside (default: true) */
  closeOnOutsideClick?: boolean;
  /** Trap focus inside popover (default: true when interacted) */
  trapFocus?: boolean;
  /** Prevent body scroll when open */
  preventScroll?: boolean;
  /** Custom anchor element (overrides trigger) */
  customAnchor?: string | HTMLElement | null;

  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// CLOSE PROPS
// ============================================

export interface PopoverCloseProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
  /** Button content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// ARROW PROPS
// ============================================

export interface PopoverArrowProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Arrow width in pixels (default: 8) */
  width?: number;
  /** Arrow height in pixels (default: 8) */
  height?: number;
  /** User-defined stable ID */
  "data-id"?: string;
}
