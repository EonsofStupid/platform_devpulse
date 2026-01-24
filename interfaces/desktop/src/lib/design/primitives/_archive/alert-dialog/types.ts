/**
 * @file primitives/alert-dialog/types.ts
 * @layer primitives
 *
 * Type definitions for AlertDialog primitive.
 * AlertDialog is for destructive/confirmation actions requiring explicit user decision.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes, HTMLAttributes } from "svelte/elements";

// ============================================
// ALERT DIALOG SLOTS
// ============================================

export const AlertDialogSlots = [
  "root",
  "trigger",
  "portal",
  "overlay",
  "content",
  "title",
  "description",
  "action",
  "cancel",
] as const;

export type AlertDialogSlot = (typeof AlertDialogSlots)[number];

// ============================================
// ALERT DIALOG STATE
// ============================================

export type AlertDialogState = "open" | "closed";

// ============================================
// ROOT PROPS
// ============================================

export interface AlertDialogRootProps {
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

export interface AlertDialogTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
  /** Button content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// PORTAL PROPS
// ============================================

export interface AlertDialogPortalProps {
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

export interface AlertDialogOverlayProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Snippet receives { open } for animations */
  children?: Snippet<[{ open: boolean }]>;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// CONTENT PROPS
// ============================================

export interface AlertDialogContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  /** Snippet receives { open } for animations */
  children?: Snippet<[{ open: boolean }]> | Snippet;
  /**
   * Close on escape key (default: true)
   * Note: Consider setting to false for critical confirmations
   */
  closeOnEscape?: boolean;
  /**
   * Behavior when interacting outside (default: "ignore")
   * CRITICAL: AlertDialog defaults to "ignore" unlike Dialog
   * This forces explicit user action (Action or Cancel button)
   */
  interactOutsideBehavior?: "close" | "ignore";
  /** Trap focus inside alert dialog (default: true) */
  trapFocus?: boolean;
  /** Prevent body scroll (default: true) */
  preventScroll?: boolean;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// TITLE PROPS
// ============================================

export interface AlertDialogTitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children"> {
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

export interface AlertDialogDescriptionProps extends Omit<HTMLAttributes<HTMLParagraphElement>, "style" | "children"> {
  /** Description content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// ACTION PROPS
// ============================================

/**
 * Action button - does NOT auto-close the dialog.
 * Used for destructive/confirming actions (Delete, Confirm, etc.)
 * The consumer is responsible for closing the dialog after the action.
 */
export interface AlertDialogActionProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
  /** Button content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}

// ============================================
// CANCEL PROPS
// ============================================

/**
 * Cancel button - auto-closes the dialog.
 * Used for aborting the action (Cancel, Nevermind, etc.)
 */
export interface AlertDialogCancelProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
  /** Button content */
  children?: Snippet;
  /** User-defined stable ID */
  "data-id"?: string;
}
