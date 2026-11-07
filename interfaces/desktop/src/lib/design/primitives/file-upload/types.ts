/**
 * @file primitives/file-upload/types.ts
 * @kind file-upload
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * File-upload primitive type declarations — structural props, slot/state vocabularies.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui" — MeltUI adapter handles ARIA + state via transport chain.
 *
 * Builder: new FileUpload()
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes, HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the file-upload primitive */
export const fileUploadSlots = ["root", "trigger", "hiddenInput"] as const;
export type FileUploadSlot = (typeof fileUploadSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the file-upload primitive */
export const fileUploadStateTokens = [
	"focused",
	"focus-visible",
	"hover",
	"disabled",
] as const satisfies readonly StateToken[];
export type FileUploadState = (typeof fileUploadStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each file-upload slot to its allowed state tokens */
export const fileUploadSlotStates = {
	root: ["hover", "disabled"],
	trigger: ["focused", "focus-visible", "hover"],
	hiddenInput: [],
} as const satisfies SlotStateMap<FileUploadSlot, FileUploadState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * FileUploadRootProps — props for the file-upload root slot.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 */
export interface FileUploadRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps {
	children?: Snippet;
}

/**
 * FileUploadTriggerProps — props for the file-upload trigger slot.
 */
export interface FileUploadTriggerProps
	extends Omit<HTMLButtonAttributes, "style" | "children">,
		BaseProps {
	children?: Snippet;
}
