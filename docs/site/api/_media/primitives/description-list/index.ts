/**
 * @file primitives/description-list/index.ts
 * @kind description-list
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * DescriptionList primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as DescriptionList } from "./DescriptionList.svelte";
export { default as DescriptionListTerm } from "./DescriptionListTerm.svelte";
export { default as DescriptionListDetail } from "./DescriptionListDetail.svelte";
export { contract } from "./contract.js";
export {
	descriptionListSlots,
	descriptionListStateTokens,
	descriptionListSlotStates,
} from "./types.js";
export type {
	DescriptionListProps,
	DescriptionListTermProps,
	DescriptionListDetailProps,
	DescriptionListSlot,
	DescriptionListState,
} from "./types.js";
