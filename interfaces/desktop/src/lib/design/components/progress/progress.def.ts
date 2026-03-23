/**
 * @file Progress Definition — const literal for StyleMacro + VPB
 * @kind progress
 */

import type { ComponentDef } from "$lib/design/components/_base/types.js";

export const progressDef = {
	kind: "progress",
	defaultStyleId: "progress-default",
	styleIds: ["progress-default"],
	slots: {
		root: "all",
		track: "none",
		fill: "none",
	},
} as const satisfies ComponentDef;
