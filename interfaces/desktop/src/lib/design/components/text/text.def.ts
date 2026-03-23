/**
 * @file Text Definition — const literal for StyleMacro + VPB
 * @kind text
 */

import type { ComponentDef } from "$lib/design/components/_base/types.js";

export const textDef = {
	kind: "text",
	defaultStyleId: "text-default",
	styleIds: ["text-default"],
	slots: {
		root: "all",
	},
} as const satisfies ComponentDef;
