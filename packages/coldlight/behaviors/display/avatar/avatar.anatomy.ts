/**
 * Avatar anatomy — circular user identity element with image or fallback.
 *
 * Displays a profile image when available, falling back to initials or a
 * generic icon. Uses role="img" on the root when no interactive behaviour.
 *
 * WAI-ARIA: role="img" with aria-label on root. image slot is aria-hidden.
 * Fallback slot is aria-hidden — label on root is the accessible name.
 */

export const avatarAnatomy = {
	slots: ["root", "image", "fallback"] as const,
	attrs: {
		root: {
			"data-kind": "avatar",
			"data-slot": "root",
		},
		image: {
			"data-kind": "avatar",
			"data-slot": "image",
		},
		fallback: {
			"data-kind": "avatar",
			"data-slot": "fallback",
		},
	},
} as const;
