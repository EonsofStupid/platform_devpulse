/**
 * @file Badge Definition — const literal for StyleMacro + VPB
 * @kind badge
 */

import type { ComponentDef } from "$lib/design/components/_base/types.js";

export const badgeDef = {
	kind: "badge",
	defaultStyleId: "badge-neutral",
	styleIds: [
		"badge-neutral",
		"badge-accent",
		"badge-positive",
		"badge-negative",
		"badge-notice",
		"badge-informative",
	],
	slots: {
		root: "all",
	},
} as const satisfies ComponentDef;
