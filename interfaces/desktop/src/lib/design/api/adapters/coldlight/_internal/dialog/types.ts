/**
 * @file ColdLight Dialog Types
 * @description Public types for the dialog primitive API.
 *
 * These types define what consumers of the dialog primitive receive.
 * All props, slot props, and re-exported taxonomy types live here.
 */

import type { DialogSlot, DialogState } from "$lib/design/taxonomy/kinds/primitives/dialog/contract";

// =============================================================================
// RE-EXPORTS FROM TAXONOMY
// =============================================================================

export type { DialogSlot, DialogState };

// =============================================================================
// PROPS
// =============================================================================

/**
 * Props for the dialog primitive.
 * These are the configuration options exposed to consumers.
 */
export interface DialogProps {
  /** Whether the dialog is open (controlled) */
  open?: boolean;

  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;

  /** Close when clicking outside the dialog content */
  closeOnOutsideClick?: boolean;

  /** Close when pressing Escape */
  closeOnEscape?: boolean;

  /** Trap focus inside dialog when open */
  trapFocus?: boolean;

  /** Prevent body scroll when dialog is open */
  preventScroll?: boolean;
}

// =============================================================================
// SLOT PROPS
// =============================================================================

/**
 * Props to spread onto each dialog slot element.
 * These include ARIA attributes, event handlers, and data attributes.
 */
export interface DialogSlotProps {
  /** Root container - manages state */
  root: Record<string, unknown>;

  /** Trigger - opens the dialog */
  trigger: Record<string, unknown>;

  /** Portal - renders outside DOM hierarchy */
  portal: Record<string, unknown>;

  /** Overlay - backdrop behind dialog */
  overlay: Record<string, unknown>;

  /** Content - the dialog panel */
  content: Record<string, unknown>;

  /** Title - aria-labelledby target */
  title: Record<string, unknown>;

  /** Description - aria-describedby target */
  description: Record<string, unknown>;

  /** Close - close button */
  close: Record<string, unknown>;
}
