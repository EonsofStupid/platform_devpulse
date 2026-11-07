/**
 * @file Heading Definition — const literal for StyleMacro + VPB
 * @kind heading
 */

import type { ComponentDef } from "$lib/design/components/_base/types.js";

export const headingDef = {
	kind: "heading",
	defaultStyleId: "heading-default",
	styleIds: ["heading-default"],
	slots: {
		root: "all",
	},
} as const satisfies ComponentDef;
