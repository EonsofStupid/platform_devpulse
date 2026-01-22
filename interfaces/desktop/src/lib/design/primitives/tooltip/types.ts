/**
 * @file primitives/tooltip/types.ts
 * @layer primitives
 *
 * Type definitions for Tooltip primitive.
 * Hover-triggered floating content for supplementary information.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes, HTMLAttributes } from "svelte/elements";

// ============================================
// TOOLTIP SLOTS
// ============================================

export const TooltipSlots = [
  "root",
  "provider",
  "trigger",
  "portal",
  "content",
  "arrow",
] as const;

export type TooltipSlot = (typeof TooltipSlots)[number];

// ============================================
// TOOLTIP STATE
// ============================================

export type TooltipState = "open" | "closed";

// ============================================
// POSITIONING TYPES
// ============================================

/** Side of anchor to position content against */
export type TooltipSide = "top" | "right" | "bottom" | "left";

/** Alignment relative to anchor */
export type TooltipAlign = "start" | "center" | "end";

// ============================================
// PROVIDER PROPS
// ============================================

export interface TooltipProviderProps {
  /** Delay before showing tooltip in ms (default: 700) */
  delayDuration?: number;
  /** How much time user has to enter another trigger without delay (default: 300) */
  skipDelayDuration?: number;
  /** Prevent tooltip from staying open when trigger is clicked (default: false) */
  disableCloseOnTriggerClick?: boolean;
  /** Disable hover behaviors entirely */
  disableHoverableContent?: boolean;
  /** Disable the provider */
  disabled?: boolean;
  /** Prevent tooltip from opening if focus wasn't from keyboard */
  ignoreNonKeyboardFocus?: boolean;
  /** Children tooltips */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// ROOT PROPS
// ============================================

export interface TooltipRootProps {
  /** Controlled open state (bindable) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Callback when open state change animation completes */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Delay before showing tooltip in ms (overrides provider, default: 700) */
  delayDuration?: number;
  /** Prevent tooltip from staying open when hovering content */
  disableHoverableContent?: boolean;
  /** Prevent tooltip from staying open when trigger is clicked */
  disableCloseOnTriggerClick?: boolean;
  /** Disable the tooltip */
  disabled?: boolean;
  /** Prevent tooltip from opening if focus wasn't from keyboard */
  ignoreNonKeyboardFocus?: boolean;
  /** Children (Trigger, Portal) */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// TRIGGER PROPS
// ============================================

export interface TooltipTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
  /** Trigger content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// PORTAL PROPS
// ============================================

export interface TooltipPortalProps {
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

export interface TooltipContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Snippet receives { open } for animations */
  children?: Snippet<[{ open: boolean }]> | Snippet;

  // Positioning
  /** Side of anchor to position against (default: "top") */
  side?: TooltipSide;
  /** Distance from anchor in pixels (default: 4) */
  sideOffset?: number;
  /** Alignment relative to anchor (default: "center") */
  align?: TooltipAlign;
  /** Offset from alignment in pixels */
  alignOffset?: number;
  /** Padding between arrow and content edges */
  arrowPadding?: number;

  // Collision handling
  /** Override side/align to avoid collisions (default: true) */
  avoidCollisions?: boolean;
  /** Padding around viewport for collision detection (default: 8) */
  collisionPadding?: number | Partial<Record<TooltipSide, number>>;
  /** Sticky behavior: "partial" or "always" */
  sticky?: "partial" | "always";
  /** Hide when detached from anchor */
  hideWhenDetached?: boolean;

  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// ARROW PROPS
// ============================================

export interface TooltipArrowProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Reference to the arrow element (bindable) */
  ref?: HTMLElement | null;
  /** Arrow width in pixels (default: 8) */
  width?: number;
  /** Arrow height in pixels (default: 8) */
  height?: number;
  /** User-defined stable ID */
  "data-id"?: string;
}
