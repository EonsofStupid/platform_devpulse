/**
 * @file Dialog Primitive Barrel
 * @description Exports all Dialog components and related types/utilities.
 *
 * Usage:
 * ```ts
 * import {
 *   Dialog, DialogTrigger, DialogPortal, DialogOverlay,
 *   DialogContent, DialogTitle, DialogDescription, DialogClose
 * } from "$lib/design/primitives/dialog";
 * ```
 */

// =============================================================================
// SLOT COMPONENTS
// =============================================================================

export { default as Dialog } from "./Dialog.svelte";
export { default as DialogTrigger } from "./DialogTrigger.svelte";
export { default as DialogPortal } from "./DialogPortal.svelte";
export { default as DialogOverlay } from "./DialogOverlay.svelte";
export { default as DialogContent } from "./DialogContent.svelte";
export { default as DialogTitle } from "./DialogTitle.svelte";
export { default as DialogDescription } from "./DialogDescription.svelte";
export { default as DialogClose } from "./DialogClose.svelte";

// =============================================================================
// TYPES, CONTEXT, CONTRACT
// =============================================================================

export * from "./dialog.js";
