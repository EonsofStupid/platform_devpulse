/**
 * @file Combobox Component Barrel — Gold Standard
 * @kind combobox
 * @layer components
 * @package @devpulse/coldlight
 *
 * Public API for the ColdLight Combobox compound component.
 *
 * Usage:
 * ```svelte
 * <script>
 *   import {
 *     Combobox, ComboboxInput, ComboboxTrigger,
 *     ComboboxContent, ComboboxItem, ComboboxGroup,
 *     ComboboxLabel, ComboboxEmpty, ComboboxAnnounce,
 *   } from "$lib/design/components/combobox";
 * </script>
 *
 * <Combobox value={selected} onValueChange={(v) => selected = v}>
 *   <ComboboxLabel>Pick a fruit</ComboboxLabel>
 *   <ComboboxInput placeholder="Search..." />
 *   <ComboboxTrigger>▾</ComboboxTrigger>
 *   <ComboboxContent>
 *     <ComboboxGroup label="Tropical">
 *       <ComboboxItem value="mango">Mango</ComboboxItem>
 *       <ComboboxItem value="papaya">Papaya</ComboboxItem>
 *     </ComboboxGroup>
 *     <ComboboxEmpty>No results found</ComboboxEmpty>
 *   </ComboboxContent>
 *   <ComboboxAnnounce message={`${count} results available`} />
 * </Combobox>
 * ```
 */

// Recipe (SSOT: recipes/components/combobox/)
export {
	type ComboboxRecipeId,
	comboboxRecipeIds,
	comboboxRecipes,
} from "$lib/design/recipes/components/combobox/types.js";
// A11y
export {
	auditCombobox,
	comboboxAdaptAttrs,
	comboboxAnnouncements,
	comboboxFocusConfig,
	comboboxKeyboardMap,
	comboboxLiveRegions,
	comboboxRelationships,
	comboboxSlotAdapt,
} from "./a11y.js";
// Sub-components
export { default as Combobox } from "./Combobox.svelte";
export { default as ComboboxAnnounce } from "./ComboboxAnnounce.svelte";
export { default as ComboboxContent } from "./ComboboxContent.svelte";
export { default as ComboboxEmpty } from "./ComboboxEmpty.svelte";
export { default as ComboboxGroup } from "./ComboboxGroup.svelte";
export { default as ComboboxInput } from "./ComboboxInput.svelte";
export { default as ComboboxItem } from "./ComboboxItem.svelte";
export { default as ComboboxLabel } from "./ComboboxLabel.svelte";
export { default as ComboboxTrigger } from "./ComboboxTrigger.svelte";
// Context
export type { ComboboxContext } from "./context.js";
// Contract
export { contract as comboboxComponentContract } from "./contract.js";
// Types
export type {
	ComboboxAnnounceProps,
	ComboboxContentProps,
	ComboboxEmptyProps,
	ComboboxGroupProps,
	ComboboxInputProps,
	ComboboxItemProps,
	ComboboxLabelProps,
	ComboboxProps,
	ComboboxTriggerProps,
} from "./types.js";
