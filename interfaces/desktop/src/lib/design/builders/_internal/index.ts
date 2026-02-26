/**
 * @file builders/_internal/index.ts
 * @package @devpulse/coldlight
 *
 * Barrel export for all ColdLight builder foundational utilities.
 * Every builder imports from here.
 */

// Types
export type {
	MaybeGetter,
	BuilderAttrs,
	DataState,
	Direction,
	Orientation,
} from "./types.js";

// Type guards
export {
	isFunction,
	isGetter,
	isString,
	isHTMLElement,
	isIterable,
	isEventHandler,
} from "./is.js";

// MaybeGetter resolution
export { extract } from "./extract.js";

// Keyboard constants + helpers
export { kbd, getNextKey, getPrevKey } from "./keyboard.js";
export type { KbdKey } from "./keyboard.js";

// Data attributes + IDs
export {
	createId,
	resetIdCounter,
	dataAttr,
	disabledAttr,
	createBuilderMetadata,
} from "./builder-metadata.js";
export type { BuilderMetadata } from "./builder-metadata.js";

// Attribute composition
export { mergeAttrs } from "./merge-attrs.js";

// State management (Svelte runes)
export { Synced } from "./synced.svelte.js";
export type { SyncedArgs } from "./synced.svelte.js";

export { SelectionState } from "./selection-state.svelte.js";
export type { SelectionStateProps } from "./selection-state.svelte.js";
