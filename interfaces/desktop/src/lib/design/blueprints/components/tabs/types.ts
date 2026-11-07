import type { BlueprintLegend } from "../../types.js";

export const tabsBlueprintIds = ["tabs.default"] as const;

export type TabsBlueprintId = (typeof tabsBlueprintIds)[number];

export const tabsBlueprints: BlueprintLegend = {
	kind: "tabs",
	defaultId: "tabs.default",
	ids: tabsBlueprintIds,
};
