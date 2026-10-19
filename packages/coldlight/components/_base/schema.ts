/**
 * @file Component Base Schema — ArkType
 * @package @devpulse/coldlight
 *
 * Base schema all ColdLight components extend via .and().
 * .toJsonSchema() generates A2UI catalog entries at build time.
 *
 * Per A2UI spec §4.3 — id, component, weight.
 */

import { type } from "arktype";

export const baseComponentSchema = type({
	id: "string",
	component: "string",
	"weight?": "number",
}).describe("Base component schema — id, component type, optional flex weight.");

export type BaseComponentProps = typeof baseComponentSchema.infer;
