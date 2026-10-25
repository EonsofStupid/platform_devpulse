/**
 * @file Re-export facade — canonical source is _base/schema.ts
 * @deprecated Import from "../_base/schema.js" instead.
 */
export {
	EngineTypeSchema,
	type EngineType,
	FocusStrategySchema,
	type FocusStrategy,
	AriaRequirementLevel,
	type AriaRequirementLevelType,
	SlotAriaAttrSchema,
	type SlotAriaAttr,
	SlotContractSchema,
	type SlotContract,
	PropContractSchema,
	type PropContract,
	SlotRelationshipSchema,
	type SlotRelationship,
	AdapterSchemaZ,
	type AdapterSchema,
	parseAdapterSchema,
	safeParseAdapterSchema,
	validateAdapterSchema,
	adapterSchemaToJSON as toJSON,
} from "../_base/schema.js";
