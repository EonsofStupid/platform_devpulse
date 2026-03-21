/**
 * @file ColdLight Reactive Registry
 * @package @devpulse/coldlight
 *
 * Svelte 5 rune-based registry. Loads ALL colocated contracts at import time.
 * Validates via Zod. Tracks status. Observable by VPB.
 *
 * The registry IS the runtime view of all primitives.
 * Scanner generates the manifest JSON. This registry provides the live API.
 *
 * Pattern: Config → Contracts → Registry (reactive rune) → VPB observable
 */

import { coldlightConfig } from "./coldlight.config.js";

// ─── Import ALL contracts ────────────────────────────────────────────────────

import {
	aspectRatioContract,
	boxContract,
	breadcrumbContract,
	buttonContract,
	calloutContract,
	centerContract,
	checkboxContract,
	colorInputContract,
	commandPaletteContract,
	containerContract,
	contextMenuContract,
	dataTableContract,
	dateFieldContract,
	dateRangeFieldContract,
	descriptionListContract,
	dialogContract,
	dividerContract,
	dropdownMenuContract,
	emptyStateContract,
	fileUploadContract,
	flexContract,
	formContract,
	formFieldContract,
	gridContract,
	headingContract,
	hstackContract,
	inlineMessageContract,
	inputContract,
	inputGroupContract,
	kbdContract,
	labelContract,
	linkPreviewContract,
	listContract,
	loadingOverlayContract,
	menubarContract,
	navContract,
	navItemContract,
	notificationCenterContract,
	numberInputContract,
	paginationContract,
	pinInputContract,
	popoverContract,
	progressContract,
	proseContract,
	radioGroupContract,
	// P1-P3 ColdLight-owned
	scrollAreaContract,
	searchInputContract,
	selectContract,
	// P1
	separatorContract,
	sheetContract,
	sidebarContract,
	skeletonContract,
	skipLinkContract,
	sliderContract,
	spacerContract,
	spinnerContract,
	stackContract,
	statContract,
	stepsContract,
	stickyContract,
	switchContract,
	tableContract,
	tableOfContentsContract,
	tabsContract,
	tagsInputContract,
	textareaContract,
	textContract,
	toasterContract,
	toggleContract,
	toggleGroupContract,
	toolbarContract,
	tooltipContract,
	treeContract,
} from "./primitives/index.js";

// =============================================================================
// TYPES
// =============================================================================

export interface RegistryEntry {
	readonly kind: string;
	readonly ariaStateProvider: "coldlight" | "meltui";
	readonly compound: boolean;
	readonly focusStrategy: string;
	readonly slots: { required: readonly string[]; optional: readonly string[] };
	readonly keyboard: readonly string[];
	readonly category:
		| "interactive"
		| "layout"
		| "typography"
		| "form"
		| "display"
		| "feedback"
		| "navigation"
		| "overlay";
	readonly priority: "P0" | "P1" | "P2" | "P3";
	readonly contract: unknown;
}

export type RegistryStatus = "idle" | "loading" | "ready" | "error";

// =============================================================================
// CONTRACT REGISTRY — all contracts keyed by kind
// =============================================================================

function categorize(kind: string): RegistryEntry["category"] {
	const map: Record<string, RegistryEntry["category"]> = {
		// Layout
		box: "layout",
		flex: "layout",
		stack: "layout",
		hstack: "layout",
		grid: "layout",
		container: "layout",
		center: "layout",
		spacer: "layout",
		"aspect-ratio": "layout",
		sticky: "layout",
		"scroll-area": "layout",
		card: "layout",
		// Typography
		text: "typography",
		heading: "typography",
		code: "typography",
		kbd: "typography",
		prose: "typography",
		// Form
		input: "form",
		textarea: "form",
		"form-field": "form",
		form: "form",
		"input-group": "form",
		"number-input": "form",
		"search-input": "form",
		"color-input": "form",
		"tags-input": "form",
		"date-field": "form",
		"date-picker": "form",
		"date-range-field": "form",
		"date-range-picker": "form",
		// Display
		badge: "display",
		skeleton: "display",
		stat: "display",
		list: "display",
		"description-list": "display",
		table: "display",
		"data-table": "display",
		"empty-state": "display",
		separator: "display",
		divider: "display",
		// Feedback
		alert: "feedback",
		spinner: "feedback",
		"inline-message": "feedback",
		banner: "feedback",
		callout: "feedback",
		"loading-overlay": "feedback",
		// Navigation
		"skip-link": "navigation",
		breadcrumb: "navigation",
		nav: "navigation",
		"nav-item": "navigation",
		steps: "navigation",
		pagination: "navigation",
		"table-of-contents": "navigation",
		sidebar: "navigation",
		// Overlay
		dialog: "overlay",
		popover: "overlay",
		tooltip: "overlay",
		sheet: "overlay",
		toaster: "overlay",
		"alert-dialog": "overlay",
		"command-palette": "overlay",
		"notification-center": "overlay",
		"link-preview": "overlay",
		// Interactive (menus)
		"dropdown-menu": "interactive",
		"context-menu": "interactive",
		menubar: "interactive",
		calendar: "interactive",
		"range-calendar": "interactive",
	};
	return map[kind] ?? "interactive";
}

function priority(kind: string): RegistryEntry["priority"] {
	const p1: string[] = [
		"separator",
		"toggle-group",
		"toolbar",
		"breadcrumb",
		"nav",
		"nav-item",
		"center",
		"spacer",
		"divider",
		"skeleton",
		"stat",
		"code",
		"list",
		"description-list",
		"banner",
		"callout",
		"input-group",
		"number-input",
		"search-input",
		"steps",
		"sheet",
		// P1-P3 additions
		"alert-dialog",
		"dropdown-menu",
		"context-menu",
		"menubar",
		"tags-input",
		"link-preview",
		"scroll-area",
		"pagination",
		"table-of-contents",
		"calendar",
		"date-field",
		"date-picker",
		"date-range-field",
		"date-range-picker",
		"range-calendar",
		"card",
		"table",
		"data-table",
		"empty-state",
		"loading-overlay",
		"color-input",
		"sidebar",
		"command-palette",
		"notification-center",
		"kbd",
		"prose",
		"aspect-ratio",
		"sticky",
	];
	return p1.includes(kind) ? "P1" : "P0";
}

function buildEntry(c: {
	kind: string;
	ariaStateProvider: string;
	compound: boolean;
	focusStrategy: string;
	slots: { required: readonly string[]; optional: readonly string[] };
	keyboard: readonly string[];
}): RegistryEntry {
	return {
		kind: c.kind,
		ariaStateProvider: c.ariaStateProvider as "coldlight" | "meltui",
		compound: c.compound,
		focusStrategy: c.focusStrategy,
		slots: { required: c.slots.required, optional: c.slots.optional },
		keyboard: c.keyboard,
		category: categorize(c.kind),
		priority: priority(c.kind),
		contract: c,
	};
}

// Build the full registry from all contracts
const ALL_CONTRACTS = [
	// ColdLight-owned interactive
	buttonContract,
	checkboxContract,
	switchContract,
	labelContract,
	// Form
	inputContract,
	textareaContract,
	formFieldContract,
	formContract,
	// Feedback
	spinnerContract,
	inlineMessageContract,
	// Navigation
	skipLinkContract,
	// Layout
	boxContract,
	flexContract,
	stackContract,
	hstackContract,
	gridContract,
	containerContract,
	// Typography
	textContract,
	headingContract,
	dialogContract,
	tabsContract,
	selectContract,
	popoverContract,
	tooltipContract,
	toggleContract,
	progressContract,
	radioGroupContract,
	sliderContract,
	fileUploadContract,
	pinInputContract,
	toasterContract,
	treeContract,
	// P1
	separatorContract,
	toggleGroupContract,
	toolbarContract,
	breadcrumbContract,
	navContract,
	navItemContract,
	centerContract,
	spacerContract,
	dividerContract,
	skeletonContract,
	statContract,
	listContract,
	descriptionListContract,
	calloutContract,
	inputGroupContract,
	numberInputContract,
	searchInputContract,
	stepsContract,
	sheetContract,
	dropdownMenuContract,
	contextMenuContract,
	menubarContract,
	tagsInputContract,
	linkPreviewContract,
	paginationContract,
	dateFieldContract,
	dateRangeFieldContract,
	commandPaletteContract,
	// P1-P3 ColdLight-owned
	scrollAreaContract,
	tableOfContentsContract,
	tableContract,
	dataTableContract,
	emptyStateContract,
	loadingOverlayContract,
	colorInputContract,
	sidebarContract,
	notificationCenterContract,
	kbdContract,
	proseContract,
	aspectRatioContract,
	stickyContract,
] as const;

const kindIndex = new Map<string, RegistryEntry>(
	ALL_CONTRACTS.map((c) => [c.kind, buildEntry(c)] as const),
);

// =============================================================================
// REACTIVE REGISTRY STATE — Svelte 5 rune
// =============================================================================

let registryStatus = $state<RegistryStatus>("ready");
let registryError = $state<string | null>(null);

// =============================================================================
// REGISTRY API
// =============================================================================

/** Get the ColdLight config */
export function getConfig() {
	return coldlightConfig;
}

/** Registry status for VPB observation */
export function getStatus(): RegistryStatus {
	return registryStatus;
}

/** Registry error message (if any) */
export function getError(): string | null {
	return registryError;
}

/** Total primitive count */
export function getCount(): number {
	return kindIndex.size;
}

/** All registered kinds */
export function getKinds(): string[] {
	return Array.from(kindIndex.keys());
}

/** All registry entries */
export function getAll(): RegistryEntry[] {
	return Array.from(kindIndex.values());
}

/** Get entry by kind. Throws if not found. */
export function get(kind: string): RegistryEntry {
	const entry = kindIndex.get(kind);
	if (!entry) throw new Error(`[ColdLight Registry] Unknown kind: ${kind}`);
	return entry;
}

/** Get entry by kind, or undefined */
export function getOrUndefined(kind: string): RegistryEntry | undefined {
	return kindIndex.get(kind);
}

/** Check if kind exists */
export function has(kind: string): boolean {
	return kindIndex.has(kind);
}

/** Filter by category */
export function byCategory(category: RegistryEntry["category"]): RegistryEntry[] {
	return getAll().filter((e) => e.category === category);
}

/** Filter by aria state provider */
export function byProvider(provider: "coldlight" | "meltui"): RegistryEntry[] {
	return getAll().filter((e) => e.ariaStateProvider === provider);
}

/** Filter by priority */
export function byPriority(p: RegistryEntry["priority"]): RegistryEntry[] {
	return getAll().filter((e) => e.priority === p);
}

/** Get summary stats for VPB dashboard */
export function getSummary() {
	const all = getAll();
	return {
		total: all.length,
		coldlightOwned: all.filter((e) => e.ariaStateProvider === "coldlight").length,
		meltBacked: all.filter((e) => e.ariaStateProvider === "meltui").length,
		compound: all.filter((e) => e.compound).length,
		byCategory: {
			interactive: byCategory("interactive").length,
			layout: byCategory("layout").length,
			typography: byCategory("typography").length,
			form: byCategory("form").length,
			display: byCategory("display").length,
			feedback: byCategory("feedback").length,
			navigation: byCategory("navigation").length,
			overlay: byCategory("overlay").length,
		},
		byPriority: {
			P0: byPriority("P0").length,
			P1: byPriority("P1").length,
		},
		config: {
			systemId: coldlightConfig.identity.systemId,
			version: coldlightConfig.identity.version,
			activeAdapter: coldlightConfig.adapters.active,
		},
	};
}

/** Mark registry as errored (for VPB to display) */
export function setError(error: string) {
	registryStatus = "error";
	registryError = error;
}

/** Reset to ready state */
export function reset() {
	registryStatus = "ready";
	registryError = null;
}
