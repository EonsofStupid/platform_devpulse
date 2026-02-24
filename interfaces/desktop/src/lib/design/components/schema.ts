/**
 * @file Component Schema Layer — Re-export
 * @package @devpulse/coldlight
 *
 * Canonical source is components/_schema/.
 * This file re-exports for convenience.
 */

export {
	// ARIA value schemas
	AriaHasPopupValues,
	AriaHasPopupSchema,
	type AriaHasPopupValue,
	AriaAutoCompleteValues,
	AriaAutoCompleteSchema,
	type AriaAutoCompleteValue,
	AriaOrientationValues,
	AriaOrientationSchema,
	type AriaOrientationValue,
	AriaSortValues,
	AriaSortSchema,
	type AriaSortValue,
	AriaCurrentValues,
	AriaCurrentSchema,
	type AriaCurrentValue,
	AriaLiveValues,
	AriaLiveSchema,
	type AriaLiveValue,
	AriaRelevantValues,
	AriaRelevantSchema,
	type AriaRelevantValue,
	// ARIA attribute value map
	AriaAttrValueSchemas,
	// Slot schemas
	ComponentSlotAriaSchema,
	type ComponentSlotAria,
	ComponentSlotDataSchema,
	type ComponentSlotData,
	ComponentSlotContractSchema,
	type ComponentSlotContract,
	AccessibleNameSourceSchema,
	type AccessibleNameSource,
} from "./_schema/schema.js";

export {
	// Component contract
	ComponentContractSchema,
	type ComponentContract,
	// Validation
	validateComponentContract,
	validateSlotAttrs,
	deriveSlotContract,
	parseComponentContract,
	safeParseComponentContract,
} from "./_schema/contract.js";
