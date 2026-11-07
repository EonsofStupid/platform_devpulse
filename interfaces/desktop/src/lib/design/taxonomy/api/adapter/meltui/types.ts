/**
 * @file MeltUI Adapter Type Declarations
 * @description Declares what MeltUI provides as a headless UI library.
 *
 * This is the TAXONOMY declaration - it declares MeltUI's identity and
 * capabilities so the scanner/registry can enforce parity rules without
 * importing MeltUI implementation code.
 */

import type { AriaStateProvider } from "$lib/design/taxonomy/types";

/** MeltUI adapter identity */
export type MeltAdapterId = "meltui";

/** MeltUI is an AriaStateProvider */
export type MeltAdapterRole = AriaStateProvider & "meltui";

/** MeltUI builder function signature */
export type MeltBuilderName = `create${string}`;

/** Standard ARIA attributes MeltUI manages - never override these */
export type MeltManagedAttr =
	| "role"
	| "aria-modal"
	| "aria-labelledby"
	| "aria-describedby"
	| "aria-selected"
	| "aria-expanded"
	| "aria-disabled"
	| "aria-pressed"
	| "aria-checked"
	| "aria-orientation"
	| "aria-controls"
	| "aria-haspopup"
	| "aria-activedescendant"
	| "aria-label"
	| "aria-valuenow"
	| "aria-valuemin"
	| "aria-valuemax"
	| "aria-valuetext"
	| "tabindex"
	| "id";

/**
 * MeltUI primitives that have builder functions.
 * Each entry here means a `create<Primitive>` function exists in @melt-ui/svelte.
 */
export type MeltPrimitive =
	| "accordion"
	| "alert-dialog"
	| "avatar"
	| "calendar"
	| "checkbox"
	| "collapsible"
	| "combobox"
	| "context-menu"
	| "date-field"
	| "date-picker"
	| "date-range-field"
	| "date-range-picker"
	| "dialog"
	| "dropdown-menu"
	| "label"
	| "link-preview"
	| "menubar"
	| "pagination"
	| "pin-input"
	| "popover"
	| "progress"
	| "radio-group"
	| "range-calendar"
	| "scroll-area"
	| "select"
	| "separator"
	| "slider"
	| "switch"
	| "table-of-contents"
	| "tabs"
	| "tags-input"
	| "toggle"
	| "toggle-group"
	| "toolbar"
	| "tooltip"
	| "tree";

/**
 * Inventory entry for a single MeltUI builder.
 * Declares the builder name and which ARIA attrs it manages.
 */
export interface MeltBuilderEntry {
	readonly kind: string;
	readonly builder: MeltBuilderName;
	readonly manages: readonly MeltManagedAttr[];
}
