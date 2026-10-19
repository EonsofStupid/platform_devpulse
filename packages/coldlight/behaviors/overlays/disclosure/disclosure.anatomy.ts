/**
 * Disclosure anatomy — collapsible show/hide content (details/summary pattern).
 *
 * A disclosure has a trigger (the visible header/button) and a panel
 * (the collapsible content region). The trigger controls aria-expanded
 * and aria-controls to link the two semantically.
 *
 * WAI-ARIA: APG Disclosure Pattern.
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * - Trigger: role="button" (or native <button>), aria-expanded, aria-controls
 * - Panel: role="region", aria-labelledby (points to trigger)
 * - Keyboard: Enter/Space on trigger toggles the panel
 */

export const disclosureAnatomy = {
	slots: ["root", "trigger", "panel"] as const,
	attrs: {
		root: {
			"data-kind": "disclosure",
			"data-slot": "root",
		},
		trigger: {
			"data-kind": "disclosure",
			"data-slot": "trigger",
		},
		panel: {
			"data-kind": "disclosure",
			"data-slot": "panel",
		},
	},
} as const;
