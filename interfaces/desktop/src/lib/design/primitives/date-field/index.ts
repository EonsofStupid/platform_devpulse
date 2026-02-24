/**
 * @file primitives/date-field/index.ts
 * @kind date-field
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Date field primitive barrel export.
 * ariaStateProvider: "meltui" — no .svelte file, MeltUI adapter handles ARIA.
 */

export { contract } from "./contract.js";
export { dateFieldSlots, dateFieldStateTokens, dateFieldSlotStates } from "./types.js";
export type {
	DateFieldSlot,
	DateFieldState,
	DateFieldRootProps,
	DateFieldSegmentProps,
	DateFieldLabelProps,
} from "./types.js";
