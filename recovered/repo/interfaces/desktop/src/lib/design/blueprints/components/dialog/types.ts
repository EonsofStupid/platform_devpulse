import type { BlueprintLegend } from "../../types.js";

export const dialogBlueprintIds = ["dialog.default"] as const;

export type DialogBlueprintId = (typeof dialogBlueprintIds)[number];

export const dialogBlueprints: BlueprintLegend = {
	kind: "dialog",
	defaultId: "dialog.default",
	ids: dialogBlueprintIds,
};
