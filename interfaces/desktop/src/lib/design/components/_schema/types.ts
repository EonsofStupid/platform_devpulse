/**
 * @file Component Types
 * @package @devpulse/coldlight
 *
 * TypeScript types for components, derived from Zod schemas.
 * Re-exported here for convenience — canonical definitions are in schema.ts and contract.ts.
 */

export type { ComponentContract } from "./contract.js";
export type {
	AccessibleNameSource,
	AriaAutoCompleteValue,
	AriaCurrentValue,
	AriaHasPopupValue,
	AriaLiveValue,
	AriaOrientationValue,
	AriaRelevantValue,
	AriaSortValue,
	ComponentSlotAria,
	ComponentSlotContract,
	ComponentSlotData,
} from "./schema.js";
