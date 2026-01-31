/**
 * @file Popover Primitive Barrel
 */
export { default as Popover } from "./Popover.svelte";
export { default as PopoverTrigger } from "./PopoverTrigger.svelte";
export { default as PopoverContent } from "./PopoverContent.svelte";
export { default as PopoverArrow } from "./PopoverArrow.svelte";
export { default as PopoverClose } from "./PopoverClose.svelte";

export type {
	PopoverProps,
	PopoverTriggerProps,
	PopoverContentProps,
	PopoverArrowProps,
	PopoverCloseProps,
} from "./types.js";

export { setPopoverContext, getPopoverContext, type PopoverContext } from "./context.js";
