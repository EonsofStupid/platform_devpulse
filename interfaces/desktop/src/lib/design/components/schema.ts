/**
 * @file Component Schema Layer — Re-export
 * @package @devpulse/coldlight
 *
 * Canonical source is now taxonomy/component/.
 * This file re-exports for backward compatibility.
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
} from "$lib/design/taxonomy/component/schema.js";

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
} from "$lib/design/taxonomy/component/contract.js";
