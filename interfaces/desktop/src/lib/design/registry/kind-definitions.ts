/**
 * @file Kind Definition Registry — Unified Component Contract
 * @module @devpulse/coldlight/registry/kind-definitions
 * @layer registry
 *
 * KindDefinition is the Component Definition Object (CDO) — a single
 * registry entry per kind that unifies:
 *   - ARIA engine (coldlight vs meltui)
 *   - Default preset (visual identity)
 *   - Default recipe (styling function)
 *   - Block category (VPB palette placement)
 *   - Required visual axes (minimum contract for this kind)
 *
 * The build pipeline validates:
 *   1. Every defined kind has a matching preset in presets.ts
 *   2. Every defined kind has a matching recipe in recipes/
 *   3. Every defined kind has a contract.ts in components/{kind}/
 *   4. Required axes are satisfied by the default preset
 *
 * AI agents read this to understand the full component system.
 * VPB reads this to know what controls to show per kind.
 * The ColdLight settings tab reads this for runtime config.
 */

import { z } from "zod";
import type { Preset } from "./token-categories.js";

// =============================================================================
// KIND DEFINITION SCHEMA
// =============================================================================

/** Which adapter engine provides ARIA behavior for this kind. */
export const EngineSchema = z.enum(["coldlight", "meltui"]);
export type Engine = z.infer<typeof EngineSchema>;

/** Block category for VPB palette organization. */
export const BlockCategorySchema = z.enum([
	"shell",
	"surfaces",
	"forms",
	"feedback",
	"data",
	"navigation",
	"content",
	"layout",
	"overlay",
	"chat",
	"interactions",
	"widgets",
]);
export type BlockCategory = z.infer<typeof BlockCategorySchema>;

/** Visual axes that a kind MUST have configured (non-default). */
export const VisualAxisSchema = z.enum([
	"surface",
	"material",
	"depth",
	"bevel",
	"glow",
	"frame",
	"motion",
	"transition",
]);
export type VisualAxis = z.infer<typeof VisualAxisSchema>;

/**
 * KindDefinition — the unified component contract.
 *
 * One entry per kind. Ties together ARIA, visual identity,
 * styling, and VPB integration.
 */
export const KindDefinitionSchema = z.object({
	/** Component kind identifier (e.g., "button", "dialog") */
	kind: z.string().regex(/^[a-z][a-z0-9-]*$/),

	/** Human-readable label for VPB and settings UI */
	label: z.string().min(1),

	/** Which adapter engine provides ARIA behavior */
	engine: EngineSchema,

	/** Default preset ID — must exist in presets.ts */
	defaultPreset: z.string().regex(/^[a-z][a-z0-9-]*$/),

	/** Default recipe ID — must exist in recipes registry */
	defaultRecipe: z
		.string()
		.regex(/^[a-z][\w-]*\.[a-z][\w-]*\.[a-z][\w-]*$/),

	/** VPB palette category */
	blockCategory: BlockCategorySchema,

	/** Visual axes this kind REQUIRES (must be non-default in preset) */
	requiredAxes: z.array(VisualAxisSchema).readonly(),

	/** Whether this kind is compound (has child slots beyond root) */
	compound: z.boolean().default(false),

	/** Whether this kind can contain other blocks in VPB */
	container: z.boolean().default(false),

	/** Slot names that accept child blocks (only if container=true) */
	containerSlots: z.array(z.string()).readonly().optional(),
});

export type KindDefinition = z.infer<typeof KindDefinitionSchema>;

// =============================================================================
// REGISTRY
// =============================================================================

const definitions = new Map<string, KindDefinition>();

function define(def: KindDefinition): void {
	if (definitions.has(def.kind)) {
		throw new Error(`[KindDefinition] Duplicate kind: "${def.kind}"`);
	}
	definitions.set(def.kind, def);
}

/** Get a kind definition by kind name. */
export function getKindDefinition(
	kind: string,
): KindDefinition | undefined {
	return definitions.get(kind);
}

/** Get all registered kind definitions. */
export function getAllKindDefinitions(): KindDefinition[] {
	return Array.from(definitions.values());
}

/** Get all kinds in a specific block category. */
export function getKindsByCategory(
	category: BlockCategory,
): KindDefinition[] {
	return Array.from(definitions.values()).filter(
		(d) => d.blockCategory === category,
	);
}

/** Get all kind names that have definitions. */
export function getDefinedKinds(): string[] {
	return Array.from(definitions.keys());
}

// =============================================================================
// KIND DEFINITIONS — Register all component kinds
//
// Add new kinds here. The build validator will enforce:
//   - defaultPreset exists in presets.ts
//   - defaultRecipe exists in recipes registry
//   - contract.ts exists in components/{kind}/
//   - requiredAxes are satisfied by default preset values
// =============================================================================

// ── Interactions ─────────────────────────────────────────────────────────────

define({
	kind: "button",
	label: "Button",
	engine: "coldlight",
	defaultPreset: "btn-primary",
	defaultRecipe: "button.glass.void",
	blockCategory: "interactions",
	requiredAxes: ["surface", "depth", "transition"],
	compound: false,
	container: false,
});

define({
	kind: "toggle",
	label: "Toggle",
	engine: "coldlight",
	defaultPreset: "toggle-default",
	defaultRecipe: "toggle.glass.void",
	blockCategory: "interactions",
	requiredAxes: ["surface", "transition"],
	compound: false,
	container: false,
});

define({
	kind: "switch",
	label: "Switch",
	engine: "coldlight",
	defaultPreset: "switch-default",
	defaultRecipe: "switch.glass.void",
	blockCategory: "interactions",
	requiredAxes: ["surface", "transition"],
	compound: false,
	container: false,
});

// ── Surfaces ─────────────────────────────────────────────────────────────────

define({
	kind: "card",
	label: "Card",
	engine: "coldlight",
	defaultPreset: "card-default",
	defaultRecipe: "card.glass.void",
	blockCategory: "surfaces",
	requiredAxes: ["surface", "depth", "frame"],
	compound: true,
	container: true,
	containerSlots: ["content"],
});

define({
	kind: "panel",
	label: "Panel",
	engine: "coldlight",
	defaultPreset: "panel-glass",
	defaultRecipe: "panel.glass.void",
	blockCategory: "surfaces",
	requiredAxes: ["surface", "depth"],
	compound: true,
	container: true,
	containerSlots: ["content"],
});

define({
	kind: "badge",
	label: "Badge",
	engine: "coldlight",
	defaultPreset: "badge-accent",
	defaultRecipe: "badge.glass.void",
	blockCategory: "surfaces",
	requiredAxes: ["surface"],
	compound: false,
	container: false,
});

// ── Forms ────────────────────────────────────────────────────────────────────

define({
	kind: "input",
	label: "Input",
	engine: "coldlight",
	defaultPreset: "input-default",
	defaultRecipe: "input.glass.void",
	blockCategory: "forms",
	requiredAxes: ["surface", "frame", "transition"],
	compound: false,
	container: false,
});

define({
	kind: "checkbox",
	label: "Checkbox",
	engine: "coldlight",
	defaultPreset: "checkbox-default",
	defaultRecipe: "checkbox.glass.void",
	blockCategory: "forms",
	requiredAxes: ["surface", "transition"],
	compound: false,
	container: false,
});

define({
	kind: "select",
	label: "Select",
	engine: "meltui",
	defaultPreset: "select-default",
	defaultRecipe: "select.glass.void",
	blockCategory: "forms",
	requiredAxes: ["surface", "frame", "transition"],
	compound: true,
	container: false,
});

define({
	kind: "combobox",
	label: "Combobox",
	engine: "meltui",
	defaultPreset: "combobox-default",
	defaultRecipe: "combobox.glass.void",
	blockCategory: "forms",
	requiredAxes: ["surface", "frame", "depth", "transition"],
	compound: true,
	container: false,
});

define({
	kind: "slider",
	label: "Slider",
	engine: "coldlight",
	defaultPreset: "slider-default",
	defaultRecipe: "slider.glass.void",
	blockCategory: "forms",
	requiredAxes: ["surface", "transition"],
	compound: false,
	container: false,
});

define({
	kind: "radio-group",
	label: "Radio Group",
	engine: "coldlight",
	defaultPreset: "radio-default",
	defaultRecipe: "radio-group.glass.void",
	blockCategory: "forms",
	requiredAxes: ["surface", "transition"],
	compound: true,
	container: false,
});

// ── Overlay ──────────────────────────────────────────────────────────────────

define({
	kind: "dialog",
	label: "Dialog",
	engine: "meltui",
	defaultPreset: "dialog-default",
	defaultRecipe: "dialog.glass.void",
	blockCategory: "overlay",
	requiredAxes: ["surface", "depth", "frame"],
	compound: true,
	container: true,
	containerSlots: ["content"],
});

define({
	kind: "popover",
	label: "Popover",
	engine: "meltui",
	defaultPreset: "popover-default",
	defaultRecipe: "popover.glass.void",
	blockCategory: "overlay",
	requiredAxes: ["surface", "depth"],
	compound: true,
	container: true,
	containerSlots: ["content"],
});

define({
	kind: "tooltip",
	label: "Tooltip",
	engine: "meltui",
	defaultPreset: "tooltip-default",
	defaultRecipe: "tooltip.glass.void",
	blockCategory: "overlay",
	requiredAxes: ["surface", "depth"],
	compound: true,
	container: false,
});

// ── Feedback ─────────────────────────────────────────────────────────────────

define({
	kind: "alert",
	label: "Alert",
	engine: "coldlight",
	defaultPreset: "alert-default",
	defaultRecipe: "alert.glass.void",
	blockCategory: "feedback",
	requiredAxes: ["surface", "frame"],
	compound: true,
	container: false,
});

define({
	kind: "banner",
	label: "Banner",
	engine: "coldlight",
	defaultPreset: "banner-info",
	defaultRecipe: "banner.glass.void",
	blockCategory: "feedback",
	requiredAxes: ["surface"],
	compound: true,
	container: false,
});

define({
	kind: "spinner",
	label: "Spinner",
	engine: "coldlight",
	defaultPreset: "spinner-default",
	defaultRecipe: "spinner.glass.void",
	blockCategory: "feedback",
	requiredAxes: ["motion"],
	compound: false,
	container: false,
});

// ── Navigation ───────────────────────────────────────────────────────────────

define({
	kind: "tabs",
	label: "Tabs",
	engine: "meltui",
	defaultPreset: "tabs-default",
	defaultRecipe: "tabs.glass.void",
	blockCategory: "navigation",
	requiredAxes: ["surface", "transition"],
	compound: true,
	container: true,
	containerSlots: ["content"],
});

define({
	kind: "accordion",
	label: "Accordion",
	engine: "meltui",
	defaultPreset: "accordion-default",
	defaultRecipe: "accordion.glass.void",
	blockCategory: "navigation",
	requiredAxes: ["surface", "transition"],
	compound: true,
	container: true,
	containerSlots: ["content"],
});

define({
	kind: "breadcrumb",
	label: "Breadcrumb",
	engine: "coldlight",
	defaultPreset: "breadcrumb-default",
	defaultRecipe: "breadcrumb.glass.void",
	blockCategory: "navigation",
	requiredAxes: ["surface"],
	compound: true,
	container: false,
});

// ── Data ─────────────────────────────────────────────────────────────────────

define({
	kind: "table",
	label: "Table",
	engine: "coldlight",
	defaultPreset: "table-default",
	defaultRecipe: "table.glass.void",
	blockCategory: "data",
	requiredAxes: ["surface", "frame"],
	compound: true,
	container: false,
});

// ── Content ──────────────────────────────────────────────────────────────────

define({
	kind: "avatar",
	label: "Avatar",
	engine: "coldlight",
	defaultPreset: "avatar-default",
	defaultRecipe: "avatar.glass.void",
	blockCategory: "content",
	requiredAxes: ["surface"],
	compound: false,
	container: false,
});

define({
	kind: "kbd",
	label: "Keyboard Shortcut",
	engine: "coldlight",
	defaultPreset: "kbd-default",
	defaultRecipe: "kbd.glass.void",
	blockCategory: "content",
	requiredAxes: ["surface", "bevel"],
	compound: false,
	container: false,
});

define({
	kind: "skeleton",
	label: "Skeleton",
	engine: "coldlight",
	defaultPreset: "skeleton-default",
	defaultRecipe: "skeleton.glass.void",
	blockCategory: "content",
	requiredAxes: ["surface", "motion"],
	compound: false,
	container: false,
});

// ── Layout ───────────────────────────────────────────────────────────────────

define({
	kind: "divider",
	label: "Divider",
	engine: "coldlight",
	defaultPreset: "divider-default",
	defaultRecipe: "divider.glass.void",
	blockCategory: "layout",
	requiredAxes: [],
	compound: false,
	container: false,
});

// ── Shell ────────────────────────────────────────────────────────────────────

define({
	kind: "sidebar",
	label: "Sidebar",
	engine: "coldlight",
	defaultPreset: "sidebar-default",
	defaultRecipe: "sidebar.glass.void",
	blockCategory: "shell",
	requiredAxes: ["surface", "depth"],
	compound: true,
	container: true,
	containerSlots: ["content"],
});

// ── Widgets ──────────────────────────────────────────────────────────────────

define({
	kind: "widget",
	label: "Widget",
	engine: "coldlight",
	defaultPreset: "widget-stat",
	defaultRecipe: "widget.glass.void",
	blockCategory: "widgets",
	requiredAxes: ["surface", "depth", "frame"],
	compound: true,
	container: true,
	containerSlots: ["content"],
});

// ── Chat ─────────────────────────────────────────────────────────────────────

define({
	kind: "chat-frame",
	label: "Chat Frame",
	engine: "coldlight",
	defaultPreset: "chat-frame",
	defaultRecipe: "chat-frame.glass.void",
	blockCategory: "chat",
	requiredAxes: ["surface", "depth", "frame"],
	compound: true,
	container: true,
	containerSlots: ["content"],
});
