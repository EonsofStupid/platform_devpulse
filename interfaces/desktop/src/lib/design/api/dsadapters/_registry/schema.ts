/**
 * @file Registry Schema — Zod enforcement for the kind registry
 * @package @devpulse/coldlight
 *
 * Validates the registry itself at build time:
 * - No duplicate kinds
 * - No empty strings
 * - Valid engine values
 * - Aliases don't clash with other kind names
 *
 * Also exports a Zod schema for individual entries that external
 * tools (VPB, scanner) can use to validate JSON imports.
 */

import { z } from "zod";
import { EngineTypeSchema } from "../_schema/adapter-schema.js";

// =============================================================================
// ENTRY SCHEMA — validates a single registry entry
// =============================================================================

export const KindRegistryEntrySchema = z.object({
	kind: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/, "Kind must be lowercase kebab-case"),
	engine: EngineTypeSchema,
	folder: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/, "Folder must be lowercase kebab-case"),
	aliases: z.array(z.string().min(1)).readonly().optional(),
	dualEngine: z.boolean().optional(),
});

// =============================================================================
// REGISTRY SCHEMA — validates the full registry array
// =============================================================================

export const KindRegistrySchema = z.array(KindRegistryEntrySchema).superRefine((entries, ctx) => {
	const kindsSeen = new Set<string>();
	const foldersSeen = new Set<string>();

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];

		// No duplicate kinds
		if (kindsSeen.has(entry.kind)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Duplicate kind: "${entry.kind}"`,
				path: [i, "kind"],
			});
		}
		kindsSeen.add(entry.kind);

		// No duplicate folders within same engine
		const folderKey = `${entry.engine}:${entry.folder}`;
		if (foldersSeen.has(folderKey)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Duplicate folder "${entry.folder}" for engine "${entry.engine}"`,
				path: [i, "folder"],
			});
		}
		foldersSeen.add(folderKey);

		// Aliases must not clash with existing kind names
		for (const alias of entry.aliases ?? []) {
			if (kindsSeen.has(alias)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Alias "${alias}" clashes with registered kind name`,
					path: [i, "aliases"],
				});
			}
		}
	}
});

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/** Validate the full registry. Throws ZodError if invalid. */
export function parseRegistry(data: unknown) {
	return KindRegistrySchema.parse(data);
}

/** Safe parse the registry. */
export function safeParseRegistry(data: unknown) {
	return KindRegistrySchema.safeParse(data);
}

// =============================================================================
// JSON SCHEMA EXPORT — For external tools
// =============================================================================

/**
 * VPB JSON schema representation of a registry entry.
 * Used when VPB needs to validate imported component registry JSON.
 */
export const VPB_REGISTRY_ENTRY_SCHEMA = {
	type: "object",
	required: ["kind", "engine", "folder"],
	properties: {
		kind: { type: "string", pattern: "^[a-z][a-z0-9-]*$" },
		engine: { type: "string", enum: ["coldlight", "meltui"] },
		folder: { type: "string", pattern: "^[a-z][a-z0-9-]*$" },
		aliases: { type: "array", items: { type: "string" } },
		dualEngine: { type: "boolean" },
	},
} as const;
