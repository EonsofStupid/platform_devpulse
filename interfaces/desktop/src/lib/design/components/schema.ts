/**
 * @file Component Schema Layer — Re-export
 * @package @devpulse/coldlight
 *
 * Canonical source is components/_schema/.
 * This file re-exports for convenience.
 */

export {
	type ComponentContract,
	// Component contract
	ComponentContractSchema,
	deriveSlotContract,
	parseComponentContract,
	safeParseComponentContract,
	// Validation
	validateComponentContract,
	validateSlotAttrs,
} from "./_schema/contract.js";
export {
	type AccessibleNameSource,
	AccessibleNameSourceSchema,
	// ARIA attribute value map
	AriaAttrValueSchemas,
	AriaAutoCompleteSchema,
	type AriaAutoCompleteValue,
	AriaAutoCompleteValues,
	AriaCurrentSchema,
	type AriaCurrentValue,
	AriaCurrentValues,
	AriaHasPopupSchema,
	type AriaHasPopupValue,
	// ARIA value schemas
	AriaHasPopupValues,
	AriaLiveSchema,
	type AriaLiveValue,
	AriaLiveValues,
	AriaOrientationSchema,
	type AriaOrientationValue,
	AriaOrientationValues,
	AriaRelevantSchema,
	type AriaRelevantValue,
	AriaRelevantValues,
	AriaSortSchema,
	type AriaSortValue,
	AriaSortValues,
	type ComponentSlotAria,
	// Slot schemas
	ComponentSlotAriaSchema,
	type ComponentSlotContract,
	ComponentSlotContractSchema,
	type ComponentSlotData,
	ComponentSlotDataSchema,
} from "./_schema/schema.js";
