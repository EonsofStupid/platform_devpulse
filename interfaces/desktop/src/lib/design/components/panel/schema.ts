/**
 * @file Panel Component Schema
 * @package @devpulse/coldlight
 *
 * LAYOUT COMPONENT SCHEMA for the Panel component.
 * AI-ready semantic description for layout containers.
 *
 * Panel is a pure layout component — no ARIA primitive backing it.
 * It provides a styled container with header/body/footer slots.
 * ARIA semantics are optional (region, section, article landmarks).
 */

import { z } from "zod";

// =============================================================================
// LAYOUT COMPONENT CONTRACT — Simplified schema for layout containers
// =============================================================================

/**
 * Layout slot contract — simplified for non-interactive components.
 */
export const LayoutSlotContractSchema = z.object({
	name: z.string(),
	element: z.string(),
	description: z.string(),
	ariaRole: z.string().optional(),
	ariaLandmark: z.boolean(),
});
export type LayoutSlotContract = z.infer<typeof LayoutSlotContractSchema>;

/**
 * Layout component contract — for containers without ARIA primitives.
 */
export const LayoutComponentContractSchema = z.object({
	kind: z.string(),
	description: z.string(),
	slots: z.object({
		required: z.array(z.string()).readonly(),
		optional: z.array(z.string()).readonly(),
	}),
	slotContracts: z.record(z.string(), LayoutSlotContractSchema),
	ariaGuidance: z.object({
		useLandmark: z.string(),
		accessibleName: z.string(),
		notes: z.array(z.string()).readonly(),
	}),
});
export type LayoutComponentContract = z.infer<typeof LayoutComponentContractSchema>;

// =============================================================================
// SLOT CONTRACTS — Layout semantics for Panel sub-components
// =============================================================================

/**
 * Panel Root slot — main container.
 *
 * ARIA Guidance:
 * - MAY use role="region" if panel has a meaningful boundary
 * - If using region, MUST have aria-label or aria-labelledby
 * - Otherwise, no ARIA role needed (just a div)
 */
export const panelRootSlot: LayoutSlotContract = {
	name: "root",
	element: "div",
	description:
		"Main container for the panel. Provides visual boundaries and styling. " +
		"Can optionally be a region landmark if it represents a distinct section of the page.",
	ariaRole: "region",
	ariaLandmark: true,
};

/**
 * Panel Header slot — top section.
 *
 * ARIA Guidance:
 * - No specific role required
 * - Content inside provides context (headings, title text)
 * - If panel root uses aria-labelledby, reference heading inside header
 */
export const panelHeaderSlot: LayoutSlotContract = {
	name: "header",
	element: "div",
	description:
		"Top section of the panel. Typically contains title, subtitle, or action buttons. " +
		"If a heading (h1-h6) is present, it can be referenced by aria-labelledby on the root.",
	ariaRole: undefined,
	ariaLandmark: false,
};

/**
 * Panel Body slot — main content area.
 *
 * ARIA Guidance:
 * - No specific role required
 * - Contains the primary content of the panel
 */
export const panelBodySlot: LayoutSlotContract = {
	name: "body",
	element: "div",
	description: "Main content area of the panel. Contains the primary content being displayed.",
	ariaRole: undefined,
	ariaLandmark: false,
};

/**
 * Panel Footer slot — bottom section.
 *
 * ARIA Guidance:
 * - No specific role required
 * - Typically contains actions, metadata, or navigation
 */
export const panelFooterSlot: LayoutSlotContract = {
	name: "footer",
	element: "div",
	description:
		"Bottom section of the panel. Typically contains action buttons, timestamps, or metadata.",
	ariaRole: undefined,
	ariaLandmark: false,
};

// =============================================================================
// FULL COMPONENT CONTRACT — AI-introspectable layout description
// =============================================================================

/**
 * Panel Component Contract.
 *
 * Layout semantics for AI agents to understand:
 * - What the component does (visual container for grouped content)
 * - How to structure content (header/body/footer pattern)
 * - When to use ARIA landmarks
 */
const rawContract: LayoutComponentContract = {
	kind: "panel",
	description:
		"Styled container component for grouping related content. Provides a visual boundary with " +
		"optional header, body, and footer sections. Used for cards, sections, widgets, and content grouping.",

	slots: {
		required: ["root"],
		optional: ["header", "body", "footer"],
	},

	slotContracts: {
		root: panelRootSlot,
		header: panelHeaderSlot,
		body: panelBodySlot,
		footer: panelFooterSlot,
	},

	ariaGuidance: {
		useLandmark:
			"Use role='region' when the panel represents a distinct, important section of the page " +
			"that users might want to navigate to directly. For decorative or minor groupings, no role is needed.",
		accessibleName:
			"When using role='region', provide an accessible name via aria-label " +
			"(e.g., 'User profile') or aria-labelledby referencing a heading inside the panel.",
		notes: [
			"Not all panels need to be landmarks — only use region for significant page sections",
			"If using aria-labelledby, ensure the referenced heading is inside the panel",
			"Consider the page structure — too many landmarks reduce their usefulness",
			"Panel is purely visual/layout — it has no interactive ARIA semantics",
		],
	},
};

// =============================================================================
// VALIDATION — Parse the layout contract
// =============================================================================

export const contract: LayoutComponentContract = LayoutComponentContractSchema.parse(rawContract);

// =============================================================================
// TYPED SLOT ATTRS — What Panel can optionally render
// =============================================================================

/**
 * Optional ARIA attributes for Panel root when used as a landmark.
 */
export interface PanelAriaAttrs {
	role?: "region" | "article" | "section";
	"aria-label"?: string;
	"aria-labelledby"?: string;
}

/**
 * Data attributes for Panel slots.
 */
export interface PanelDataAttrs {
	"data-kind": "panel";
	"data-slot": "root" | "header" | "body" | "footer";
}
