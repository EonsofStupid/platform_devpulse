/**
 * @file primitives/combobox/index.ts
 * @kind combobox
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Combobox primitive barrel export.
 * Contract lives HERE — with the implementation.
 * No .svelte files — melt-backed primitives get Svelte components later.
 */

export { contract } from "./contract.js";
export { comboboxSlots, comboboxStateTokens, comboboxSlotStates } from "./types.js";
export type {
	ComboboxInputProps,
	ComboboxTriggerProps,
	ComboboxContentProps,
	ComboboxOptionProps,
	ComboboxLabelProps,
	ComboboxSlot,
	ComboboxState,
} from "./types.js";
