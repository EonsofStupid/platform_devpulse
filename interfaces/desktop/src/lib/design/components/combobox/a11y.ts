/**
 * @file Combobox A11y — Accessibility Configuration & Utilities
 * @kind combobox
 * @layer components
 * @package @devpulse/coldlight
 *
 * Combobox-specific accessibility layer built on top of _schema/a11y.ts.
 * Codifies the APG Combobox Pattern's exact requirements:
 *
 * 1. Focus: activedescendant pattern (focus stays on input, visual highlight on options)
 * 2. Live regions: announce (result count) + empty (no results)
 * 3. Keyboard: 7 global keys per APG spec
 * 4. ARIA relationships: aria-controls → content, aria-labelledby → label
 * 5. WAI-Adapt: per-slot action/purpose declarations
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 * WAI-ARIA 1.3: https://w3c.github.io/aria/
 * WAI-Adapt: https://w3c.github.io/adapt/
 */

import {
	createFocusConfig,
	createLiveRegionConfigs,
	extractKeyboardMap,
	announcements,
	auditContract,
	waiAdaptAttrs,
	waiAdaptSlotAttrs,
	type FocusConfig,
	type LiveRegionConfig,
	type KeyboardEntry,
	type A11yReport,
	type WaiAdaptAttrs,
} from "../_schema/a11y.js";
import { contract } from "./contract.js";

// =============================================================================
// FOCUS — Activedescendant pattern
// =============================================================================

/**
 * Combobox focus configuration.
 *
 * Uses activedescendant pattern per APG:
 * - Physical focus stays on the `input` element at all times
 * - Visual focus highlight moves between `option` elements
 * - aria-activedescendant on input references the highlighted option's ID
 * - Focus returns to input when listbox closes
 * - Arrow keys wrap from last to first option
 */
export const comboboxFocusConfig: FocusConfig = createFocusConfig(contract, {
	wrap: true,
	orientation: "vertical",
});

// =============================================================================
// LIVE REGIONS — Announce + Empty
// =============================================================================

/**
 * Combobox live region configurations.
 *
 * Two live regions per APG best practices:
 *
 * 1. **announce** — Polite, atomic region that announces the number of
 *    filtered results after the user types. Screen readers say
 *    "5 results available" or "No results found".
 *
 * 2. **empty** — Polite, atomic region that announces when filtering
 *    produces zero matches. Rendered as visible text ("No results found")
 *    that doubles as a live region.
 */
export const comboboxLiveRegions: readonly LiveRegionConfig[] = createLiveRegionConfigs(contract);

/**
 * Get the announce live region config.
 */
export const announceLiveRegion: LiveRegionConfig | undefined =
	comboboxLiveRegions.find((lr) => lr.slot === "announce");

/**
 * Get the empty live region config.
 */
export const emptyLiveRegion: LiveRegionConfig | undefined =
	comboboxLiveRegions.find((lr) => lr.slot === "empty");

// =============================================================================
// KEYBOARD — APG Combobox Pattern keybindings
// =============================================================================

/**
 * Complete keyboard interaction map for the combobox.
 * Includes global keys and per-slot keys (input, trigger).
 *
 * APG Combobox Pattern keys:
 * | Key       | Action           | Description                                |
 * |-----------|------------------|--------------------------------------------|
 * | ArrowDown | open-or-next     | Open listbox or highlight next option       |
 * | ArrowUp   | open-or-prev     | Open listbox or highlight previous option   |
 * | Home      | first            | Highlight the first option                  |
 * | End       | last             | Highlight the last option                   |
 * | Enter     | select           | Select the currently highlighted option     |
 * | Escape    | close            | Close the listbox popup                     |
 * | Tab       | accept-and-move  | Accept current value and move focus out     |
 */
export const comboboxKeyboardMap: readonly KeyboardEntry[] = extractKeyboardMap(contract);

// =============================================================================
// ANNOUNCEMENTS — Screen reader message builders
// =============================================================================

/**
 * Combobox-specific announcement messages.
 * Use these in the announce live region for consistent SR output.
 */
export const comboboxAnnouncements = {
	/**
	 * Announce the number of filtered results.
	 * Call this after the filter debounce completes.
	 *
	 * @example
	 * comboboxAnnouncements.resultCount(5)  // "5 results available"
	 * comboboxAnnouncements.resultCount(0)  // "No results found"
	 * comboboxAnnouncements.resultCount(1)  // "1 result available"
	 */
	resultCount: announcements.resultCount,

	/**
	 * Announce the currently selected item.
	 *
	 * @example
	 * comboboxAnnouncements.selected("Mango")  // "Selected: Mango"
	 */
	selected: announcements.selected,

	/**
	 * Announce the position of the highlighted option.
	 *
	 * @example
	 * comboboxAnnouncements.position(2, 10)  // "Item 3 of 10"
	 */
	position: announcements.position,

	/**
	 * Announce expanded/collapsed state.
	 *
	 * @example
	 * comboboxAnnouncements.expandedState(true)  // "Expanded"
	 */
	expandedState: announcements.expandedState,
} as const;

// =============================================================================
// WAI-ADAPT — Machine-readable data attributes
// =============================================================================

/**
 * WAI-Adapt attributes for the combobox root element.
 * Renders as data-adapt-action, data-adapt-purpose, data-adapt-simplification.
 */
export const comboboxAdaptAttrs: WaiAdaptAttrs = waiAdaptAttrs(contract);

/**
 * WAI-Adapt attributes for specific slots.
 *
 * @example
 * comboboxSlotAdapt("input")   // { "data-adapt-action": "filter", "data-adapt-purpose": "search-term" }
 * comboboxSlotAdapt("trigger") // { "data-adapt-action": "open-listbox" }
 * comboboxSlotAdapt("option")  // { "data-adapt-action": "select" }
 */
export function comboboxSlotAdapt(slotName: string) {
	return waiAdaptSlotAttrs(contract, slotName);
}

// =============================================================================
// ARIA RELATIONSHIPS — Required ID linkages
// =============================================================================

/**
 * ARIA relationship requirements for the combobox.
 * These ID references must resolve to existing DOM elements.
 *
 * | Source Slot | Attribute        | Target Slot  | Required |
 * |------------|------------------|--------------|----------|
 * | input      | aria-controls    | content      | YES      |
 * | input      | aria-labelledby  | label        | NO       |
 * | group      | aria-labelledby  | group-label  | YES      |
 */
export const comboboxRelationships = [
	{
		sourceSlot: "input" as const,
		attr: "aria-controls" as const,
		targetSlot: "content" as const,
		required: true,
		description: "Input must reference the listbox popup via aria-controls",
	},
	{
		sourceSlot: "input" as const,
		attr: "aria-labelledby" as const,
		targetSlot: "label" as const,
		required: false,
		description: "Input should reference a visible label via aria-labelledby",
	},
	{
		sourceSlot: "group" as const,
		attr: "aria-labelledby" as const,
		targetSlot: "group-label" as const,
		required: true,
		description: "Group must reference its label heading via aria-labelledby",
	},
] as const;

// =============================================================================
// CONTRACT AUDIT — Static a11y validation
// =============================================================================

/**
 * Run a full accessibility audit on the combobox contract.
 * Returns a structured report with errors, warnings, and info.
 *
 * @example
 * const report = auditCombobox();
 * if (!report.valid) {
 *   console.error("Combobox a11y audit failed:", report.findings);
 * }
 */
export function auditCombobox(): A11yReport {
	return auditContract(contract);
}
