/**
 * @file Registry Barrel — Public API for adapter kind registry
 * @package @devpulse/coldlight
 */

// Registry data + lookups
export {
	KIND_REGISTRY,
	KIND_COUNT,
	KIND_MAP,
	COLDLIGHT_ENGINE_KINDS,
	MELTUI_ENGINE_KINDS,
	getKindEntry,
	isRegisteredKind,
	getKindsByEngine,
	toRegistryJSON,
	type KindRegistryEntry,
} from "./kinds.js";

// Registry schema validation
export {
	KindRegistryEntrySchema,
	KindRegistrySchema,
	parseRegistry,
	safeParseRegistry,
	VPB_REGISTRY_ENTRY_SCHEMA,
} from "./schema.js";

// Filesystem validator
export {
	validateRegistry,
	validateAndReport,
	type ValidationResult,
} from "./validator.js";
