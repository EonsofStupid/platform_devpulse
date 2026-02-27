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

// Sub-components
export { default as Combobox } from "./Combobox.svelte";
export { default as ComboboxInput } from "./ComboboxInput.svelte";
export { default as ComboboxTrigger } from "./ComboboxTrigger.svelte";
export { default as ComboboxContent } from "./ComboboxContent.svelte";
export { default as ComboboxItem } from "./ComboboxItem.svelte";
export { default as ComboboxGroup } from "./ComboboxGroup.svelte";
export { default as ComboboxEmpty } from "./ComboboxEmpty.svelte";
export { default as ComboboxLabel } from "./ComboboxLabel.svelte";
export { default as ComboboxAnnounce } from "./ComboboxAnnounce.svelte";

// Contract
export { contract as comboboxComponentContract } from "./contract.js";

// Recipe
export { comboboxRecipe } from "./recipe.js";
export type { ComboboxRecipeOptions, ComboboxRecipeResult, ComboboxSize } from "./recipe.js";

// A11y
export {
	comboboxFocusConfig,
	comboboxLiveRegions,
	comboboxKeyboardMap,
	comboboxAnnouncements,
	comboboxAdaptAttrs,
	comboboxSlotAdapt,
	comboboxRelationships,
	auditCombobox,
} from "./a11y.js";

// Types
export type {
	ComboboxProps,
	ComboboxInputProps,
	ComboboxTriggerProps,
	ComboboxContentProps,
	ComboboxItemProps,
	ComboboxGroupProps,
	ComboboxEmptyProps,
	ComboboxLabelProps,
	ComboboxAnnounceProps,
} from "./types.js";

// Context
export type { ComboboxContext } from "./context.js";
