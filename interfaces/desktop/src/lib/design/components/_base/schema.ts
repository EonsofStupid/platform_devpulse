/**
 * @file Component Base Schema — Zod 4
 * @package @devpulse/coldlight
 *
 * Base schema all ColdLight components extend via .extend().
 * z.toJSONSchema() generates A2UI catalog entries at build time.
 *
 * Per A2UI spec §4.3 — id, component, weight.
 */

import { z } from "zod";

export const baseComponentSchema = z.object({
	id: z.string().describe("Unique component identifier within the surface."),
	component: z.string().describe("Component type name from the catalog."),
	weight: z.number().optional().describe("Flex-grow weight when inside a Row or Column."),
});

export type BaseComponentProps = z.infer<typeof baseComponentSchema>;
