/**
 * @file Dialog Context
 * @description Svelte context for sharing dialog state between compound components.
 *
 * The root Dialog component creates the MeltUI dialog and shares it via context.
 * Child components (Trigger, Content, etc.) access it to render their slots.
 */

import { getContext, setContext } from "svelte";
import type { createDialog } from "@melt-ui/svelte";

// =============================================================================
// CONTEXT KEY
// =============================================================================

const DIALOG_CTX = Symbol("dialog");

// =============================================================================
// TYPES
// =============================================================================

/**
 * Dialog context type - the return value of MeltUI's createDialog.
 */
export type DialogContext = ReturnType<typeof createDialog>;

// =============================================================================
// CONTEXT API
// =============================================================================

/**
 * Set dialog context (called by Dialog root).
 */
export function setDialogContext(ctx: DialogContext): void {
  setContext(DIALOG_CTX, ctx);
}

/**
 * Get dialog context (called by child components).
 * Throws if called outside a Dialog component tree.
 */
export function getDialogContext(): DialogContext {
  const ctx = getContext<DialogContext>(DIALOG_CTX);
  if (!ctx) {
    throw new Error("Dialog components must be used within a Dialog.Root");
  }
  return ctx;
}
