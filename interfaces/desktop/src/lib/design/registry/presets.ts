/**
 * @file Preset Registry — Named Visual Configurations
 * @module @devpulse/coldlight/registry/presets
 * @layer registry
 *
 * Named presets map to curated 8-axis Preset values.
 * These are per-kind defaults, VPB palette entries, what juniors pick from.
 *
 * Every preset is a Partial<Preset> — omitted categories use index-0 defaults.
 * The system resolves via resolveVisual().
 */

import { z } from "zod";
import { PresetSchema, type Preset } from "./token-categories.js";
import { registerPresetLookup } from "./resolve-visual.js";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export const PresetDefinitionSchema = z.object({
	id: z.string().regex(/^[a-z][a-z0-9-]*$/),
	kind: z.string().min(1),
	label: z.string().min(1),
	description: z.string().optional(),
	values: PresetSchema.partial(),
	isSystem: z.boolean().default(true),
});

export type PresetDefinition = z.infer<typeof PresetDefinitionSchema>;

// ═══════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════

const presets = new Map<string, PresetDefinition>();
const kindIndex = new Map<string, string[]>();

function register(def: PresetDefinition): void {
	presets.set(def.id, def);
	const ids = kindIndex.get(def.kind) ?? [];
	ids.push(def.id);
	kindIndex.set(def.kind, ids);
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM PRESETS — Curated visual configurations
// ═══════════════════════════════════════════════════════════════

// ── Buttons ──────────────────────────────────────────────────

register({
	id: "btn-primary",
	kind: "button",
	label: "Primary Button",
	description: "Glass void with subtle depth and cyber glow",
	isSystem: true,
	values: {
		surface: "glass-void",
		depth: "z1",
		glow: "cyber",
		transition: "fast",
	},
});

register({
	id: "btn-secondary",
	kind: "button",
	label: "Secondary Button",
	description: "Glass void with soft frame, no glow",
	isSystem: true,
	values: {
		surface: "glass-void",
		depth: "z1",
		frame: "soft",
		transition: "fast",
	},
});

register({
	id: "btn-outline",
	kind: "button",
	label: "Outline Button",
	description: "Transparent with hard frame border",
	isSystem: true,
	values: {
		surface: "transparent",
		frame: "hard",
		transition: "fast",
	},
});

register({
	id: "btn-ghost",
	kind: "button",
	label: "Ghost Button",
	description: "Fully transparent, transition only",
	isSystem: true,
	values: {
		surface: "transparent",
		transition: "fast",
	},
});

register({
	id: "btn-danger",
	kind: "button",
	label: "Danger Button",
	description: "Solid teal surface with ember glow — destructive actions",
	isSystem: true,
	values: {
		surface: "solid-teal",
		depth: "z1",
		glow: "ember",
		transition: "fast",
	},
});

// ── Panels ───────────────────────────────────────────────────

register({
	id: "panel-glass",
	kind: "panel",
	label: "Glass Panel",
	description: "Deep glass with subtle bevel and soft frame",
	isSystem: true,
	values: {
		surface: "glass-deep",
		depth: "z2",
		bevel: "subtle",
		frame: "soft",
	},
});

register({
	id: "panel-matte",
	kind: "panel",
	label: "Matte Panel",
	description: "Dark matte surface with minimal depth",
	isSystem: true,
	values: {
		surface: "matte-dark",
		depth: "z1",
		frame: "soft",
	},
});

register({
	id: "panel-void",
	kind: "panel",
	label: "Void Panel",
	description: "Glass void — minimal, borderless",
	isSystem: true,
	values: {
		surface: "glass-void",
	},
});

register({
	id: "panel-code",
	kind: "panel",
	label: "Code Panel",
	description: "Matte dark with hard frame — code blocks, terminals",
	isSystem: true,
	values: {
		surface: "matte-dark",
		frame: "hard",
		bevel: "subtle",
	},
});

// ── Cards ────────────────────────────────────────────────────

register({
	id: "card-default",
	kind: "card",
	label: "Default Card",
	description: "Glass smoke with elevation and soft edges",
	isSystem: true,
	values: {
		surface: "glass-smoke",
		depth: "z2",
		frame: "soft",
		bevel: "subtle",
	},
});

register({
	id: "card-elevated",
	kind: "card",
	label: "Elevated Card",
	description: "Frost glass floating high with soft bevel",
	isSystem: true,
	values: {
		surface: "glass-frost",
		depth: "z3",
		bevel: "soft",
		frame: "soft",
	},
});

register({
	id: "card-glow",
	kind: "card",
	label: "Glow Card",
	description: "Deep glass with teal glow halo",
	isSystem: true,
	values: {
		surface: "glass-deep",
		depth: "z2",
		glow: "teal",
		frame: "soft",
	},
});

// ── Shell ────────────────────────────────────────────────────

register({
	id: "shell-app",
	kind: "shell",
	label: "App Shell",
	description: "Void gradient background — the app canvas",
	isSystem: true,
	values: {
		surface: "void-gradient",
	},
});

register({
	id: "shell-sidebar",
	kind: "shell",
	label: "Sidebar",
	description: "Glass void panel with soft frame edge",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
	},
});

register({
	id: "shell-topbar",
	kind: "shell",
	label: "Top Bar",
	description: "Glass void panel with subtle bevel edge",
	isSystem: true,
	values: {
		surface: "glass-void",
		bevel: "subtle",
	},
});

register({
	id: "shell-statusbar",
	kind: "shell",
	label: "Status Bar",
	description: "Glass void panel — minimal bottom bar",
	isSystem: true,
	values: {
		surface: "glass-void",
	},
});

// ── Inputs ───────────────────────────────────────────────────

register({
	id: "input-default",
	kind: "input",
	label: "Default Input",
	description: "Glass void with soft frame and fast transition",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
		transition: "fast",
	},
});

register({
	id: "input-focus",
	kind: "input",
	label: "Focused Input",
	description: "Glass void with glow frame — active focus state",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "glow",
		glow: "teal",
		transition: "fast",
	},
});

register({
	id: "input-error",
	kind: "input",
	label: "Error Input",
	description: "Glass void with ember glow — validation error",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "hard",
		glow: "ember",
		transition: "fast",
	},
});

// ── Badges ───────────────────────────────────────────────────

register({
	id: "badge-accent",
	kind: "badge",
	label: "Accent Badge",
	description: "Solid teal — primary accent badge",
	isSystem: true,
	values: {
		surface: "solid-teal",
	},
});

register({
	id: "badge-signal",
	kind: "badge",
	label: "Signal Badge",
	description: "Glass void with teal glow — notification signal",
	isSystem: true,
	values: {
		surface: "glass-void",
		glow: "teal",
		frame: "soft",
	},
});

register({
	id: "badge-ghost",
	kind: "badge",
	label: "Ghost Badge",
	description: "Transparent with soft frame — minimal",
	isSystem: true,
	values: {
		surface: "transparent",
		frame: "soft",
	},
});

// ── Chat Frame / Shell ──────────────────────────────────────

register({
	id: "chat-frame",
	kind: "chat",
	label: "Chat Frame",
	description: "Glass void HUD frame — the chat overlay shell",
	isSystem: true,
	values: {
		surface: "glass-void",
		depth: "z3",
		bevel: "soft",
		frame: "soft",
	},
});

register({
	id: "chat-topbar",
	kind: "chat",
	label: "Chat Top Bar",
	description: "Glass void with subtle bevel — chat header",
	isSystem: true,
	values: {
		surface: "glass-void",
		bevel: "subtle",
	},
});

register({
	id: "chat-sidebar",
	kind: "chat",
	label: "Chat Mode Sidebar",
	description: "Glass deep sidebar for mode selection",
	isSystem: true,
	values: {
		surface: "glass-deep",
		frame: "soft",
	},
});

register({
	id: "chat-context",
	kind: "chat",
	label: "Chat Context Panel",
	description: "Glass deep panel for cortex visualization",
	isSystem: true,
	values: {
		surface: "glass-deep",
		depth: "z1",
	},
});

register({
	id: "chat-footer",
	kind: "chat",
	label: "Chat Footer",
	description: "Glass void with soft frame — input area",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
		transition: "fast",
	},
});

// ── Chat Bubbles ────────────────────────────────────────────

register({
	id: "chat-bubble-ai",
	kind: "chat",
	label: "AI Chat Bubble",
	description: "Purple glass with purple glow — AI messages",
	isSystem: true,
	values: {
		surface: "glass-purple",
		depth: "z1",
		bevel: "subtle",
		glow: "purple",
		frame: "accent-purple",
		transition: "fast",
	},
});

register({
	id: "chat-bubble-user",
	kind: "chat",
	label: "User Chat Bubble",
	description: "Teal glass with teal glow — user messages",
	isSystem: true,
	values: {
		surface: "glass-teal",
		depth: "z1",
		bevel: "subtle",
		glow: "teal",
		frame: "accent-teal",
		transition: "fast",
	},
});

register({
	id: "chat-bubble-system",
	kind: "chat",
	label: "System Chat Bubble",
	description: "Matte dark with soft frame — system messages",
	isSystem: true,
	values: {
		surface: "matte-dark",
		frame: "soft",
	},
});

register({
	id: "chat-input",
	kind: "chat",
	label: "Chat Input",
	description: "Glass void with soft frame — message composition",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
		transition: "fast",
	},
});

// ── Widgets ──────────────────────────────────────────────────

register({
	id: "widget-stat",
	kind: "widget",
	label: "Stat Widget",
	description: "Compact stat display — glass smoke with soft frame",
	isSystem: true,
	values: {
		surface: "glass-smoke",
		depth: "z1",
		frame: "soft",
	},
});

register({
	id: "widget-chart",
	kind: "widget",
	label: "Chart Widget",
	description: "Chart container — deep glass with elevation",
	isSystem: true,
	values: {
		surface: "glass-deep",
		depth: "z2",
		frame: "soft",
	},
});

register({
	id: "widget-gauge",
	kind: "widget",
	label: "Gauge Widget",
	description: "Circular gauge — deep glass with teal glow and breathing animation",
	isSystem: true,
	values: {
		surface: "glass-deep",
		depth: "z1",
		glow: "teal",
		motion: "breathe",
	},
});

register({
	id: "widget-timeline",
	kind: "widget",
	label: "Timeline Widget",
	description: "Vertical timeline — glass smoke with subtle bevel",
	isSystem: true,
	values: {
		surface: "glass-smoke",
		bevel: "subtle",
	},
});

register({
	id: "widget-table",
	kind: "widget",
	label: "Table Widget",
	description: "Data table — matte dark with hard frame",
	isSystem: true,
	values: {
		surface: "matte-dark",
		frame: "hard",
	},
});

register({
	id: "widget-kpi",
	kind: "widget",
	label: "KPI Widget",
	description: "Key performance indicator — frost glass with cyber glow",
	isSystem: true,
	values: {
		surface: "glass-frost",
		depth: "z2",
		glow: "cyber",
	},
});

// ── Modals ───────────────────────────────────────────────────

register({
	id: "modal-glass",
	kind: "modal",
	label: "Glass Modal",
	description: "Frost glass floating high — standard dialog",
	isSystem: true,
	values: {
		surface: "glass-frost",
		depth: "z4",
		bevel: "soft",
		frame: "soft",
		transition: "smooth",
	},
});

register({
	id: "modal-alert",
	kind: "modal",
	label: "Alert Modal",
	description: "Deep glass with ember glow — urgent dialogs",
	isSystem: true,
	values: {
		surface: "glass-deep",
		depth: "z3",
		glow: "ember",
		frame: "hard",
		transition: "fast",
	},
});

// ── Navigation ───────────────────────────────────────────────

register({
	id: "nav-item",
	kind: "navigation",
	label: "Nav Item",
	description: "Transparent with fast transition — default nav link",
	isSystem: true,
	values: {
		surface: "transparent",
		transition: "fast",
	},
});

register({
	id: "nav-active",
	kind: "navigation",
	label: "Active Nav Item",
	description: "Glass void with teal glow — active/current page",
	isSystem: true,
	values: {
		surface: "glass-void",
		glow: "teal",
		frame: "soft",
		transition: "fast",
	},
});

register({
	id: "sidebar-nav-active",
	kind: "navigation",
	label: "Active Sidebar Nav",
	description: "Teal glass with glow — active sidebar button",
	isSystem: true,
	values: {
		surface: "glass-teal",
		depth: "z1",
		bevel: "subtle",
		glow: "teal",
		frame: "accent-teal",
		transition: "fast",
	},
});

register({
	id: "nav-group",
	kind: "navigation",
	label: "Nav Group",
	description: "Glass void — groups nav items",
	isSystem: true,
	values: {
		surface: "glass-void",
	},
});

// ── Dividers ────────────────────────────────────────────────

register({
	id: "divider-default",
	kind: "divider",
	label: "Default Divider",
	description: "Transparent with soft frame — subtle separator",
	isSystem: true,
	values: {
		surface: "transparent",
		frame: "soft",
	},
});

register({
	id: "divider-glow",
	kind: "divider",
	label: "Glow Divider",
	description: "Transparent with teal glow edge — accent separator",
	isSystem: true,
	values: {
		surface: "transparent",
		frame: "soft",
		glow: "teal",
	},
});

// ── Spinners ────────────────────────────────────────────────

register({
	id: "spinner-default",
	kind: "spinner",
	label: "Default Spinner",
	description: "Transparent with fast transition — standard loading",
	isSystem: true,
	values: {
		surface: "transparent",
		motion: "spin",
		transition: "fast",
	},
});

// ── Skeletons ───────────────────────────────────────────────

register({
	id: "skeleton-default",
	kind: "skeleton",
	label: "Default Skeleton",
	description: "Glass void with pulse animation — loading placeholder",
	isSystem: true,
	values: {
		surface: "glass-void",
		motion: "pulse",
	},
});

// ── Code ────────────────────────────────────────────────────

register({
	id: "code-inline",
	kind: "code",
	label: "Inline Code",
	description: "Matte dark — inline code snippet",
	isSystem: true,
	values: {
		surface: "matte-dark",
	},
});

register({
	id: "code-block",
	kind: "code",
	label: "Code Block",
	description: "Matte dark with hard frame and subtle bevel — block code",
	isSystem: true,
	values: {
		surface: "matte-dark",
		frame: "hard",
		bevel: "subtle",
	},
});

// ── Kbd ─────────────────────────────────────────────────────

register({
	id: "kbd-default",
	kind: "kbd",
	label: "Default Kbd",
	description: "Glass smoke with hard frame and subtle bevel — keycap",
	isSystem: true,
	values: {
		surface: "glass-smoke",
		frame: "hard",
		bevel: "subtle",
		depth: "z1",
	},
});

// ── Banners ─────────────────────────────────────────────────

register({
	id: "banner-info",
	kind: "banner",
	label: "Info Banner",
	description: "Glass void with teal glow — informational",
	isSystem: true,
	values: {
		surface: "glass-void",
		glow: "teal",
		frame: "soft",
	},
});

register({
	id: "banner-warning",
	kind: "banner",
	label: "Warning Banner",
	description: "Glass void with ember glow — warning",
	isSystem: true,
	values: {
		surface: "glass-void",
		glow: "ember",
		frame: "soft",
	},
});

register({
	id: "banner-error",
	kind: "banner",
	label: "Error Banner",
	description: "Glass deep with ember glow and hard frame — error",
	isSystem: true,
	values: {
		surface: "glass-deep",
		glow: "ember",
		frame: "hard",
	},
});

register({
	id: "banner-success",
	kind: "banner",
	label: "Success Banner",
	description: "Glass void with teal glow — success",
	isSystem: true,
	values: {
		surface: "glass-void",
		glow: "teal",
		frame: "soft",
	},
});

// ── Callouts ────────────────────────────────────────────────

register({
	id: "callout-info",
	kind: "callout",
	label: "Info Callout",
	description: "Glass void with teal glow — informational note",
	isSystem: true,
	values: {
		surface: "glass-void",
		glow: "teal",
		frame: "soft",
		bevel: "subtle",
	},
});

register({
	id: "callout-tip",
	kind: "callout",
	label: "Tip Callout",
	description: "Glass void with cyber glow — helpful tip",
	isSystem: true,
	values: {
		surface: "glass-void",
		glow: "cyber",
		frame: "soft",
		bevel: "subtle",
	},
});

register({
	id: "callout-warning",
	kind: "callout",
	label: "Warning Callout",
	description: "Glass void with ember glow — warning note",
	isSystem: true,
	values: {
		surface: "glass-void",
		glow: "ember",
		frame: "soft",
		bevel: "subtle",
	},
});

// ── Stats ───────────────────────────────────────────────────

register({
	id: "stat-default",
	kind: "stat",
	label: "Default Stat",
	description: "Glass smoke with soft frame — data display",
	isSystem: true,
	values: {
		surface: "glass-smoke",
		depth: "z1",
		frame: "soft",
	},
});

// ── Textarea ────────────────────────────────────────────────

register({
	id: "textarea-default",
	kind: "textarea",
	label: "Default Textarea",
	description: "Glass void with soft frame — multi-line input",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
		transition: "fast",
	},
});

// ── Labels ──────────────────────────────────────────────────

register({
	id: "label-default",
	kind: "label",
	label: "Default Label",
	description: "Transparent — form label",
	isSystem: true,
	values: {
		surface: "transparent",
	},
});

// ── Headings ────────────────────────────────────────────────

register({
	id: "heading-default",
	kind: "heading",
	label: "Default Heading",
	description: "Transparent — semantic heading",
	isSystem: true,
	values: {
		surface: "transparent",
	},
});

// ── Text ────────────────────────────────────────────────────

register({
	id: "text-default",
	kind: "text",
	label: "Default Text",
	description: "Transparent — body text",
	isSystem: true,
	values: {
		surface: "transparent",
	},
});

// ── Toggle ──────────────────────────────────────────────────

register({
	id: "toggle-default",
	kind: "toggle",
	label: "Default Toggle",
	description: "Glass void with fast transition — toggle control",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
		transition: "fast",
	},
});

// ── Switch ──────────────────────────────────────────────────

register({
	id: "switch-default",
	kind: "switch",
	label: "Default Switch",
	description: "Glass void with soft frame and fast transition — toggle switch",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
		transition: "fast",
	},
});

// ── Checkbox ────────────────────────────────────────────────

register({
	id: "checkbox-default",
	kind: "checkbox",
	label: "Default Checkbox",
	description: "Glass void with soft frame — checkbox control",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
		transition: "fast",
	},
});

// ── Select ──────────────────────────────────────────────────

register({
	id: "select-default",
	kind: "select",
	label: "Default Select",
	description: "Glass void with soft frame — dropdown select",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
		transition: "fast",
	},
});

// ── Combobox ────────────────────────────────────────────────

register({
	id: "combobox-default",
	kind: "combobox",
	label: "Default Combobox",
	description: "Glass void with soft frame and depth — searchable dropdown",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
		depth: "z2",
		transition: "fast",
	},
});

// ── Slider ──────────────────────────────────────────────────

register({
	id: "slider-default",
	kind: "slider",
	label: "Default Slider",
	description: "Glass void with fast transition — range slider",
	isSystem: true,
	values: {
		surface: "glass-void",
		transition: "fast",
	},
});

// ── Radio Group ─────────────────────────────────────────────

register({
	id: "radio-default",
	kind: "radio-group",
	label: "Default Radio Group",
	description: "Glass void with soft frame — radio button group",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
		transition: "fast",
	},
});

// ── Dialog ──────────────────────────────────────────────────

register({
	id: "dialog-default",
	kind: "dialog",
	label: "Default Dialog",
	description: "Frost glass floating high — standard dialog",
	isSystem: true,
	values: {
		surface: "glass-frost",
		depth: "z4",
		bevel: "soft",
		frame: "soft",
		transition: "smooth",
	},
});

// ── Popover ─────────────────────────────────────────────────

register({
	id: "popover-default",
	kind: "popover",
	label: "Default Popover",
	description: "Glass smoke with elevation — floating popover",
	isSystem: true,
	values: {
		surface: "glass-smoke",
		depth: "z3",
		frame: "soft",
	},
});

// ── Tooltip ─────────────────────────────────────────────────

register({
	id: "tooltip-default",
	kind: "tooltip",
	label: "Default Tooltip",
	description: "Matte dark with depth — informational tooltip",
	isSystem: true,
	values: {
		surface: "matte-dark",
		depth: "z3",
	},
});

// ── Alert ───────────────────────────────────────────────────

register({
	id: "alert-default",
	kind: "alert",
	label: "Default Alert",
	description: "Glass void with soft frame — alert message",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "soft",
	},
});

// ── Tabs ────────────────────────────────────────────────────

register({
	id: "tabs-default",
	kind: "tabs",
	label: "Default Tabs",
	description: "Glass void with fast transition — tab navigation",
	isSystem: true,
	values: {
		surface: "glass-void",
		transition: "fast",
	},
});

// ── Accordion ───────────────────────────────────────────────

register({
	id: "accordion-default",
	kind: "accordion",
	label: "Default Accordion",
	description: "Glass void with fast transition — collapsible sections",
	isSystem: true,
	values: {
		surface: "glass-void",
		transition: "fast",
	},
});

// ── Breadcrumb ──────────────────────────────────────────────

register({
	id: "breadcrumb-default",
	kind: "breadcrumb",
	label: "Default Breadcrumb",
	description: "Transparent — navigation breadcrumb trail",
	isSystem: true,
	values: {
		surface: "transparent",
	},
});

// ── Table ───────────────────────────────────────────────────

register({
	id: "table-default",
	kind: "table",
	label: "Default Table",
	description: "Glass void with hard frame — data table",
	isSystem: true,
	values: {
		surface: "glass-void",
		frame: "hard",
	},
});

// ── Avatar ──────────────────────────────────────────────────

register({
	id: "avatar-default",
	kind: "avatar",
	label: "Default Avatar",
	description: "Glass smoke — user avatar",
	isSystem: true,
	values: {
		surface: "glass-smoke",
	},
});

// ── Sidebar ─────────────────────────────────────────────────

register({
	id: "sidebar-default",
	kind: "sidebar",
	label: "Default Sidebar",
	description: "Glass void with soft frame and depth — sidebar panel",
	isSystem: true,
	values: {
		surface: "glass-void",
		depth: "z1",
		frame: "soft",
	},
});

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/** Get a preset by ID. O(1) Map lookup. */
export function getPreset(id: string): PresetDefinition | undefined {
	return presets.get(id);
}

/** Get preset values by ID. Used by resolveVisual(). */
export function getPresetValues(id: string): Partial<Preset> | undefined {
	return presets.get(id)?.values;
}

/** Get all presets for a given component kind. */
export function getPresetsForKind(kind: string): PresetDefinition[] {
	const ids = kindIndex.get(kind);
	if (!ids) return [];
	return ids.map((id) => presets.get(id)!).filter(Boolean);
}

/** Get all registered presets. */
export function getAllPresets(): PresetDefinition[] {
	return Array.from(presets.values());
}

/** Get all unique kinds that have presets. */
export function getPresetKinds(): string[] {
	return Array.from(kindIndex.keys());
}

// ═══════════════════════════════════════════════════════════════
// WIRE: Register lookup function with resolveVisual
// ═══════════════════════════════════════════════════════════════

registerPresetLookup(getPresetValues);
