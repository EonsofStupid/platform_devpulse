/**
 * @file Component Base — Public API
 * @module @devpulse/coldlight/components/_base
 * @layer components
 *
 * Every component extends this base. 11-axis DTCG. StyleMacro-driven.
 */

export type { ComponentProps } from "./types.js";
export {
	type ComponentSchema,
	type ComponentSlot,
	type ComponentProp,
	type SlotTokenAxes,
	type StyleBinding,
	ALL_AXES,
	NO_AXES,
	ComponentSchemaZ,
	SlotTokenAxesSchema,
	StyleBindingSchema,
	parseComponentSchema,
	safeParseComponentSchema,
	validateComponentSchema,
	toJSON,
} from "./schema.js";
