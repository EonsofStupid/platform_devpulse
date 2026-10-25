import type { BlueprintLegend } from "../../types.js";

export const panelBlueprintIds = ["panel.default"] as const;

export type PanelBlueprintId = (typeof panelBlueprintIds)[number];

export const panelBlueprints: BlueprintLegend = {
	kind: "panel",
	defaultId: "panel.default",
	ids: panelBlueprintIds,
};
