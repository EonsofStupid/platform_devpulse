/**
 * @file primitives/dialog/types.ts
 * @layer primitives
 *
 * Type definitions for Dialog primitive.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes, HTMLAttributes } from "svelte/elements";

// ============================================
// DIALOG SLOTS
// ============================================

export const DialogSlots = [
  "root",
  "trigger",
  "portal",
  "overlay",
  "content",
  "title",
  "description",
  "close",
] as const;

export type DialogSlot = (typeof DialogSlots)[number];

// ============================================
// DIALOG STATE
// ============================================

export type DialogState = "open" | "closed";

// ============================================
// ROOT PROPS
// ============================================

export interface DialogRootProps {
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

export interface DialogTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
  /** Button content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// PORTAL PROPS
// ============================================

export interface DialogPortalProps {
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

export interface DialogOverlayProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Snippet receives { open } for animations */
  children?: Snippet<[{ open: boolean }]>;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// CONTENT PROPS
// ============================================

export interface DialogContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Snippet receives { open } for animations */
  children?: Snippet<[{ open: boolean }]> | Snippet;
  /** Close on escape key (default: true) */
  closeOnEscape?: boolean;
  /** Close on click outside (default: true) */
  closeOnOutsideClick?: boolean;
  /** Trap focus inside dialog (default: true) */
  trapFocus?: boolean;
  /** Prevent body scroll (default: true) */
  preventScroll?: boolean;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// TITLE PROPS
// ============================================

export interface DialogTitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children"> {
  /** Heading level 1-6 (default: 2) */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Title content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// DESCRIPTION PROPS
// ============================================

export interface DialogDescriptionProps extends Omit<HTMLAttributes<HTMLParagraphElement>, "style" | "children"> {
  /** Description content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// CLOSE PROPS
// ============================================

export interface DialogCloseProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
  /** Button content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}
