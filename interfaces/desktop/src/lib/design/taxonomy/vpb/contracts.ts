/**
 * @file VPB Block Contracts
 * @description Zod schemas for block prop validation
 */

import { z } from "zod";
import type { BlockKind } from "./kinds";

// =============================================================================
// KIND CONTRACTS (Zod Schemas)
// =============================================================================

/**
 * Panel block props schema.
 */
const panelContract = z.object({
	padding: z.enum(["none", "sm", "md", "lg"]).default("md"),
	variant: z.enum(["default", "glass", "solid"]).default("default"),
});

/**
 * Stack block props schema.
 */
const stackContract = z.object({
	direction: z.enum(["vertical", "horizontal"]).default("vertical"),
	gap: z.enum(["none", "sm", "md", "lg"]).default("md"),
	align: z.enum(["start", "center", "end", "stretch"]).default("stretch"),
});

/**
 * Text block props schema.
 */
const textContract = z.object({
	content: z.string().default(""),
	variant: z.enum(["body", "heading", "caption"]).default("body"),
});

/**
 * App shell block props schema.
 */
const appShellContract = z.object({
	navPosition: z.enum(["left", "top"]).default("left"),
	navCollapsed: z.boolean().default(false),
});

/**
 * Chat dock block props schema.
 */
const chatDockContract = z.object({
	position: z.enum(["left", "right", "bottom"]).default("right"),
	expanded: z.boolean().default(true),
});

/**
 * All kind contracts mapped by kind.
 */
export const kindContracts = {
	panel: panelContract,
	stack: stackContract,
	text: textContract,
	appShell: appShellContract,
	chatDock: chatDockContract,
} as const;

/**
 * Kind contract type (kinds that have contracts).
 */
export type KindContract = keyof typeof kindContracts;

/**
 * Get the Zod schema for a block kind.
 */
export function getKindSchema<K extends KindContract>(kind: K): (typeof kindContracts)[K] {
	return kindContracts[kind];
}

/**
 * Infer props type from a kind.
 */
export type KindProps<K extends BlockKind> = K extends KindContract
	? z.infer<(typeof kindContracts)[K]>
	: unknown;

/**
 * Get default props for a kind by parsing empty object through schema.
 */
export function getDefaultProps(kind: KindContract): unknown {
	return kindContracts[kind].parse({});
}
