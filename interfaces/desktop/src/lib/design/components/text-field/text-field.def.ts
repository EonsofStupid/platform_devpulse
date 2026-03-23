/**
 * @file TextField Definition — const literal for StyleMacro + VPB
 * @kind text-field
 */

import type { ComponentDef } from "$lib/design/components/_base/types.js";

export const textFieldDef = {
	kind: "text-field",
	defaultStyleId: "text-field-default",
	styleIds: ["text-field-default"],
	slots: {
		root: "all",
		input: "none",
		label: "none",
	},
} as const satisfies ComponentDef;
