/**
 * @file Adapter Kind Registry — SSOT for all ColdLight adapter kinds
 * @package @devpulse/coldlight
 *
 * THE source of truth. Every kind that ColdLight supports is listed here
 * with its active engine assignment. Build-time validator checks disk
 * state matches this registry. VPB reads the JSON export.
 *
 * Rules:
 * - Every kind appears EXACTLY ONCE
 * - engine field determines which adapter folder is authoritative
 * - Kinds with both ColdLight and MeltUI implementations: engine picks the active one
 * - Duplicate MeltUI folders (e.g., "file-upload" vs "fileupload") are noted as aliases
 */

import type { EngineType } from "../_schema/adapter-schema.js";

// =============================================================================
// REGISTRY ENTRY TYPE
// =============================================================================

export interface KindRegistryEntry {
	/** Primitive kind identifier */
	readonly kind: string;
	/** Active engine for this kind */
	readonly engine: EngineType;
	/** Folder name in the adapter directory (usually same as kind) */
	readonly folder: string;
	/** Alternative folder names (MeltUI duplicates like "fileupload" for "file-upload") */
	readonly aliases?: readonly string[];
	/** Whether both engines have implementations (resolver picks engine field) */
	readonly dualEngine?: boolean;
}

// =============================================================================
// COLDLIGHT-OWNED KINDS (59)
// =============================================================================

const COLDLIGHT_KINDS: readonly KindRegistryEntry[] = [
	{ kind: "alert", engine: "coldlight", folder: "alert" },
	{ kind: "aspect-ratio", engine: "coldlight", folder: "aspect-ratio" },
	{ kind: "badge", engine: "coldlight", folder: "badge" },
	{ kind: "banner", engine: "coldlight", folder: "banner" },
	{ kind: "box", engine: "coldlight", folder: "box" },
	{ kind: "breadcrumb", engine: "coldlight", folder: "breadcrumb" },
	{ kind: "button", engine: "coldlight", folder: "button" },
	{ kind: "callout", engine: "coldlight", folder: "callout" },
	{ kind: "card", engine: "coldlight", folder: "card" },
	{ kind: "center", engine: "coldlight", folder: "center" },
	{ kind: "checkbox", engine: "coldlight", folder: "checkbox" },
	{ kind: "code", engine: "coldlight", folder: "code" },
	{ kind: "color-input", engine: "coldlight", folder: "color-input" },
	{ kind: "container", engine: "coldlight", folder: "container" },
	{ kind: "context-menu", engine: "coldlight", folder: "context-menu" },
	{ kind: "data-table", engine: "coldlight", folder: "data-table" },
	{ kind: "description-list", engine: "coldlight", folder: "description-list" },
	{ kind: "divider", engine: "coldlight", folder: "divider" },
	{ kind: "empty-state", engine: "coldlight", folder: "empty-state" },
	{ kind: "flex", engine: "coldlight", folder: "flex" },
	{ kind: "form", engine: "coldlight", folder: "form" },
	{ kind: "form-field", engine: "coldlight", folder: "form-field" },
	{ kind: "grid", engine: "coldlight", folder: "grid" },
	{ kind: "heading", engine: "coldlight", folder: "heading" },
	{ kind: "hstack", engine: "coldlight", folder: "hstack" },
	{ kind: "inline-message", engine: "coldlight", folder: "inline-message" },
	{ kind: "input", engine: "coldlight", folder: "input" },
	{ kind: "input-group", engine: "coldlight", folder: "input-group" },
	{ kind: "kbd", engine: "coldlight", folder: "kbd" },
	{ kind: "label", engine: "coldlight", folder: "label" },
	{ kind: "list", engine: "coldlight", folder: "list" },
	{ kind: "loading-overlay", engine: "coldlight", folder: "loading-overlay" },
	{ kind: "nav", engine: "coldlight", folder: "nav" },
	{ kind: "nav-item", engine: "coldlight", folder: "nav-item" },
	{ kind: "notification-center", engine: "coldlight", folder: "notification-center" },
	{ kind: "number-input", engine: "coldlight", folder: "number-input" },
	{ kind: "prose", engine: "coldlight", folder: "prose" },
	{ kind: "scroll-area", engine: "coldlight", folder: "scroll-area" },
	{ kind: "search-input", engine: "coldlight", folder: "search-input" },
	{ kind: "separator", engine: "coldlight", folder: "separator" },
	{ kind: "sheet", engine: "coldlight", folder: "sheet" },
	{ kind: "sidebar", engine: "coldlight", folder: "sidebar" },
	{ kind: "skeleton", engine: "coldlight", folder: "skeleton" },
	{ kind: "skip-link", engine: "coldlight", folder: "skip-link" },
	{ kind: "spacer", engine: "coldlight", folder: "spacer" },
	{ kind: "spinner", engine: "coldlight", folder: "spinner" },
	{ kind: "stack", engine: "coldlight", folder: "stack" },
	{ kind: "stat", engine: "coldlight", folder: "stat" },
	{ kind: "steps", engine: "coldlight", folder: "steps" },
	{ kind: "sticky", engine: "coldlight", folder: "sticky" },
	{ kind: "switch", engine: "coldlight", folder: "switch" },
	{ kind: "table", engine: "coldlight", folder: "table" },
	{ kind: "table-of-contents", engine: "coldlight", folder: "table-of-contents" },
	{ kind: "text", engine: "coldlight", folder: "text" },
	{ kind: "textarea", engine: "coldlight", folder: "textarea" },
	{ kind: "toggle-group", engine: "coldlight", folder: "toggle-group" },
	{ kind: "toolbar", engine: "coldlight", folder: "toolbar" },
] as const;

// =============================================================================
// MELTUI-OWNED KINDS (18 canonical — 3 have legacy folder aliases)
// =============================================================================

const MELTUI_KINDS: readonly KindRegistryEntry[] = [
	{ kind: "accordion", engine: "meltui", folder: "accordion" },
	{ kind: "avatar", engine: "meltui", folder: "avatar" },
	{ kind: "collapsible", engine: "meltui", folder: "collapsible" },
	{ kind: "combobox", engine: "meltui", folder: "combobox" },
	{ kind: "file-upload", engine: "meltui", folder: "file-upload", aliases: ["fileupload"] },
	{ kind: "pin-input", engine: "meltui", folder: "pin-input", aliases: ["pininput"] },
	{ kind: "popover", engine: "meltui", folder: "popover" },
	{ kind: "progress", engine: "meltui", folder: "progress" },
	{ kind: "radio-group", engine: "meltui", folder: "radio-group", aliases: ["radiogroup"] },
	{ kind: "select", engine: "meltui", folder: "select" },
	{ kind: "slider", engine: "meltui", folder: "slider" },
	{ kind: "spatialmenu", engine: "meltui", folder: "spatialmenu" },
	{ kind: "toaster", engine: "meltui", folder: "toaster" },
	{ kind: "toggle", engine: "meltui", folder: "toggle" },
	{ kind: "tooltip", engine: "meltui", folder: "tooltip" },
	{ kind: "tree", engine: "meltui", folder: "tree" },
] as const;

// =============================================================================
// DUAL-ENGINE KINDS — Both ColdLight and MeltUI have implementations
// Active engine is what the registry declares. The other is available as fallback.
// =============================================================================

const DUAL_ENGINE_KINDS: readonly KindRegistryEntry[] = [
	{ kind: "dialog", engine: "meltui", folder: "dialog", dualEngine: true },
	{ kind: "tabs", engine: "meltui", folder: "tabs", dualEngine: true },
] as const;

// =============================================================================
// FULL REGISTRY — THE SSOT
// =============================================================================

/** All registered adapter kinds. Sorted alphabetically. */
export const KIND_REGISTRY: readonly KindRegistryEntry[] = [
	...COLDLIGHT_KINDS,
	...MELTUI_KINDS,
	...DUAL_ENGINE_KINDS,
].sort((a, b) => a.kind.localeCompare(b.kind));

/** Total count of registered kinds. */
export const KIND_COUNT = KIND_REGISTRY.length;

// =============================================================================
// LOOKUP HELPERS
// =============================================================================

/** Map: kind → registry entry. O(1) lookup. */
export const KIND_MAP: ReadonlyMap<string, KindRegistryEntry> = new Map(
	KIND_REGISTRY.map((entry) => [entry.kind, entry]),
);

/** All ColdLight-engine kinds (includes dual-engine if engine is coldlight). */
export const COLDLIGHT_ENGINE_KINDS: readonly string[] = KIND_REGISTRY
	.filter((e) => e.engine === "coldlight")
	.map((e) => e.kind);

/** All MeltUI-engine kinds (includes dual-engine if engine is meltui). */
export const MELTUI_ENGINE_KINDS: readonly string[] = KIND_REGISTRY
	.filter((e) => e.engine === "meltui")
	.map((e) => e.kind);

/** Lookup a kind entry. Returns undefined if not registered. */
export function getKindEntry(kind: string): KindRegistryEntry | undefined {
	return KIND_MAP.get(kind);
}

/** Check if a kind is registered. */
export function isRegisteredKind(kind: string): boolean {
	return KIND_MAP.has(kind);
}

/** Get all kinds for a given engine. */
export function getKindsByEngine(engine: EngineType): readonly KindRegistryEntry[] {
	return KIND_REGISTRY.filter((e) => e.engine === engine);
}

// =============================================================================
// JSON EXPORT — For VPB consumption
// =============================================================================

/** JSON-serializable registry for VPB. */
export function toRegistryJSON(): {
	kinds: Array<{
		kind: string;
		engine: string;
		folder: string;
		aliases?: string[];
		dualEngine?: boolean;
	}>;
	counts: { total: number; coldlight: number; meltui: number };
} {
	return {
		kinds: KIND_REGISTRY.map((e) => ({
			kind: e.kind,
			engine: e.engine,
			folder: e.folder,
			...(e.aliases ? { aliases: [...e.aliases] } : {}),
			...(e.dualEngine ? { dualEngine: true } : {}),
		})),
		counts: {
			total: KIND_COUNT,
			coldlight: COLDLIGHT_ENGINE_KINDS.length,
			meltui: MELTUI_ENGINE_KINDS.length,
		},
	};
}
