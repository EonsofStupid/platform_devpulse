/**
 * @file Block Kind Categories — Palette Grouping
 * @layer blocks
 * @package @devpulse/coldlight
 *
 * Categories for VPB palette organization.
 * Each category maps to an array of primitive kind strings
 * that exist in the ColdLight component registry.
 */

export const BLOCK_CATEGORIES = {
	shell: ["app-shell", "top-bar", "side-nav", "status-bar", "dock"],
	surfaces: ["card", "dialog", "sheet", "callout", "banner"],
	forms: [
		"input",
		"textarea",
		"checkbox",
		"switch",
		"select",
		"radio-group",
		"slider",
		"number-input",
		"color-input",
		"date-field",
		"date-picker",
		"date-range-field",
		"date-range-picker",
		"search-input",
		"form",
		"form-field",
	],
	feedback: [
		"alert",
		"alert-dialog",
		"badge",
		"spinner",
		"progress",
		"skeleton",
		"inline-message",
		"loading-overlay",
	],
	data: ["table", "data-table", "stat", "list", "description-list"],
	navigation: [
		"tabs",
		"accordion",
		"breadcrumb",
		"pagination",
		"steps",
		"nav",
		"nav-item",
		"navigation-menu",
		"sidebar",
		"toolbar",
	],
	content: ["text", "heading", "code", "kbd", "separator", "divider", "prose", "table-of-contents"],
	layout: [
		"box",
		"flex",
		"stack",
		"hstack",
		"grid",
		"container",
		"center",
		"spacer",
		"aspect-ratio",
	],
	overlay: [
		"popover",
		"tooltip",
		"dropdown-menu",
		"context-menu",
		"menubar",
		"combobox",
		"scroll-area",
	],
	chat: [
		"chat-frame",
		"chat-topbar",
		"chat-sidebar",
		"chat-dashboard",
		"chat-footer",
		"chat-context-panel",
		"chat-command-palette",
	],
	interactions: ["multiple-choice", "true-false", "fill-blank", "confirmation"],
	widgets: [
		"widget",
		"widget-stat",
		"widget-chart",
		"widget-gauge",
		"widget-timeline",
		"widget-table",
		"widget-kpi",
	],
} as const;

export type BlockCategory = keyof typeof BLOCK_CATEGORIES;

/** All block kind strings across all categories. */
export const ALL_BLOCK_KINDS = Object.values(BLOCK_CATEGORIES).flat();
