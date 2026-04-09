/**
 * Card anatomy — surface container grouping related content.
 *
 * Card slots follow the standard content regions pattern:
 * header, body, footer. The root element is the card surface.
 * Optionally interactive as a link or button card.
 *
 * WAI-ARIA: Use role="article" for standalone content cards.
 * Use role="region" + aria-label for landmark-level groupings.
 * Interactive cards (clickable) gain tabindex="0".
 */

export const cardAnatomy = {
	slots: ["root", "header", "body", "footer", "media"] as const,
	attrs: {
		root: {
			"data-kind": "card",
			"data-slot": "root",
		},
		header: {
			"data-kind": "card",
			"data-slot": "header",
		},
		body: {
			"data-kind": "card",
			"data-slot": "body",
		},
		footer: {
			"data-kind": "card",
			"data-slot": "footer",
		},
		media: {
			"data-kind": "card",
			"data-slot": "media",
		},
	},
} as const;
