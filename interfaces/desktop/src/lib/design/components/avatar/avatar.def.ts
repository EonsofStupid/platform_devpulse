/**
 * @file Avatar Definition — const literal for StyleMacro + VPB
 * @kind avatar
 */

import type { ComponentDef } from "$lib/design/components/_base/types.js";

export const avatarDef = {
	kind: "avatar",
	defaultStyleId: "avatar-default",
	styleIds: ["avatar-default"],
	slots: {
		root: "all",
		image: "none",
		fallback: "none",
	},
} as const satisfies ComponentDef;
