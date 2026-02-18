/**
 * @file VPB Block Kinds
 * @description Block kind definitions for Visual Page Builder
 *
 * Blocks are compositions of primitives used to build pages.
 * Each block kind defines slots where children can be placed.
 */

// =============================================================================
// BLOCK KIND DEFINITION
// =============================================================================

/**
 * Block kind definition structure.
 */
export interface BlockKindDefinition {
	/** Kind identifier */
	kind: string;
	/** Display label */
	label: string;
	/** Available slots for children */
	slots: readonly string[];
	/** Description */
	description: string;
	/** Recipe prefix for this kind */
	recipePrefix: string;
	/** Layout mode */
	layoutMode: "grid" | "flex" | "none";
	/** Allowed children per slot (optional - if not defined, all allowed) */
	allowedChildren?: Record<string, readonly string[]>;
}

// =============================================================================
// SHELL KINDS (App chrome and layout)
// =============================================================================

export const shellKinds = {
	appShell: {
		kind: "appShell",
		label: "App Shell",
		slots: ["nav", "aside", "main", "footer"] as const,
		description: "Full application layout shell",
		recipePrefix: "appShell",
		layoutMode: "grid" as const,
	},
	topBar: {
		kind: "topBar",
		label: "Top Bar",
		slots: ["left", "center", "right"] as const,
		description: "Horizontal top bar",
		recipePrefix: "topBar",
		layoutMode: "flex" as const,
	},
	sideNav: {
		kind: "sideNav",
		label: "Side Nav",
		slots: ["header", "body", "footer"] as const,
		description: "Vertical side navigation",
		recipePrefix: "sideNav",
		layoutMode: "flex" as const,
	},
	statusBar: {
		kind: "statusBar",
		label: "Status Bar",
		slots: ["left", "center", "right"] as const,
		description: "Bottom status bar",
		recipePrefix: "statusBar",
		layoutMode: "flex" as const,
	},
	dock: {
		kind: "dock",
		label: "Dock",
		slots: ["items"] as const,
		description: "Icon dock",
		recipePrefix: "dock",
		layoutMode: "flex" as const,
	},
} as const;

// =============================================================================
// SURFACE KINDS (Containers and panels)
// =============================================================================

export const surfaceKinds = {
	panel: {
		kind: "panel",
		label: "Panel",
		slots: ["header", "body", "footer"] as const,
		description: "Container with header, body, and footer slots",
		recipePrefix: "panel",
		layoutMode: "flex" as const,
	},
	card: {
		kind: "card",
		label: "Card",
		slots: ["header", "body", "footer"] as const,
		description: "Card container",
		recipePrefix: "card",
		layoutMode: "flex" as const,
	},
	modal: {
		kind: "modal",
		label: "Modal",
		slots: ["header", "body", "footer"] as const,
		description: "Modal dialog container",
		recipePrefix: "modal",
		layoutMode: "flex" as const,
	},
	glassFrame: {
		kind: "glassFrame",
		label: "Glass Frame",
		slots: ["content"] as const,
		description: "Glassmorphic container",
		recipePrefix: "glassFrame",
		layoutMode: "none" as const,
	},
	inputFrame: {
		kind: "inputFrame",
		label: "Input Frame",
		slots: ["prefix", "input", "suffix"] as const,
		description: "Input wrapper with prefix/suffix",
		recipePrefix: "inputFrame",
		layoutMode: "flex" as const,
	},
} as const;

// =============================================================================
// WIDGET KINDS (Data display)
// =============================================================================

export const widgetKinds = {
	widget: {
		kind: "widget",
		label: "Widget",
		slots: ["content"] as const,
		description: "Generic widget container",
		recipePrefix: "widget",
		layoutMode: "none" as const,
	},
	statMeter: {
		kind: "statMeter",
		label: "Stat Meter",
		slots: [] as const,
		description: "Statistic display",
		recipePrefix: "statMeter",
		layoutMode: "none" as const,
	},
	chart: {
		kind: "chart",
		label: "Chart",
		slots: [] as const,
		description: "Chart visualization",
		recipePrefix: "chart",
		layoutMode: "none" as const,
	},
} as const;

// =============================================================================
// CHAT KINDS (Chat UI)
// =============================================================================

export const chatKinds = {
	chatDock: {
		kind: "chatDock",
		label: "Chat Dock",
		slots: ["messages", "input"] as const,
		description: "Chat interface container",
		recipePrefix: "chatDock",
		layoutMode: "flex" as const,
	},
	chatThread: {
		kind: "chatThread",
		label: "Chat Thread",
		slots: ["messages"] as const,
		description: "Message thread",
		recipePrefix: "chatThread",
		layoutMode: "flex" as const,
	},
	chatBubble: {
		kind: "chatBubble",
		label: "Chat Bubble",
		slots: ["content"] as const,
		description: "Single message bubble",
		recipePrefix: "chatBubble",
		layoutMode: "none" as const,
	},
} as const;

// =============================================================================
// COMBINED BLOCK KINDS
// =============================================================================

/**
 * All block kinds registry.
 */
export const blockKinds = {
	...shellKinds,
	...surfaceKinds,
	...widgetKinds,
	...chatKinds,
} as const;

/**
 * Block kind union type.
 */
export type BlockKind = keyof typeof blockKinds;

/**
 * Array of all block kind keys.
 */
export const blockKindKeys = Object.keys(blockKinds) as BlockKind[];

/**
 * Get block kind definition.
 */
export function getKindDefinition(kind: BlockKind): BlockKindDefinition {
	return blockKinds[kind] as BlockKindDefinition;
}

/**
 * Get allowed slots for a block kind.
 */
export function getKindSlots(kind: BlockKind): readonly string[] {
	return blockKinds[kind].slots;
}
