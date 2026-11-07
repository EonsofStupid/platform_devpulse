/**
 * @file primitives/date-range-field/index.ts
 * @kind date-range-field
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date range field primitive barrel export.
 * ariaStateProvider: "meltui" — no .svelte file, MeltUI adapter handles ARIA.
 */

export { contract } from "./contract.js";
export {
	dateRangeFieldSlots,
	dateRangeFieldStateTokens,
	dateRangeFieldSlotStates,
} from "./types.js";
export type {
	DateRangeFieldSlot,
	DateRangeFieldState,
	DateRangeFieldRootProps,
	DateRangeFieldSegmentProps,
	DateRangeFieldLabelProps,
} from "./types.js";
