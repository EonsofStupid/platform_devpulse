/**
 * @file Dialog Context
 * @description Svelte context for sharing dialog state between compound components.
 *
 * The root Dialog component creates the dialog builder instance and shares
 * it via context. Child components (Trigger, Content, etc.) access it
 * to render their slots.
 *
 * Imports from ColdLight cloak — zero adapter awareness.
 */

import { getContext, setContext } from "svelte";
import type { DialogInstance } from "$lib/design/taxonomy/.generated/imports.gen";

// =============================================================================
// CONTEXT KEY
// =============================================================================

const DIALOG_CTX = Symbol("dialog");

// =============================================================================
// TYPES
// =============================================================================

/**
 * Dialog context type - the builder instance from the adapter layer.
 * Opaque to consumers - they don't need to know it's MeltUI underneath.
 */
export type DialogContext = DialogInstance;

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
