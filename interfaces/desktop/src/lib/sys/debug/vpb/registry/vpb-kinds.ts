/**
 * @file VPB Block Kinds + Slot Constraints
 * @layer vpb
 * @package @devpulse/sys
 *
 * Blocks are compositions of primitives used to build pages. Each block kind
 * defines slots where children can be placed, and a slot can limit which
 * kinds it takes.
 *
 * Restored from the VPB taxonomy (`#lib/design/taxonomy/vpb/kinds.ts` and
 * `slots.ts`), which sat under the design folder before ColdLight moved out.
 * Kind ids are ColdLight's kebab-case now (`appShell` is `app-shell`), since
 * those are what `renderForge` and `BLOCK_CATEGORIES` read. Names and
 * descriptions are copy (`[vpb.kinds]`); this file holds the structure.
 */

import { BLOCK_CATEGORIES, type BlockCategory } from "@devpulse/coldlight/blocks";

// =============================================================================
// BLOCK KIND DEFINITION
// =============================================================================

/** How a kind lays out its children. */
export type KindLayoutMode = "grid" | "flex" | "none";

/**
 * Block kind definition structure.
 */
export interface BlockKindDefinition {
	/** Kind identifier */
	kind: string;
	/** Available slots for children */
	slots: readonly string[];
	/** Layout mode */
	layoutMode: KindLayoutMode;
}

const SURFACE_SLOTS = ["header", "body", "footer"] as const;

/** The taxonomy's kinds, under their ColdLight ids. */
const blockKinds: Readonly<Record<string, BlockKindDefinition>> = {
	// Shell kinds (app chrome and layout)
	"app-shell": { kind: "app-shell", slots: ["nav", "aside", "main", "footer"], layoutMode: "grid" },
	"top-bar": { kind: "top-bar", slots: ["left", "center", "right"], layoutMode: "flex" },
	"side-nav": { kind: "side-nav", slots: SURFACE_SLOTS, layoutMode: "flex" },
	"status-bar": { kind: "status-bar", slots: ["left", "center", "right"], layoutMode: "flex" },
	dock: { kind: "dock", slots: ["items"], layoutMode: "flex" },

	// Surface kinds (containers and panels)
	panel: { kind: "panel", slots: SURFACE_SLOTS, layoutMode: "flex" },
	card: { kind: "card", slots: SURFACE_SLOTS, layoutMode: "flex" },
	modal: { kind: "modal", slots: SURFACE_SLOTS, layoutMode: "flex" },
	"glass-frame": { kind: "glass-frame", slots: ["content"], layoutMode: "none" },
	"input-frame": { kind: "input-frame", slots: ["prefix", "input", "suffix"], layoutMode: "flex" },

	// Widget kinds (data display)
	widget: { kind: "widget", slots: ["content"], layoutMode: "none" },
	"stat-meter": { kind: "stat-meter", slots: [], layoutMode: "none" },
	chart: { kind: "chart", slots: [], layoutMode: "none" },

	// Chat kinds (chat UI)
	"chat-dock": { kind: "chat-dock", slots: ["messages", "input"], layoutMode: "flex" },
	"chat-thread": { kind: "chat-thread", slots: ["messages"], layoutMode: "flex" },
	"chat-bubble": { kind: "chat-bubble", slots: ["content"], layoutMode: "none" },
};

/** The taxonomy's kinds ColdLight's block categories do not list, by category. */
const TAXONOMY_KINDS: Partial<Record<BlockCategory, readonly string[]>> = {
	surfaces: ["panel", "modal", "glass-frame", "input-frame"],
	widgets: ["stat-meter", "chart"],
	chat: ["chat-dock", "chat-thread", "chat-bubble"],
};

/** Every kind a category offers: ColdLight's, then the taxonomy's own. */
export function kindsInCategory(category: BlockCategory): readonly string[] {
	return [...BLOCK_CATEGORIES[category], ...(TAXONOMY_KINDS[category] ?? [])];
}

/**
 * Get block kind definition. A ColdLight kind the taxonomy did not name takes
 * its category's shape: surfaces have the surface slots, layout kinds hold
 * content, the rest are leaves.
 */
export function getKindDefinition(kind: string): BlockKindDefinition {
	const known = blockKinds[kind];
	if (known) return known;
	if ((BLOCK_CATEGORIES.surfaces as readonly string[]).includes(kind)) {
		return { kind, slots: SURFACE_SLOTS, layoutMode: "flex" };
	}
	if ((BLOCK_CATEGORIES.layout as readonly string[]).includes(kind)) {
		return { kind, slots: ["content"], layoutMode: "flex" };
	}
	return { kind, slots: [], layoutMode: "none" };
}

/**
 * Get allowed slots for a block kind.
 */
export function getKindSlots(kind: string): readonly string[] {
	return getKindDefinition(kind).slots;
}

// =============================================================================
// SLOT CONSTRAINTS
// =============================================================================

/**
 * Slot constraints registry: parent kind + slot name to allowed child kinds.
 * "any" means any block kind is allowed.
 */
const slotConstraints: Readonly<
	Record<string, Readonly<Record<string, readonly string[] | "any">>>
> = {
	panel: {
		header: "any",
		body: "any",
		footer: "any",
	},
	"app-shell": {
		nav: ["side-nav", "panel"],
		aside: ["panel", "chat-dock"],
		main: "any",
		footer: "any",
	},
	"chat-dock": {
		messages: "any",
		input: ["panel"],
	},
};

/**
 * Get allowed child kinds for a slot.
 */
export function getAllowedChildren(
	parentKind: string,
	slotName: string,
): readonly string[] | "any" {
	return slotConstraints[parentKind]?.[slotName] ?? "any";
}

/**
 * Check if a child kind is allowed in a parent's slot.
 */
export function isChildAllowed(parentKind: string, slotName: string, childKind: string): boolean {
	const allowed = getAllowedChildren(parentKind, slotName);
	return allowed === "any" || allowed.includes(childKind);
}
