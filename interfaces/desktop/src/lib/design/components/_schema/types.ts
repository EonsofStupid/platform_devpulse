/**
 * @file Component Types
 * @package @devpulse/coldlight
 *
 * TypeScript types for components, derived from Zod schemas.
 * Re-exported here for convenience — canonical definitions are in schema.ts and contract.ts.
 */

export type {
	ComponentSlotAria,
	ComponentSlotData,
	ComponentSlotContract,
	AccessibleNameSource,
	AriaHasPopupValue,
	AriaAutoCompleteValue,
	AriaOrientationValue,
	AriaSortValue,
	AriaCurrentValue,
	AriaLiveValue,
	AriaRelevantValue,
} from "./schema.js";

export type { ComponentContract } from "./contract.js";
