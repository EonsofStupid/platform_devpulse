/**
 * @file Card Definition — const literal for StyleMacro + VPB
 * @kind card
 */

import type { ComponentDef } from "$lib/design/components/_base/types.js";

export const cardDef = {
	kind: "card",
	defaultStyleId: "card-default",
	styleIds: ["card-default", "card-outlined", "card-elevated", "card-ghost", "card-glow"],
	slots: {
		root: "all",
		header: "none",
		body: "none",
		footer: "none",
	},
} as const satisfies ComponentDef;
