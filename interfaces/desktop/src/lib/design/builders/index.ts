/**
 * @file builders/index.ts
 * @package @devpulse/coldlight
 *
 * Master barrel — re-exports all ColdLight builders.
 * Components import from here or from individual builder barrels.
 */

// Toggle Group
export { ToggleGroup, createToggleGroup } from "./toggle-group/index.js";
export type { ToggleGroupProps } from "./toggle-group/index.js";

// Internal utilities (for advanced usage / testing)
export {
	Synced,
	SelectionState,
	createBuilderMetadata,
	mergeAttrs,
	extract,
	kbd,
	getNextKey,
	getPrevKey,
	dataAttr,
	disabledAttr,
	createId,
	resetIdCounter,
} from "./_internal/index.js";

export type {
	MaybeGetter,
	SlotAttrs,
	DataState,
	Direction,
	Orientation,
	BuilderMetadata,
	SyncedArgs,
	SelectionStateProps,
} from "./_internal/index.js";
