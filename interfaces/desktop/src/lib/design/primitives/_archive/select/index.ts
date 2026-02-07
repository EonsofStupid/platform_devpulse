/**
 * @file primitives/select/index.ts
 * @layer primitives
 *
 * Select primitive namespace export.
 * Generic dropdown selection with single/multiple modes.
 *
 * Usage:
 * ```svelte
 * import { Select } from "$lib/design/primitives";
 *
 * <Select.Root bind:value {items} type="single">
 *   <Select.Trigger>
 *     {value ? items.find(i => i.value === value)?.label : "Select..."}
 *   </Select.Trigger>
 *   <Select.Portal>
 *     <Select.Content>
 *       <Select.Viewport>
 *         {#each items as item}
 *           <Select.Item value={item.value}>
 *             {#snippet children({ selected })}
 *               {item.label}
 *               {#if selected}✓{/if}
 *             {/snippet}
 *           </Select.Item>
 *         {/each}
 *       </Select.Viewport>
 *       <Select.Arrow />
 *     </Select.Content>
 *   </Select.Portal>
 * </Select.Root>
 * ```
 */

export { default as Arrow } from "./Arrow.svelte";
export { default as Content } from "./Content.svelte";
export { default as GroupLabel } from "./GroupLabel.svelte";
export { default as Item } from "./Item.svelte";
export { default as ItemGroup } from "./ItemGroup.svelte";
export { default as ItemText } from "./ItemText.svelte";
export { default as Portal } from "./Portal.svelte";
// Components
export { default as Root } from "./Root.svelte";
export { default as ScrollDown } from "./ScrollDown.svelte";
export { default as ScrollUp } from "./ScrollUp.svelte";
export { default as Separator } from "./Separator.svelte";
export { default as Trigger } from "./Trigger.svelte";
// Types
export type {
	SelectAlign,
	SelectArrowProps,
	SelectContentProps,
	SelectGroupLabelProps,
	SelectItem,
	SelectItemGroupProps,
	SelectItemProps,
	SelectItemTextProps,
	SelectPortalProps,
	SelectRootProps,
	SelectScrollDownProps,
	SelectScrollUpProps,
	SelectSeparatorProps,
	SelectSide,
	SelectSlot,
	SelectState,
	SelectTriggerProps,
	SelectType,
	SelectViewportProps,
} from "./types.js";
export { SelectSlots } from "./types.js";
export { default as Viewport } from "./Viewport.svelte";
