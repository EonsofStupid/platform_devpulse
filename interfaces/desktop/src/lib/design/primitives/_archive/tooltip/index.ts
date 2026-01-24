/**
 * @file primitives/tooltip/index.ts
 * @layer primitives
 *
 * Tooltip primitive namespace export.
 * Hover-triggered floating content for supplementary information.
 *
 * Usage:
 * ```svelte
 * import { Tooltip } from "$lib/design/primitives";
 *
 * <Tooltip.Root>
 *   <Tooltip.Trigger>Hover me</Tooltip.Trigger>
 *   <Tooltip.Portal>
 *     <Tooltip.Content>
 *       Tooltip content here
 *       <Tooltip.Arrow />
 *     </Tooltip.Content>
 *   </Tooltip.Portal>
 * </Tooltip.Root>
 * ```
 *
 * With Provider for consistent delays:
 * ```svelte
 * <Tooltip.Provider delayDuration={500}>
 *   <Tooltip.Root>...</Tooltip.Root>
 *   <Tooltip.Root>...</Tooltip.Root>
 * </Tooltip.Provider>
 * ```
 */

// Components
export { default as Root } from "./Root.svelte";
export { default as Provider } from "./Provider.svelte";
export { default as Trigger } from "./Trigger.svelte";
export { default as Portal } from "./Portal.svelte";
export { default as Content } from "./Content.svelte";
export { default as Arrow } from "./Arrow.svelte";

// Types
export type {
  TooltipRootProps,
  TooltipProviderProps,
  TooltipTriggerProps,
  TooltipPortalProps,
  TooltipContentProps,
  TooltipArrowProps,
  TooltipState,
  TooltipSlot,
  TooltipSide,
  TooltipAlign,
} from "./types.js";

export { TooltipSlots } from "./types.js";
