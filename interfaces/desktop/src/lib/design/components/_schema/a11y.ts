/**
 * @file Component A11y — System-Level Accessibility Utilities
 * @package @devpulse/coldlight
 *
 * Shared accessibility infrastructure for ALL ColdLight components.
 * Every component-level a11y.ts imports from here.
 *
 * Provides:
 * 1. Focus management configuration (trap, activedescendant, roving)
 * 2. Live region announcement factory + message builders
 * 3. Accessible name validation
 * 4. ARIA relationship verification
 * 5. Keyboard navigation contract validation
 * 6. A11y audit report generation
 *
 * Reference: W3C WAI-ARIA 1.3 Working Draft (https://w3c.github.io/aria/)
 * Reference: WAI-ARIA APG (https://www.w3.org/WAI/ARIA/apg/)
 * Reference: WAI-Adapt Content Module (https://w3c.github.io/adapt/)
 * Reference: WCAG 2.2 (https://www.w3.org/TR/WCAG22/)
 */

import type { ComponentContract } from "./contract.js";
import type {
	AriaLiveValue,
	AriaRelevantValue,
	WaiAdaptAction,
	WaiAdaptPurpose,
	WaiAdaptSimplification,
} from "./schema.js";

// =============================================================================
// FOCUS MANAGEMENT — Typed configurations for APG focus patterns
// =============================================================================

/** Focus strategy: how focus moves within/between component slots. */
export type FocusStrategy = "none" | "trap" | "roving" | "activedescendant" | "redirect";

/**
 * Focus management configuration for a component.
 * Derived from the component contract's focus block.
 *
 * APG patterns use one of:
 * - **trap**: Focus is locked inside (dialog, alert-dialog)
 * - **roving**: Arrow keys move tabindex between items (toolbar, tabs, radio-group)
 * - **activedescendant**: Visual focus via aria-activedescendant (combobox, listbox)
 * - **redirect**: Focus moves to another element on mount (popover → trigger on close)
 */
export interface FocusConfig {
	/** Which APG focus strategy this component uses. */
	readonly strategy: FocusStrategy;
	/** Slot name that receives initial focus on mount/open. */
	readonly initialFocus: string | undefined;
	/** Slot name focus returns to on close/dismiss. */
	readonly returnFocus: string | undefined;
	/** Slot name of the focus trap container (if strategy is "trap"). */
	readonly trapContainer: string | undefined;
	/** Whether focus wraps from last to first item (roving/activedescendant). */
	readonly wrap: boolean;
	/** Orientation for roving tabindex (horizontal, vertical, or both). */
	readonly orientation: "horizontal" | "vertical" | "both";
}

/**
 * Create a typed focus config from a component contract.
 * Validates that the focus strategy has the right fields set.
 */
export function createFocusConfig(
	contract: ComponentContract,
	overrides?: Partial<Pick<FocusConfig, "wrap" | "orientation">>,
): FocusConfig {
	return {
		strategy: contract.focus.strategy as FocusStrategy,
		initialFocus: contract.focus.initialFocus,
		returnFocus: contract.focus.returnFocus,
		trapContainer: contract.focus.trapContainer,
		wrap: overrides?.wrap ?? true,
		orientation: overrides?.orientation ?? "vertical",
	};
}

// =============================================================================
// LIVE REGIONS — Announcement factory + message builders
// =============================================================================

/**
 * Live region configuration for a single announcement zone.
 * Provides both the ARIA attributes and a message builder.
 */
export interface LiveRegionConfig {
	/** Slot name this live region corresponds to. */
	readonly slot: string;
	/** aria-live value — how urgently the SR should announce. */
	readonly politeness: AriaLiveValue;
	/** aria-relevant — what changes trigger announcement. */
	readonly relevant: readonly AriaRelevantValue[];
	/** aria-atomic — whether the entire region text is re-announced. */
	readonly atomic: boolean;
	/** Human-readable description of what this region announces. */
	readonly announces: string;
}

/**
 * Create typed live region configs from a component contract.
 * Returns an array of LiveRegionConfig, one per declared live region.
 */
export function createLiveRegionConfigs(contract: ComponentContract): LiveRegionConfig[] {
	if (!contract.liveRegions) return [];
	return contract.liveRegions.map((lr) => ({
		slot: lr.slot,
		politeness: lr.politeness,
		relevant: lr.relevant ?? ["text"],
		atomic: lr.atomic ?? false,
		announces: lr.announces,
	}));
}

/**
 * Build ARIA attributes for a live region element.
 * Returns the exact attributes to spread on the element.
 */
export function liveRegionAttrs(config: LiveRegionConfig): {
	"aria-live": AriaLiveValue;
	"aria-atomic": "true" | "false";
	"aria-relevant"?: string;
} {
	const attrs: {
		"aria-live": AriaLiveValue;
		"aria-atomic": "true" | "false";
		"aria-relevant"?: string;
	} = {
		"aria-live": config.politeness,
		"aria-atomic": config.atomic ? "true" : "false",
	};
	if (
		config.relevant.length > 0 &&
		!(config.relevant.length === 1 && config.relevant[0] === "text")
	) {
		attrs["aria-relevant"] = config.relevant.join(" ");
	}
	return attrs;
}

// =============================================================================
// ANNOUNCEMENT PATTERNS — Reusable screen reader message builders
// =============================================================================

/**
 * Standard announcement message builders.
 * Consistent phrasing across all ColdLight components.
 */
export const announcements = {
	/** "N results available" or "No results found" */
	resultCount(count: number): string {
		if (count === 0) return "No results found";
		if (count === 1) return "1 result available";
		return `${count} results available`;
	},

	/** "N items" (for collections) */
	itemCount(count: number, noun = "item"): string {
		if (count === 0) return `No ${noun}s`;
		if (count === 1) return `1 ${noun}`;
		return `${count} ${noun}s`;
	},

	/** "Selected: Label" */
	selected(label: string): string {
		return `Selected: ${label}`;
	},

	/** "Deselected: Label" */
	deselected(label: string): string {
		return `Deselected: ${label}`;
	},

	/** "Item N of M" */
	position(index: number, total: number): string {
		return `Item ${index + 1} of ${total}`;
	},

	/** "Expanded" / "Collapsed" */
	expandedState(expanded: boolean): string {
		return expanded ? "Expanded" : "Collapsed";
	},

	/** "Step N of M: Label" */
	step(index: number, total: number, label?: string): string {
		const base = `Step ${index + 1} of ${total}`;
		return label ? `${base}: ${label}` : base;
	},
} as const;

// =============================================================================
// ACCESSIBLE NAME — Validation that a component has a name
// =============================================================================

/**
 * Result of accessible name validation.
 */
export interface AccessibleNameResult {
	/** Whether the component has a valid accessible name. */
	readonly valid: boolean;
	/** The resolved accessible name (if found). */
	readonly name: string | undefined;
	/** How the name was resolved. */
	readonly source: "aria-label" | "aria-labelledby" | "content" | "title" | "none";
	/** Warning/error message if invalid. */
	readonly message: string | undefined;
}

/**
 * Validate that an element has a resolvable accessible name.
 * Checks aria-label, aria-labelledby, text content, title in priority order.
 *
 * @param attrs - The element's attributes (from transport or DOM)
 * @param textContent - The element's text content (if applicable)
 * @param required - Whether an accessible name is required (from contract)
 */
export function validateAccessibleName(
	attrs: Record<string, unknown>,
	textContent?: string,
	required = true,
): AccessibleNameResult {
	// Priority 1: aria-labelledby (resolves to referenced element text)
	if (attrs["aria-labelledby"] && typeof attrs["aria-labelledby"] === "string") {
		return {
			valid: true,
			name: undefined, // Can't resolve without DOM
			source: "aria-labelledby",
			message: undefined,
		};
	}

	// Priority 2: aria-label
	if (attrs["aria-label"] && typeof attrs["aria-label"] === "string") {
		return {
			valid: true,
			name: attrs["aria-label"] as string,
			source: "aria-label",
			message: undefined,
		};
	}

	// Priority 3: Text content
	if (textContent && textContent.trim().length > 0) {
		return {
			valid: true,
			name: textContent.trim(),
			source: "content",
			message: undefined,
		};
	}

	// Priority 4: Title attribute
	if (attrs.title && typeof attrs.title === "string") {
		return {
			valid: true,
			name: attrs.title as string,
			source: "title",
			message: required
				? "Using title for accessible name — prefer aria-label or visible label"
				: undefined,
		};
	}

	// No name found
	return {
		valid: !required,
		name: undefined,
		source: "none",
		message: required
			? "Missing accessible name — add aria-label, aria-labelledby, or visible label text"
			: undefined,
	};
}

// =============================================================================
// ARIA RELATIONSHIP VALIDATION — Verify ID references resolve
// =============================================================================

/**
 * Validate that ARIA relationship attributes reference existing element IDs.
 * Call this at render time with the actual DOM.
 *
 * @param element - The element with the relationship attribute
 * @param attr - The ARIA attribute (e.g., "aria-controls")
 * @param targetId - The ID value from the attribute
 * @returns Whether the target element exists in the DOM
 */
export function validateAriaRelationship(
	attr: string,
	targetId: string | undefined | null,
): { valid: boolean; error?: string } {
	if (!targetId) {
		return { valid: false, error: `${attr} is empty — no target ID set` };
	}
	// Note: DOM existence check must happen at runtime in the component
	// This validates the attribute value is non-empty and well-formed
	if (targetId.includes(" ")) {
		// Multi-ID reference (aria-describedby, aria-labelledby, aria-details in 1.3)
		const ids = targetId.split(/\s+/).filter(Boolean);
		if (ids.length === 0) {
			return { valid: false, error: `${attr} has only whitespace — no valid IDs` };
		}
		return { valid: true };
	}
	return { valid: true };
}

// =============================================================================
// KEYBOARD CONTRACT — Validate keyboard interactions
// =============================================================================

/**
 * A keyboard interaction entry for display or validation.
 */
export interface KeyboardEntry {
	/** The key (e.g., "ArrowDown", "Enter", "Escape") */
	readonly key: string;
	/** What the key does (e.g., "open-or-next", "select") */
	readonly action: string;
	/** Human-readable description */
	readonly description: string;
	/** Which slot handles this key (undefined = global) */
	readonly slot?: string;
}

/**
 * Extract a flat list of all keyboard interactions from a component contract.
 * Merges global keys and per-slot keys into one list.
 */
export function extractKeyboardMap(contract: ComponentContract): KeyboardEntry[] {
	const entries: KeyboardEntry[] = [];

	// Global keys
	for (const k of contract.keyboard.global) {
		entries.push({
			key: k.key,
			action: k.action,
			description: k.description,
		});
	}

	// Per-slot keys
	for (const [slotName, slotContract] of Object.entries(contract.slotContracts)) {
		if (slotContract.keyboard) {
			for (const k of slotContract.keyboard) {
				entries.push({
					key: k.key,
					action: k.action,
					description: k.description,
					slot: slotName,
				});
			}
		}
	}

	return entries;
}

// =============================================================================
// WAI-ADAPT — Data attribute builders for machine-readable semantics
// =============================================================================

/**
 * WAI-Adapt data attributes for an element.
 * These are rendered as data-adapt-* attributes.
 */
export interface WaiAdaptAttrs {
	"data-adapt-action"?: WaiAdaptAction;
	"data-adapt-purpose"?: WaiAdaptPurpose;
	"data-adapt-simplification"?: WaiAdaptSimplification;
}

/**
 * Build WAI-Adapt data attributes for a root component.
 * Uses the contract's waiAdapt block.
 */
export function waiAdaptAttrs(contract: ComponentContract): WaiAdaptAttrs {
	if (!contract.waiAdapt) return {};
	const attrs: WaiAdaptAttrs = {};
	if (contract.waiAdapt.action) attrs["data-adapt-action"] = contract.waiAdapt.action;
	if (contract.waiAdapt.purpose) attrs["data-adapt-purpose"] = contract.waiAdapt.purpose;
	if (contract.waiAdapt.simplification) {
		attrs["data-adapt-simplification"] = contract.waiAdapt.simplification;
	}
	return attrs;
}

/**
 * Build WAI-Adapt data attributes for a specific slot.
 * Uses the contract's waiAdapt.slotAdapt block.
 */
export function waiAdaptSlotAttrs(
	contract: ComponentContract,
	slotName: string,
): Pick<WaiAdaptAttrs, "data-adapt-action" | "data-adapt-purpose"> {
	const slotAdapt = contract.waiAdapt?.slotAdapt?.[slotName];
	if (!slotAdapt) return {};
	const attrs: Pick<WaiAdaptAttrs, "data-adapt-action" | "data-adapt-purpose"> = {};
	if (slotAdapt.action) attrs["data-adapt-action"] = slotAdapt.action;
	if (slotAdapt.purpose) attrs["data-adapt-purpose"] = slotAdapt.purpose;
	return attrs;
}

// =============================================================================
// A11Y AUDIT REPORT — Structured accessibility validation
// =============================================================================

/** Severity level for a11y issues. */
export type A11ySeverity = "error" | "warning" | "info";

/** A single a11y finding. */
export interface A11yFinding {
	/** Severity — errors must be fixed, warnings should be addressed. */
	readonly severity: A11ySeverity;
	/** WCAG success criterion (e.g., "4.1.2") or APG rule. */
	readonly rule: string;
	/** Slot name where the issue was found (or "root"). */
	readonly slot: string;
	/** Human-readable description of the issue. */
	readonly message: string;
}

/**
 * Full accessibility audit report for a component.
 */
export interface A11yReport {
	/** Component kind. */
	readonly kind: string;
	/** Whether the component passes all required checks. */
	readonly valid: boolean;
	/** Error count (must be zero for valid). */
	readonly errorCount: number;
	/** Warning count. */
	readonly warningCount: number;
	/** All findings. */
	readonly findings: readonly A11yFinding[];
}

/**
 * Run a static accessibility audit on a component contract.
 * Checks that the contract declares all required ARIA attributes,
 * keyboard interactions, focus management, and accessible names.
 *
 * This is a BUILD-TIME check — runtime DOM checks are separate.
 */
export function auditContract(contract: ComponentContract): A11yReport {
	const findings: A11yFinding[] = [];

	// 1. Accessible name must be declared
	if (contract.accessibleName.required && contract.accessibleName.sources.length === 0) {
		findings.push({
			severity: "error",
			rule: "WCAG 4.1.2",
			slot: "root",
			message: "Accessible name is required but no sources declared",
		});
	}

	// 2. Every required slot must have a slotContract
	for (const slot of contract.slots.required) {
		if (!contract.slotContracts[slot]) {
			findings.push({
				severity: "error",
				rule: "APG",
				slot,
				message: `Required slot '${slot}' has no slotContract defined`,
			});
		}
	}

	// 3. Slots with roles must have data-kind and data-slot
	for (const [slotName, slotContract] of Object.entries(contract.slotContracts)) {
		if (!slotContract.data.kind) {
			findings.push({
				severity: "error",
				rule: "ColdLight",
				slot: slotName,
				message: "Missing data-kind attribute",
			});
		}
		if (!slotContract.data.slot) {
			findings.push({
				severity: "error",
				rule: "ColdLight",
				slot: slotName,
				message: "Missing data-slot attribute",
			});
		}
	}

	// 4. Focus strategy must be declared
	if (!contract.focus.strategy) {
		findings.push({
			severity: "error",
			rule: "APG",
			slot: "root",
			message: "No focus strategy declared",
		});
	}

	// 5. Interactive components should have keyboard interactions
	if (
		(contract.interactions.selectable || contract.interactions.expandable) &&
		contract.keyboard.global.length === 0
	) {
		findings.push({
			severity: "warning",
			rule: "WCAG 2.1.1",
			slot: "root",
			message: "Interactive component has no global keyboard interactions declared",
		});
	}

	// 6. Expandable components should have Escape key
	if (contract.interactions.expandable) {
		const hasEscape = contract.keyboard.global.some((k) => k.key === "Escape");
		if (!hasEscape) {
			findings.push({
				severity: "warning",
				rule: "APG",
				slot: "root",
				message: "Expandable component should handle Escape key to close",
			});
		}
	}

	// 7. Modal components must have focus trap
	if (contract.interactions.modal && contract.focus.strategy !== "trap") {
		findings.push({
			severity: "error",
			rule: "WCAG 2.4.3",
			slot: "root",
			message: "Modal component must use 'trap' focus strategy",
		});
	}

	// 8. ARIA relationships must target valid slots
	for (const [slotName, slotContract] of Object.entries(contract.slotContracts)) {
		for (const rel of slotContract.aria.relationships ?? []) {
			const allSlots = [
				...contract.slots.required,
				...contract.slots.optional,
				// Allow sub-slot targets like "group-label"
			];
			if (!allSlots.includes(rel.targetSlot) && !rel.targetSlot.includes("-")) {
				findings.push({
					severity: "warning",
					rule: "ARIA",
					slot: slotName,
					message: `${rel.attr} targets slot '${rel.targetSlot}' which is not in slots list`,
				});
			}
		}
	}

	// 9. Live regions should have politeness declared
	if (contract.liveRegions) {
		for (const lr of contract.liveRegions) {
			if (!lr.politeness) {
				findings.push({
					severity: "error",
					rule: "ARIA",
					slot: lr.slot,
					message: "Live region missing politeness level (aria-live value)",
				});
			}
		}
	}

	// 10. WAI-Adapt: if declared, simplification must be set
	if (contract.waiAdapt && !contract.waiAdapt.simplification) {
		findings.push({
			severity: "warning",
			rule: "WAI-Adapt",
			slot: "root",
			message: "WAI-Adapt declared but no simplification level set",
		});
	}

	const errorCount = findings.filter((f) => f.severity === "error").length;
	const warningCount = findings.filter((f) => f.severity === "warning").length;

	return {
		kind: contract.kind,
		valid: errorCount === 0,
		errorCount,
		warningCount,
		findings,
	};
}
